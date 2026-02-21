# Content Import Notes

## Longform Import Rule (added 2026-02-20)
- For imported longform article HTML, remove the visible `Stay Connected` section from page body content.
- Keep those terms only in SEO metadata (for example `meta keywords` and/or JSON-LD `keywords`) when requested.
- Keep article sources and image references while adapting layout to WealthMeter design language.

## Theme + Toggle Integration Rule (added 2026-02-21)
- All new/public pages must include:
  - `<div id="header-placeholder"></div>`
  - `<div id="footer-placeholder"></div>`
  - `<script src="components.js"></script>` (before `</body>`)
- Do not ship custom `onclick="toggleTheme()"` logic on shared pages. `components.js` owns theme state.
- Use `dark-mode` only (not `dark`) for class-based theme styling.
- Avoid hard-coding dark text for emphasis in article templates (`strong`, `b`, `em`); let shared dark-mode rules handle contrast.
- Prefer CSS variables instead of fixed light-only colors (`#0f172a`, `#1e293b`, etc.) for body copy and labels.
- For longform warning/overstatement blocks, keep class name `.callout` so shared dark-mode styling auto-converts the light gradient panel to a dark readable panel.

## Pre-Publish Theme QA (required)
- Verify both `light` and `dark` modes on:
  - header + footer contrast
  - paragraph text + emphasized inline text (`strong`)
  - card/panel backgrounds vs text
  - inputs/selects/help text
  - primary CTA button readability
- Hard refresh check (`Cmd+Shift+R`) after deploy before sign-off.
