from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
required=['partners.html','embed-tools.html','assets/partner-public.css','embed/wealth-rank.html','embed/wealth-rank.js','assets/wealth-rank-widget.js','functions/api/widget-config.js','functions/api/widget-event.js','partners/capability-sheet.html','partners/underwriting-pilot.html','partners/health-wealth-package.html']
errors=[f'missing {path}' for path in required if not (ROOT/path).exists()]
widget=(ROOT/'assets/wealth-rank-widget.js').read_text()
if 'widget_impression' not in widget or 'intersectionRatio>=.5' not in widget: errors.append('qualified impression rule missing')
if 'keepalive:true' not in widget or 'navigator.sendBeacon' in widget: errors.append('reliable widget event transport missing')
if 'headers:{"content-type":"application/json"}' in widget: errors.append('widget event transport would trigger a sandboxed-iframe preflight')
if 'query.get("preview")==="public"&&hostOrigin===location.origin' not in widget: errors.append('first-party public widget demonstration gate missing')
if 'if(state.token)fetch(`${API_ORIGIN}/api/widget-event`' not in widget: errors.append('public widget demonstration must not write distribution events')
if 'const API_ORIGIN="https://lifemeter.xyz"' not in widget: errors.append('shared production widget API origin missing')
if 'canonical' not in (ROOT/'embed/wealth-rank.html').read_text(): errors.append('canonical link missing')
if 'Covered-market wealth rank' in (ROOT/'embed/wealth-rank.html').read_text(): errors.append('legacy widget label present')
if 'YOUR ESTIMATED COVERED-MARKET RANK' in (ROOT/'index.html').read_text(): errors.append('legacy homepage rank label present')
for policy_page in ('about.html','editorial-policy.html','disclaimer.html','privacy.html'):
    policy=(ROOT/policy_page).read_text()
    if 'assets/policy-pages.css' not in policy: errors.append(f'policy stylesheet missing: {policy_page}')
    if 'assets/policy-responsive.css' not in policy: errors.append(f'policy responsive stylesheet missing: {policy_page}')
    if 'class="policy-shell"' not in policy: errors.append(f'policy shell missing: {policy_page}')
for public_page in ('partners.html','embed-tools.html'):
    public=(ROOT/public_page).read_text()
    if 'name="robots" content="index,follow"' not in public: errors.append(f'public discovery page is not indexable: {public_page}')
    if 'internal review' in public.lower(): errors.append(f'internal-review language exposed: {public_page}')
if 'partners.html' not in (ROOT/'components.js').read_text(): errors.append('Partners footer discovery link missing')
for discovery_file in ('sitemap.xml','llms.txt','llms-full.txt'):
    discovery=(ROOT/discovery_file).read_text()
    if '/partners' not in discovery or '/embed-tools' not in discovery: errors.append(f'partner discovery routes missing: {discovery_file}')
for sensitive in ('net_worth','input_value','rank_value'):
    if sensitive in widget: errors.append(f'sensitive event key present: {sensitive}')
if errors:
    raise SystemExit('\n'.join(errors))
print('Phase 2 WealthMeter validation passed.')
