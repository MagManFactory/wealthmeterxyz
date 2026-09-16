#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${0}")/../.." && pwd)"
AUTOMATION_DIR="/Users/brao/.codex/automations/daily-longform-pair"
GOOGLE_ENV="${AUTOMATION_DIR}/google_api.env"

repo_path_for_site() {
  case "${1}" in
    wealthmeter) printf '%s\n' "/Volumes/Dropbox_Local/Dropbox/CODEX/CODING ARCHIVE/wealthmeter" ;;
    lifemeter) printf '%s\n' "/Volumes/Dropbox_Local/Dropbox/CODEX/CODING ARCHIVE/LIFEMETER-WEALTHMETER" ;;
    *)
      echo "Unknown site: ${1}" >&2
      return 1
      ;;
  esac
}

workspace_root() {
  if [[ -n "${DAILY_LONGFORM_PAIR_WORKSPACE:-}" && -d "${DAILY_LONGFORM_PAIR_WORKSPACE}" ]]; then
    printf '%s\n' "${DAILY_LONGFORM_PAIR_WORKSPACE}"
    return 0
  fi

  if git -C "${PWD}" rev-parse --show-toplevel >/dev/null 2>&1; then
    git -C "${PWD}" rev-parse --show-toplevel
    return 0
  fi

  printf '%s\n' "${ROOT_DIR}"
}

stage_path_for_site() {
  local site="${1}"
  local workspace_stage="$(workspace_root)/_automation_staging/${site}"
  local helper_stage="${ROOT_DIR}/_automation_staging/${site}"

  if [[ -d "${workspace_stage}" ]]; then
    printf '%s\n' "${workspace_stage}"
    return 0
  fi

  if [[ -d "${helper_stage}" ]]; then
    printf '%s\n' "${helper_stage}"
    return 0
  fi

  printf '%s\n' "${workspace_stage}"
}

publish_script_for_site() {
  case "${1}" in
    wealthmeter) printf '%s\n' "publish_wealthmeter.sh" ;;
    lifemeter) printf '%s\n' "publish_lifemeter.sh" ;;
    *)
      echo "Unknown site: ${1}" >&2
      return 1
      ;;
  esac
}

load_google_env() {
  if [[ ! -f "${GOOGLE_ENV}" ]]; then
    echo "Missing Google env file: ${GOOGLE_ENV}" >&2
    return 1
  fi
  set -a
  source "${GOOGLE_ENV}"
  set +a
  if [[ -z "${GOOGLE_API_KEY:-}" ]]; then
    echo "GOOGLE_API_KEY not exported from ${GOOGLE_ENV}" >&2
    return 1
  fi
}
