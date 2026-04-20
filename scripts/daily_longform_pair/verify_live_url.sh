#!/usr/bin/env zsh
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <url> <pattern> [pattern ...]" >&2
  exit 1
fi

url="${1}"
shift
body="$(curl -sSL "${url}")"

for pattern in "$@"; do
  if ! printf '%s' "${body}" | rg -q "${pattern}"; then
    echo "Missing pattern '${pattern}' in ${url}" >&2
    exit 1
  fi
done

echo "Verified ${url}"
