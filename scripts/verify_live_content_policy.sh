#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <domain> [hub_url ...]"
  exit 2
fi

DOMAIN="${1%/}"
shift || true

if [ "$#" -eq 0 ]; then
  set -- "$DOMAIN/longform.html"
fi

BANNED_REGEX='Visual[[:space:]]+Prompts?[[:space:]]+for[[:space:]]+the[[:space:]]+Design[[:space:]]+Team|[0-9]+\)[[:space:]]*Visual[[:space:]]+Prompt:'
RETRIES=6
SLEEP_SEC=20
STAMP="$(date +%s)"
TMP_DIR="$(mktemp -d "/tmp/live_content_policy.XXXXXX")"
TMP_URLS="${TMP_DIR}/urls.txt"
TMP_FAIL="${TMP_DIR}/failures.txt"
TMP_PAGE="${TMP_DIR}/page.html"
TMP_HIT="${TMP_DIR}/hit.txt"
touch "$TMP_URLS" "$TMP_FAIL" "$TMP_PAGE" "$TMP_HIT"
trap 'rm -rf "$TMP_DIR"' EXIT

fetch_status() {
  local url="$1"
  curl -sS -L -o "$TMP_PAGE" -w "%{http_code}" "${url}?cb=${STAMP}" || echo "000"
}

normalize_url() {
  local u="$1"
  if [[ "$u" =~ ^https?:// ]]; then
    echo "$u"
  elif [[ "$u" =~ ^/ ]]; then
    echo "${DOMAIN}${u}"
  else
    echo "${DOMAIN}/${u}"
  fi
}

sanitize_candidate() {
  local raw="$1"
  local cleaned="${raw%%#*}"
  cleaned="${cleaned%%\?*}"
  if [[ -z "$cleaned" ]]; then
    return 1
  fi

  if [[ "$cleaned" =~ ^https?:// ]]; then
    [[ "$cleaned" == "${DOMAIN}"/*.html ]] || return 1
    printf '%s\n' "$cleaned"
    return 0
  fi

  if [[ "$cleaned" =~ ^/ ]]; then
    [[ "$cleaned" =~ \.html$ ]] || return 1
    printf '%s\n' "$cleaned"
    return 0
  fi

  [[ "$cleaned" =~ ^[A-Za-z0-9._/-]+\.html$ ]] || return 1
  printf '%s\n' "$cleaned"
}

for hub in "$@"; do
  hub_url="$(normalize_url "$hub")"
  hub_code="$(fetch_status "$hub_url")"
  if [ "$hub_code" != "200" ]; then
    echo "Skipping hub URL (HTTP ${hub_code}): ${hub_url}"
    continue
  fi
  echo "$hub_url" >> "$TMP_URLS"
  if [ -s "$TMP_PAGE" ]; then
    cat "$TMP_PAGE" \
      | rg -o 'href="[^"]+\.html"' \
      | sed -E 's/^href="([^"]+)"$/\1/' \
      | while IFS= read -r rel; do
          sanitized="$(sanitize_candidate "$rel" || true)"
          [ -n "$sanitized" ] || continue
          normalize_url "$sanitized"
        done >> "$TMP_URLS"
  fi
done

sort -u "$TMP_URLS" -o "$TMP_URLS"

echo "Live content policy scan URL count: $(wc -l < "$TMP_URLS")"

if [ ! -s "$TMP_URLS" ]; then
  echo "Live content policy check failed: no crawlable URLs were collected."
  exit 1
fi

while IFS= read -r url; do
  [ -z "$url" ] && continue
  ok=0
  for i in $(seq 1 "$RETRIES"); do
    code="$(fetch_status "$url")"
    if [ "$code" = "200" ]; then
      if ! rg -n -i --pcre2 "$BANNED_REGEX" "$TMP_PAGE" >/tmp/live_content_hit.txt; then
        ok=1
        break
      fi
    elif [[ "$code" =~ ^4 ]]; then
      echo "HTTP ${code} for ${url}" > "$TMP_HIT"
      break
    fi
    sleep "$SLEEP_SEC"
  done

  if [ "$ok" -ne 1 ]; then
    {
      echo "=== ${url}"
      if [ -s "$TMP_HIT" ]; then
        cat "$TMP_HIT" | head -n 20
      else
        echo "No content fetched after retries."
      fi
    } >> "$TMP_FAIL"
  fi
done < "$TMP_URLS"

if [ -s "$TMP_FAIL" ]; then
  echo "Live content policy check failed."
  cat "$TMP_FAIL"
  exit 1
fi

echo "Live content policy check passed."
