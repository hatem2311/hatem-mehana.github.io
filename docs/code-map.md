# Review map

Start with this map, the current Git diff and a focused `rg` search. Expand the review when a shared dependency or unresolved behavior requires it. There is no fixed token savings guarantee.

| Feature | Files | Checks |
| --- | --- | --- |
| Home page entry | `js/home-entry.js`, `js/home-view.js` | `tests/browser.cjs`: home and resume |
| Homepage gameplay video | `js/home-video.js`, `tools/static-pages.mjs`, `shared.css` | browser: keyboard, mouse, touch, failure fallback, fixed ratio and three featured cards |
| Automatic card preview | `js/card-preview.js`, `js/projects.js`, `content/projects/azooma-escape.json`, `tools/static-pages.mjs`, `shared.css` | card-preview: real playback/loop, viewport lifecycle, reduced motion, blocked autoplay, failure and full-video activation |
| Project entry and details | `js/project-entry.js`, `js/project-view.js`, `js/about.js` | browser: all seven projects and stable/legacy URLs |
| Case studies and evidence | `js/case-study.js`, `js/about.js`, `js/schema.js`, `tools/static-pages.mjs`, `content/projects/`, `docs/case-studies.md` | schema and case-study tests; browser static parity, source links and mobile |
| Technical summaries | `content/projects/azooma-escape.json`, `js/case-study.js`, `js/about.js`, `tools/static-pages.mjs`, `docs/technical-systems.md` | documented contributions only; rejection of invented fields, static parity and mobile |
| Gallery and media | `js/gallery.js`, `js/media-viewer.js`, `js/dom.js`, `js/urls.js`, `js/sliders.js`, `docs/media-viewer.md` | browser: captions, fullscreen, keyboard, portrait/landscape, video failure and activation |
| Project cards and filters | `js/projects.js`, `js/project-facts.js`, `tools/static-pages.mjs` | browser: concise cards, engine/contribution, each filter; tasks35-40: seven unique projects and preserved detail facts |
| Tasks 35–40 polish | `docs/tasks35-40.md`, `tests/tasks35-40.cjs`, `design-system.css`, `shared.css`, `js/journey.js`, `js/loading.js` | compact mobile hero, gameplay poster/ratio, clean titles, Ice Blue links, text store links and visible return focus |
| Featured responsive grid | `portfolio-layout.css`, `js/projects.js`, `tools/static-pages.mjs`, `shared.css` | browser: 3 columns above 1000px, 2 at 769–1000px, 1 up to 768px; contribution and content unclipped |
| Recruiter journey | `js/journey.js`, `js/project-view.js` | browser: filter, scroll and focus restoration, next project/contact |
| Static content | `tools/static-pages.mjs`, `tools/templates/`, generated `index.html`, `page.html`, `projects/*.html` | build --check, browser without JavaScript and failed modules |
| Navigation and motion | `js/navigation.js`, `main.css`, `portfolio-layout.css`, `shared.css` | browser: keyboard, 320/360/390px, reduced motion and screenshots |
| Visual design | `design-system.css`, `portfolio-layout.css`, `shared.css` | browser: approved tokens, text contrast, mobile, keyboard and reduced motion |
| Direct contact | `js/contact.js`, `content/site.json`, `tools/static-pages.mjs` | browser: copy success/failure, keyboard activation and visible mailto fallback |
| Data contract and requests | `js/schema.js`, `js/data.js` | `tests/schema.test.mjs`, browser failure/retry cases |
| Loading UI | `js/loading.js`, `data-loading.css` | browser: 404, JSON, network, invalid IDs |
| Editorial sources | `content/site.json`, `content/projects.json`, `content/projects/<id>.json` | `node tools/build.mjs --check` |
| Local content editor | `tools/content-editor.mjs`, `tools/editor/`, `docs/content-editor.md` | `tests/content-editor.test.mjs`: full project, preview/save, upload, identity lock, backup/recovery, all project forms and mobile |
| Generated asset map | `content/assets-manifest.json`, `tools/optimize-images.py` | `tests/pipeline_test.py` |
| Generated browser bundle | `data.json`, `tools/build.mjs` | build contract and missing-file checks |
| Performance | `performance-budget.json`, `performance-check.cjs` | throttled Edge checks |
| SEO and share cards | `tools/seo.mjs`, `tools/share-cards.cjs`, `share/`, `docs/seo.md` | SEO unit tests, static metadata, card dimensions, production URL guard |
| Acceptance | `tests/acceptance.cjs`, `docs/usability-acceptance.md` | route widths, internal links, keyboard skip link, zoom emulation, external response limitations |

Entries import their dependencies explicitly. Image renderers receive the asset map as an argument; network loading does not own image or UI state. `js/sliders.js` imports the standalone vendored Swiper bundle with an explicit default export. Application rendering never reads `window.Swiper` or `window.swipe`.

For a gallery change, read `js/gallery.js`, the relevant project source, `js/dom.js`/`js/urls.js` if asset rules change, and the gallery scenarios in `tests/browser.cjs`. Review data/schema/build modules for a content-contract change. Do not impose an arbitrary file length limit.

This implementation review covered both HTML entries, the old combined scripts, shared styles, content and asset generation, current checks, and the eight tagged task descriptions. Later focused changes can start from the feature rows above.
