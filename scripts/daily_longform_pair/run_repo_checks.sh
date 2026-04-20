#!/usr/bin/env zsh
set -euo pipefail

source "$(dirname "${0}")/common.sh"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <wealthmeter|lifemeter> [python-script ...]" >&2
  exit 1
fi

site="${1}"
shift
repo_dir="$(repo_path_for_site "${site}")"

if [[ $# -gt 0 ]]; then
  python3 -m py_compile "${@/#/${repo_dir}/scripts/}"
fi

(
  cd "${repo_dir}"
  bash scripts/check_content_policy.sh
  git diff --check
)
