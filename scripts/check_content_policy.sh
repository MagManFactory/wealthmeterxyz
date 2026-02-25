#!/usr/bin/env bash
set -euo pipefail

BANNED_REGEX='Visual[[:space:]]+Prompts?[[:space:]]+for[[:space:]]+the[[:space:]]+Design[[:space:]]+Team|[0-9]+\)[[:space:]]*Visual[[:space:]]+Prompt:'
HTML_FILES="$(git ls-files '*.html')"

if [ -z "$HTML_FILES" ]; then
  echo "No tracked HTML files found."
  exit 0
fi

> /tmp/content_policy_hits.txt
FOUND=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -f "$f" ] || continue
  if rg -n -i --pcre2 "$BANNED_REGEX" "$f" >>/tmp/content_policy_hits.txt; then
    FOUND=1
  fi
done <<EOF
$HTML_FILES
EOF

if [ "$FOUND" -eq 1 ]; then
  echo "Content policy violation: banned internal prompt text found."
  cat /tmp/content_policy_hits.txt
  exit 1
fi

echo "Content policy check passed: no banned internal prompt text found."
