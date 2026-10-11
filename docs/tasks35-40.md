# Tasks 35–40 implementation

Implemented in order from existing content. Deferred tasks retain their existing scope and status; no new project evidence or production URL was invented.

35. Cards now contain media, name, short description, documented contribution, engine and View Details. Full role/platform/status facts and tags remain on every project detail page.
36. Default home shows three featured projects followed by the other four, each once. Category filters hide Featured and search all seven projects. Return navigation restores the selected filter, scroll and visible card focus. Loading preserves the filter's visibility decision.
37. Homepage gameplay uses an existing Azooma gameplay screenshot, not its title screen. The player is limited to 640px, reserves 16:9 space and loads the full video only after activation. Card preview behavior is unchanged.
38. Mobile hero uses a 180px portrait, smaller type and spacing. Desktop hero is unchanged.
39. Project names have their surrounding diamond ornaments removed; IDs, official spelling and routes are preserved. Metadata and share cards use the same names. Text links use Ice Blue with visible focus and hover states.
40. Store links use their existing text labels and URLs. Removing invalid Ionicon names eliminates the missing SVG request. Both existing Google Play URLs returned HTTP 404 during external checks; no replacement URL is known, so neither was fabricated.

## Layout measurements

Edge, viewport height 844px, reduced motion enabled; CSS pixels.

| Width | Hero before → after | Gameplay frame before → after | Featured start before → after |
| --- | --- | --- | --- |
| 320 | 825 → 591 | 180 → 180 | 1402 → 1160 |
| 390 | 767 → 530 | 219 → 219 | 1383 → 1139 |
| 1440 | 503 → 503 | 765 → 360 | 1719 → 1314 |

No horizontal overflow at these widths. Responsive grid remains three columns above 1000px, two at 769–1000px, and one at mobile widths.

## Verification

- `tests/tasks35-40.cjs`: unique cards, summaries, all category filters, static/dynamic parity, mobile/desktop measurements, keyboard video activation and stable ratio, clean titles, preserved detail facts/tags, Ice Blue video link and valid text store links.
- `tests/browser.cjs`: regression coverage for data failures, static fallbacks, responsive layouts, navigation/focus restoration, keyboard, contrast, video and gallery controls.
- `tests/card-preview.cjs`: 12 passing cases including native looping playback, YouTube muted preview lifecycle, reduced motion, denied autoplay, fallback and full-video input methods.
- Schema, case study and SEO: 16 passing tests; generated content matches sources.
- Acceptance: all eight routes, widths 1440/720/390/320, 25 internal links, no JavaScript errors in Edge. Chrome, Firefox and WebKit runtimes were unavailable; mobile checks are viewport/input emulation, not physical-device testing.
- Six throttled performance samples passed: initial home transfer at most 295216 bytes, project at most 452504 bytes; LCP at most 2284ms, CLS 0, under the existing 460800-byte/2500ms/0.1 budgets. Full video traffic is activation-dependent.

Local verification only; no deployment was performed.
