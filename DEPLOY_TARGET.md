# Deploy Target

- Domain: `wealthmeter.xyz`
- Repository: `https://github.com/MagManFactory/wealthmeterxyz.git`
- Deploy branch: `main`
- Publish script: `publish_wealthmeter.sh`

## Guardrails

1. Run `scripts/check_content_policy.sh` before every push.
2. Keep GitHub Actions `content-policy.yml` green on `main`.
3. After push, run live verification:
   - `scripts/verify_live_content_policy.sh https://wealthmeter.xyz https://wealthmeter.xyz/longform.html`

## Branch Protection (GitHub settings)

Enable branch protection on `main` and require these status checks:
- `Content Policy / content-policy`
- `Content Policy / live-verify`

