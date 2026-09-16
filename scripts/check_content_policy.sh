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

> /tmp/wealthmeter_payhip_route_hits.txt
FOUND=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -f "$f" ] || continue
  case "$f" in
    report-wealth-thresholds.html|report-velocity-of-capital.html|report-geography-global-wealth.html)
      continue
      ;;
  esac
  if rg -n 'https://payhip\.com/' "$f" >>/tmp/wealthmeter_payhip_route_hits.txt; then
    FOUND=1
  fi
done <<EOF
$HTML_FILES
EOF

if [ "$FOUND" -eq 1 ]; then
  echo "Report routing violation: Payhip links are allowed only on report detail pages."
  cat /tmp/wealthmeter_payhip_route_hits.txt
  exit 1
fi

echo "Content policy check passed: no banned internal prompt text found."
echo "Report routing check passed: external checkout appears only on report detail pages."
