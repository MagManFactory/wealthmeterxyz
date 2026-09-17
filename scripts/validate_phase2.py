from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
required=['embed/wealth-rank.html','embed/wealth-rank.js','assets/wealth-rank-widget.js','functions/api/widget-config.js','functions/api/widget-event.js','partners/capability-sheet.html','partners/underwriting-pilot.html','partners/health-wealth-package.html']
errors=[f'missing {path}' for path in required if not (ROOT/path).exists()]
widget=(ROOT/'assets/wealth-rank-widget.js').read_text()
if 'widget_impression' not in widget or 'intersectionRatio>=.5' not in widget: errors.append('qualified impression rule missing')
if 'canonical' not in (ROOT/'embed/wealth-rank.html').read_text(): errors.append('canonical link missing')
for sensitive in ('net_worth','input_value','rank_value'):
    if sensitive in widget: errors.append(f'sensitive event key present: {sensitive}')
if errors:
    raise SystemExit('\n'.join(errors))
print('Phase 2 WealthMeter validation passed.')
