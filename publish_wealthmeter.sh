#!/usr/bin/env bash
set -euo pipefail

TARGET_DOMAIN="https://wealthmeter.xyz"
EXPECTED_REMOTE="https://github.com/MagManFactory/wealthmeterxyz.git"
DEPLOY_BRANCH="main"

echo "Publish target domain: ${TARGET_DOMAIN}"
echo "Expected repo: ${EXPECTED_REMOTE}"
echo "Deploy branch: ${DEPLOY_BRANCH}"

ACTUAL_REMOTE="$(git remote get-url origin)"
ACTUAL_BRANCH="$(git branch --show-current)"

if [ "$ACTUAL_REMOTE" != "$EXPECTED_REMOTE" ]; then
  echo "Refusing publish: origin remote mismatch."
  echo "Actual: ${ACTUAL_REMOTE}"
  exit 1
fi

if [ "$ACTUAL_BRANCH" != "$DEPLOY_BRANCH" ]; then
  echo "Refusing publish: current branch is ${ACTUAL_BRANCH}, expected ${DEPLOY_BRANCH}."
  exit 1
fi

bash scripts/check_content_policy.sh
python3 scripts/check_longform_order.py

if [ "${CONFIRM_DEPLOY:-0}" != "1" ]; then
  echo "Dry run complete. Set CONFIRM_DEPLOY=1 to push."
  exit 0
fi

git push origin "$DEPLOY_BRANCH"
python3 scripts/check_longform_order.py --live "$TARGET_DOMAIN"
bash scripts/verify_live_content_policy.sh "$TARGET_DOMAIN" "$TARGET_DOMAIN/longform.html"

echo "Publish completed."
