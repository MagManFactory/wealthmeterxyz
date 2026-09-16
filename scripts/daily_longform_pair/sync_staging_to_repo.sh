#!/usr/bin/env zsh
set -euo pipefail

source "$(dirname "${0}")/common.sh"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <wealthmeter|lifemeter>" >&2
  exit 1
fi

site="${1}"
stage_dir="$(stage_path_for_site "${site}")"
repo_dir="$(repo_path_for_site "${site}")"

if [[ ! -d "${stage_dir}" ]]; then
  echo "Missing staging directory: ${stage_dir}" >&2
  echo "Checked workspace root: $(workspace_root)" >&2
  exit 1
fi

for item in "${stage_dir}"/*; do
  name="$(basename "${item}")"
  case "${name}" in
    scripts)
      mkdir -p "${repo_dir}/scripts"
      for script in "${stage_dir}/scripts"/*; do
        cp "${script}" "${repo_dir}/scripts/"
      done
      ;;
    images|output|memory)
      ;;
    *)
      cp "${item}" "${repo_dir}/"
      ;;
  esac
done

echo "Synced ${site} staging from ${stage_dir} into ${repo_dir}"
