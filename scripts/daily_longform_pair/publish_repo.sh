#!/usr/bin/env zsh
set -euo pipefail

source "$(dirname "${0}")/common.sh"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <wealthmeter|lifemeter>" >&2
  exit 1
fi

site="${1}"
repo_dir="$(repo_path_for_site "${site}")"
publish_script="$(publish_script_for_site "${site}")"

(
  cd "${repo_dir}"
  CONFIRM_DEPLOY=1 "./${publish_script}"
)
