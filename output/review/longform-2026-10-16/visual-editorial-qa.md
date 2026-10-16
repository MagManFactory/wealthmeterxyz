# October 16 paired longform release QA — wealthmeter

- Owner-list topic: The Cash-Flow Cost of Private School.
- Direct production preflight: target article 404; target slug absent from live longform hub and sitemap.
- Primary sources and visual text checks: `source-manifest.json`; prompts: `art-prompts.json`, `art-prompts-v2.json` and where present `art-prompts-v3.json`.
- Direct Google Nano Banana 2 Lite (`gemini-3.1-flash-lite-image`), 1K, 16:9. Per-call receipts are under `output/review/longform-generation/`. All outputs are true 1376 × 768 PNGs. Unused original candidates remain preserved and are excluded from article and hub.
- Complete article-only PDF rendered in this folder and read from start to sources. Both published images were visually reviewed; the selected images appear in the PDF. Browser-specific interactive chrome layout has not been verified.
- Complete article text, headings, captions, metadata, social fields, first hub card, feed description, and visible image text were read. Exact phrase search and paraphrased avoid-rules review passed after removing one contrast sentence in the WealthMeter article. No unsupported quantitative visual mark is published.
- Scoped XML, metadata uniqueness, same-brand links, two-image references, and first hub card passed. Repository gates and deployment remain separately recorded in the ledger.
