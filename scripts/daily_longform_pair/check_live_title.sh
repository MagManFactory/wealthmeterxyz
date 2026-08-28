#!/usr/bin/env zsh
set -euo pipefail

source "$(dirname "${0}")/common.sh"

usage() {
  cat >&2 <<'EOF'
Usage: check_live_title.sh <wealthmeter|lifemeter> <slug> <title-regex> [--expect-live|--expect-missing]
EOF
  exit 1
}

if [[ $# -lt 3 || $# -gt 4 ]]; then
  usage
fi

site="${1}"
slug="${2}"
title_pattern="${3}"
expectation="${4:-}"

article_url="$(site_article_url "${site}" "${slug}")"
hub_url="$(site_longform_url "${site}")"
sitemap_url="$(site_sitemap_url "${site}")"

article_body="$(curl -fsSL "${article_url}" || true)"
hub_body="$(curl -fsSL "${hub_url}")"
sitemap_body="$(curl -fsSL "${sitemap_url}")"

article_live=0
hub_lists_title=0
sitemap_lists_slug=0

if [[ -n "${article_body}" ]] && printf '%s' "${article_body}" | rg -q "${title_pattern}" && ! printf '%s' "${article_body}" | rg -q '<h1>404</h1>'; then
  article_live=1
fi

if printf '%s' "${hub_body}" | rg -q "${title_pattern}"; then
  hub_lists_title=1
fi

if printf '%s' "${sitemap_body}" | rg -q "/${slug}\\.html"; then
  sitemap_lists_slug=1
fi

live_status="missing"
if [[ "${article_live}" -eq 1 || "${hub_lists_title}" -eq 1 || "${sitemap_lists_slug}" -eq 1 ]]; then
  live_status="live"
fi

printf 'site=%s\n' "${site}"
printf 'slug=%s\n' "${slug}"
printf 'article_url=%s\n' "${article_url}"
printf 'hub_url=%s\n' "${hub_url}"
printf 'sitemap_url=%s\n' "${sitemap_url}"
printf 'article_live=%s\n' "${article_live}"
printf 'hub_lists_title=%s\n' "${hub_lists_title}"
printf 'sitemap_lists_slug=%s\n' "${sitemap_lists_slug}"
printf 'status=%s\n' "${live_status}"

case "${expectation}" in
  --expect-live)
    [[ "${live_status}" == "live" ]] || {
      echo "Expected live, but ${slug} is missing on ${site}" >&2
      exit 1
    }
    ;;
  --expect-missing)
    [[ "${live_status}" == "missing" ]] || {
      echo "Expected missing, but ${slug} already appears live on ${site}" >&2
      exit 1
    }
    ;;
  "")
    ;;
  *)
    usage
    ;;
esac
