#!/usr/bin/env zsh
set -euo pipefail

TARGET_DOMAIN="https://wealthmeter.xyz"
EXPECTED_REMOTE_HTTPS="https://github.com/MagManFactory/wealthmeterxyz.git"
EXPECTED_REMOTE_SSH="git@github.com:MagManFactory/wealthmeterxyz.git"
DEPLOY_BRANCH="main"

echo "Publish target domain: ${TARGET_DOMAIN}"
echo "Expected repo: ${EXPECTED_REMOTE_HTTPS} or ${EXPECTED_REMOTE_SSH}"
echo "Deploy branch: ${DEPLOY_BRANCH}"

ACTUAL_REMOTE="$(git remote get-url origin)"
ACTUAL_PUSH_REMOTE="$(git remote get-url --push origin)"
ACTUAL_BRANCH="$(git branch --show-current)"

if [ "$ACTUAL_REMOTE" != "$EXPECTED_REMOTE_HTTPS" ] && [ "$ACTUAL_REMOTE" != "$EXPECTED_REMOTE_SSH" ]; then
  echo "Refusing publish: origin remote mismatch."
  echo "Actual: ${ACTUAL_REMOTE}"
  exit 1
fi

if [ "$ACTUAL_PUSH_REMOTE" != "$EXPECTED_REMOTE_HTTPS" ] && [ "$ACTUAL_PUSH_REMOTE" != "$EXPECTED_REMOTE_SSH" ]; then
  echo "Refusing publish: origin push remote mismatch."
  echo "Actual: ${ACTUAL_PUSH_REMOTE}"
  exit 1
fi

if [ "$ACTUAL_BRANCH" != "$DEPLOY_BRANCH" ]; then
  echo "Refusing publish: current branch is ${ACTUAL_BRANCH}, expected ${DEPLOY_BRANCH}."
  exit 1
fi

bash scripts/check_content_policy.sh
python3 scripts/check_longform_order.py
git diff --check

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Refusing publish: tracked changes remain after validation. Commit the exact release first."
  exit 1
fi

if [ "${CONFIRM_DEPLOY:-0}" != "1" ]; then
  echo "Dry run complete. Set CONFIRM_DEPLOY=1 to push."
  exit 0
fi

git fetch origin "$DEPLOY_BRANCH"
if ! git merge-base --is-ancestor "origin/${DEPLOY_BRANCH}" HEAD; then
  echo "Refusing publish: origin/${DEPLOY_BRANCH} advanced. Rebase and rerun checks."
  exit 1
fi

git push origin "HEAD:${DEPLOY_BRANCH}"
python3 scripts/check_longform_order.py --live "$TARGET_DOMAIN"
bash scripts/verify_live_content_policy.sh "$TARGET_DOMAIN" "$TARGET_DOMAIN/longform.html"

echo "Publish completed."
