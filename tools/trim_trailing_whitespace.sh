#!/usr/bin/env bash
# Trim trailing whitespace from all text files in the repository
# Usage:
#   ./tools/trim_trailing_whitespace.sh [--dry-run] [--git-only]
# Options:
#   --dry-run   : show files that would be modified (no changes)
#   --git-only  : operate only on git-tracked files

set -euo pipefail

DRY_RUN=false
GIT_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --git-only) GIT_ONLY=true; shift ;;
    -h|--help)
      sed -n '1,200p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
done

# Helper: determine whether a file is text
is_text_file() {
  local file="$1"
  # grep -Iq returns 0 for text files, non-zero for binary
  if grep -Iq . -- "$file" 2>/dev/null; then
    return 0
  fi
  return 1
}

# Get list of files
get_files() {
  if $GIT_ONLY; then
    if ! command -v git >/dev/null 2>&1; then
      echo "git not found, cannot use --git-only" >&2
      exit 2
    fi
    git ls-files -z
  else
    # Exclude .git and node_modules for speed
    find . -type f -not -path './.git/*' -not -path './node_modules/*' -print0
  fi
}

modified_count=0
checked_count=0

# Processing (null-delimited file list to handle spaces)
get_files | while IFS= read -r -d '' file; do
  # Skip the script itself to avoid changing while running
  if [[ "$file" == "./tools/trim_trailing_whitespace.sh" || "$file" == "tools/trim_trailing_whitespace.sh" ]]; then
    continue
  fi

  # Only process regular files
  if [[ ! -f "$file" ]]; then
    continue
  fi

  if ! is_text_file "$file"; then
    continue
  fi

  checked_count=$((checked_count + 1))

  # Detect trailing whitespace (spaces or tabs at EOL) or CRLF via file command
  if grep -nH -E '[ \t]+$' -- "$file" >/dev/null 2>&1 || file --mime-encoding "$file" 2>/dev/null | grep -q 'crlf'; then
    if $DRY_RUN; then
      echo "Would modify: $file"
      continue
    fi

    # Safely process line-by-line using awk to avoid touching newline characters.
    # - Remove trailing CR (\r) first
    # - Remove trailing spaces and tabs
    # We write to a temporary file and only replace the original if line count is preserved.
    tmpfile=$(mktemp "${file}.tmp.XXXXXX")
    # Use awk which preserves records (lines) even if final newline is missing
    awk '{ sub(/\r$/, ""); sub(/[ \t]+$/, ""); print }' "$file" > "$tmpfile"

    # Compare record counts using awk (works even if final newline is missing)
    lines_before=$(awk 'END{print NR}' "$file")
    lines_after=$(awk 'END{print NR}' "$tmpfile")

    if [[ "$lines_before" -ne "$lines_after" ]]; then
      echo "Skipping modification of $file - line count would change: $lines_before -> $lines_after" >&2
      rm -f "$tmpfile"
      continue
    fi

    # Preserve original file permissions
    perms=$(stat -c %a -- "$file" 2>/dev/null || echo 644)

    # Atomically replace the file
    mv -- "$tmpfile" "$file"
    chmod -- "$perms" "$file" || true

    modified_count=$((modified_count + 1))
    echo "Modified: $file"
  fi

done

if $DRY_RUN; then
  echo "Dry-run complete. Files that would be changed were listed above."
else
  echo "Done. Checked $checked_count text files, modified $modified_count files."
fi

exit 0
