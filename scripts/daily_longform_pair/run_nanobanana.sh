#!/usr/bin/env zsh
set -euo pipefail

source "$(dirname "${0}")/common.sh"

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <wealthmeter|lifemeter> <script-name.py>" >&2
  exit 1
fi

site="${1}"
script_name="${2}"
repo_dir="$(repo_path_for_site "${site}")"

load_google_env
cd "${repo_dir}"
python3 "scripts/${script_name}"
