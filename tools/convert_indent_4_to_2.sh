#!/usr/bin/env bash
# Convert indentation from 4 spaces to 2 spaces for files with extensions js, html, css
# Usage:
#   ./tools/convert_indent_4_to_2.sh [--dry-run] [--git-only] [--exclude DIR]

set -euo pipefail

DRY_RUN=false
GIT_ONLY=false
EXCLUDE_PATTERNS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --git-only) GIT_ONLY=true; shift ;;
    --exclude) EXCLUDE_PATTERNS+=("$2"); shift 2 ;;
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

# Get files to process (null-delimited)
get_files() {
  if $GIT_ONLY; then
    if ! command -v git >/dev/null 2>&1; then
      echo "git not found, cannot use --git-only" >&2
      exit 2
    fi
    git ls-files -z
  else
    find . -type f -not -path './.git/*' -print0
  fi
}

# Check file extension
is_target_file() {
  local f="$1"
  case "$f" in
    *.js|*.css|*.html) return 0 ;;
    *) return 1 ;;
  esac
}

# Exclude patterns
is_excluded() {
  local f="$1"
  for pat in "${EXCLUDE_PATTERNS[@]}"; do
    if [[ "$f" == ./$pat/* || "$f" == $pat || "$f" == ./$pat ]]; then
      return 0
    fi
  done
  return 1
}

is_text_file() {
  local file="$1"
  if grep -Iq . -- "$file" 2>/dev/null; then
    return 0
  fi
  return 1
}

modified_count=0
checked_count=0

get_files | while IFS= read -r -d '' file; do
  # Skip self
  if [[ "$file" == "./tools/convert_indent_4_to_2.sh" ]]; then
    continue
  fi

  if [[ ! -f "$file" ]]; then
    continue
  fi

  if ! is_target_file "$file"; then
    continue
  fi

  if is_excluded "$file"; then
    continue
  fi

  if ! is_text_file "$file"; then
    continue
  fi

  checked_count=$((checked_count + 1))

  # Detect presence of 4-space indentation at line start
  if ! grep -nH -E '^ {4,}' -- "$file" >/dev/null 2>&1; then
    continue
  fi

  if $DRY_RUN; then
    echo "Would modify: $file"
    continue
  fi

  tmpfile=$(mktemp "${file}.tmp.XXXXXX")

  # AWK: For each line, count leading spaces (not tabs). Convert groups of 4 spaces -> 2 spaces per group; keep remainder spaces.
  awk '{ match($0,/^ */); lead=RLENGTH; rest=substr($0,lead+1);
        levels=int(lead/4); rem=lead%4; newlead=levels*2 + rem; printf "%*s%s", newlead, "", rest; if (NR>0) printf "\n" }' "$file" > "$tmpfile"

  # Ensure line count preserved
  lines_before=$(awk 'END{print NR}' "$file")
  lines_after=$(awk 'END{print NR}' "$tmpfile")

  if [[ "$lines_before" -ne "$lines_after" ]]; then
    echo "Skipping $file - line count would change: $lines_before -> $lines_after" >&2
    rm -f "$tmpfile"
    continue
  fi

  perms=$(stat -c %a -- "$file" 2>/dev/null || echo 644)
  mv -- "$tmpfile" "$file"
  chmod -- "$perms" "$file" || true

  modified_count=$((modified_count + 1))
  echo "Modified: $file"

done

if $DRY_RUN; then
  echo "Dry-run complete. Files that would be changed were listed above."
else
  echo "Done. Checked $checked_count files, modified $modified_count files."
fi

exit 0
