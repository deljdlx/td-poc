#!/usr/bin/env bash
# Test for convert_indent_4_to_2.sh
set -euo pipefail

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

cp "$(pwd)/tools/convert_indent_4_to_2.sh" "$TMPDIR/convert.sh"
chmod +x "$TMPDIR/convert.sh"

pushd "$TMPDIR" >/dev/null

# Create a sample file with various indent levels and tabs
# Create a sample file with various indent levels and tabs
# Use printf to include a real TAB character (\t)
printf 'function test() {\n' > sample.js
printf '    // 1 level (4 spaces)\n' >> sample.js
printf '        // 2 levels (8 spaces)\n' >> sample.js
printf '  // 1 level with 2 leading spaces\n' >> sample.js
printf $'\t// tab indent (should remain)\n' >> sample.js
printf '    var x = 1;    // trailing spaces should remain\n' >> sample.js
printf '}\n' >> sample.js

# Record original content
orig=$(cat sample.js)

# Run converter
"$TMPDIR/convert.sh"

# Check results: lines that started with 4 spaces should now start with 2
line1=$(sed -n '2p' sample.js)
line2=$(sed -n '3p' sample.js)
lineTab=$(sed -n '5p' sample.js)

if [[ "$line1" != "  // 1 level (4 spaces)" ]]; then
  echo "FAIL: Line1 incorrect: '$line1'" >&2
  exit 1
fi

if [[ "$line2" != "    // 2 levels (8 spaces)" ]]; then
  echo "FAIL: Line2 incorrect: '$line2'" >&2
  exit 1
fi

# Tab-indented line should be untouched (starts with actual TAB)
if [[ "$lineTab" != $'\t// tab indent (should remain)' ]]; then
  echo "FAIL: Tab line modified: '$lineTab'" >&2
  exit 1
fi

# Ensure trailing spaces internal to line are preserved and leading 4->2
lastLine=$(sed -n '6p' sample.js)
if [[ "$lastLine" != "  var x = 1;    // trailing spaces should remain" ]]; then
  echo "FAIL: trailing or leading spaces were changed: '$lastLine'" >&2
  exit 1
fi

# Ensure line count preserved
lines_before=$(echo "$orig" | awk 'END{print NR}')
lines_after=$(awk 'END{print NR}' sample.js)
if [[ "$lines_before" -ne "$lines_after" ]]; then
  echo "FAIL: Line count changed: $lines_before -> $lines_after" >&2
  exit 1
fi

 echo "PASS: indent conversion behaves as expected"

popd >/dev/null

exit 0
