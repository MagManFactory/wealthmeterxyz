# Daily Longform Pair Helpers

These helper scripts keep the recurring automation on a small, repeatable command set.

## Scripts

- `sync_staging_to_repo.sh <wealthmeter|lifemeter>`
  - Copies the prepared files from `_automation_staging/<site>/` into the publish repo.
  - Resolution order: current worktree `_automation_staging/<site>`, then helper-repo `_automation_staging/<site>` as a backward-compatible fallback.
- `run_nanobanana.sh <wealthmeter|lifemeter> <script-name.py>`
  - Loads `google_api.env` with export semantics and runs the requested Nano Banana script in the target repo.
- `run_repo_checks.sh <wealthmeter|lifemeter> [python-script ...]`
  - Optionally compiles the listed Python scripts, then runs `check_content_policy.sh` and `git diff --check`.
- `publish_repo.sh <wealthmeter|lifemeter>`
  - Runs the correct publish script with `CONFIRM_DEPLOY=1`.
- `verify_live_url.sh <url> <pattern> [pattern ...]`
  - Follows redirects and confirms the requested live page contains the expected markers.
- `check_live_title.sh <wealthmeter|lifemeter> <slug> <title-regex> [--expect-live|--expect-missing]`
  - Checks the live article URL, the live longform hub, and the live sitemap for a candidate story before drafting or republishing it.

## Intended Automation Shape

Future runs should prefer:

0. `zsh scripts/daily_longform_pair/check_live_title.sh ...`
1. stage file preparation in the active worktree under `_automation_staging/<site>/`
2. `zsh scripts/daily_longform_pair/sync_staging_to_repo.sh <site>`
3. `zsh scripts/daily_longform_pair/run_nanobanana.sh <site> <script-name.py>`
4. `zsh scripts/daily_longform_pair/run_repo_checks.sh ...`
5. `git add`, `git commit`, `git push`
6. `zsh scripts/daily_longform_pair/publish_repo.sh <site>`
7. `zsh scripts/daily_longform_pair/verify_live_url.sh ...`

If an automation needs to override the worktree explicitly, set `DAILY_LONGFORM_PAIR_WORKSPACE` before invoking the helper.

## Test Overrides

If the automation prompt is put into a temporary test mode, keep the override small and explicit in automation memory:

- one LifeMeter title
- one WealthMeter title
- their expected slugs
- whether the test expects them to be live or missing

Then verify the override pair first with `check_live_title.sh` before any drafting, sync, or publish steps.
