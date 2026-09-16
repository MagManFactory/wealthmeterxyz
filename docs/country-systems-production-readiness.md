+# Country Systems Atlas production-readiness plan

**Status:** Internal production candidate  
**Release gate:** Do not merge, index, or announce until owner approval  
**Current scope:** 60 countries, eight World Bank-delivered indicators, two- or three-country comparison

## Product decision

Publish two lens-specific pages backed by the same versioned data snapshot and build script:

- LifeMeter interprets national systems through longevity and human capacity.
- WealthMeter interprets the same observations through capital capacity and practical opportunity.

The evidence layer remains shared so the sites cannot drift into conflicting values. Copy, calls to action, related tools, and visual accents remain site-specific.

## Production URL and compatibility

Use `/country-systems-atlas.html` as the permanent public URL on both sites. At release, retain `/country-systems-phase1.html` as a query-preserving redirect so saved review links do not break. Update sister-site links, global components, analytics, canonical tags, and share URLs to the permanent route in the same release.

The review build intentionally remains at the prototype route with `noindex, nofollow`.

## Integration already built for review

- A two-country and three-country selector controls the matrix, charts, metric cards, social card, and URL.
- URL state preserves comparison size, selected countries, and focus metric.
- Duplicate country choices are disabled in active selectors.
- Global Analyze navigation and site footer expose the atlas inside each draft branch.
- The home page and the nearest existing data hub include prominent entry cards in each draft branch.
- Each page links into the site's main calculator, data explorer or atlas, longform hub, and sister-site atlas.
- A result-aware social card includes the measure, countries, current values, observation years, comparison-set positions, provider context, and site address.
- Users can use native sharing, X, LinkedIn, WhatsApp, copy-link, or PNG download.
- Optional GA4 events are emitted through the existing site analytics bootstrap:
  - `country_systems_view`
  - `country_systems_mode_change`
  - `country_systems_country_change`
  - `country_systems_metric_change`
  - `country_systems_share`
  - `country_systems_related_click`

## Go-live link architecture

On approval, use the permanent atlas URL in:

1. The global Analyze dropdown and footer on every page.
2. LifeMeter's Global Data Atlas and WealthMeter's Wealth Explorer as prominent related-tool cards.
3. The home-page tool area on each site.
4. Relevant longform pieces about life expectancy, infrastructure, wealth geography, mobility, and health-wealth mismatch.
5. The sister-site switch on both atlas pages.
6. `sitemap.xml`, `llms.txt`, and the appropriate structured-data graph.

Do not scatter links across unrelated longform. Contextual links should explain why the atlas helps answer the question raised by the article.

## Search and social metadata at release

- Replace `noindex, nofollow` with `index, follow`.
- Add a self-referencing canonical for the permanent URL.
- Add static Open Graph and X metadata with a generic 1200 x 630 atlas image.
- Keep query parameters out of canonical URLs. The URL parameters reproduce a comparison for people, but the canonical remains the base atlas page.
- Add `WebApplication` and `Dataset` JSON-LD. Describe the eight included measures and identify the World Bank delivery source and indicator-level original providers.
- Add the permanent page to each sitemap and `llms.txt`.
- Do not attempt serverless dynamic Open Graph images in the first release. The built-in PNG export already carries the selected result; a static generic unfurl is more reliable and easier to cache.

## Data and rights controls

- Continue serving a generated static snapshot. Do not call provider APIs in a visitor's browser.
- Show an observation year for every value.
- Run the existing builder and quality checks before each data refresh.
- Review freshness quarterly and rebuild when upstream observations change materially.
- Keep ITU, WHO, and IRENA measures excluded until a written response authorizes the proposed transformations and mixed commercial context.
- A delivered request is not permission. `data/country-systems-rights.json` remains the release gate.

## Release checks

- Validate both two- and three-country URLs after a hard reload.
- Confirm all active selectors contain 60 alphabetized, mutually exclusive options.
- Check matrix, trend chart, scatterplot, metric cards, share preview, PNG output, and platform links at desktop and mobile widths.
- Confirm keyboard focus, form labels, chart accessible names, and color contrast.
- Confirm the result card never presents comparison-set position as a global development rank.
- Verify analytics events in GA4 DebugView without collecting user-entered personal data.
- Verify canonical, Open Graph, JSON-LD, sitemap, `llms.txt`, robots behavior, and the legacy redirect.
- Run repository content-policy and report-routing checks.
- Verify the final pages, navigation entry points, assets, and sister-site links on both production domains before announcing the launch.

## Approval boundary

The current branches are suitable for internal review. The remaining live-release changes are intentionally withheld: permanent-route migration, indexing, sitemap and `llms.txt` inclusion, production social metadata, static-component regeneration across the full site, and merge to the production branches.
