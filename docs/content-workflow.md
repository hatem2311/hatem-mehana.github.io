# Content and checks

The site remains a static site. Serve the repository over HTTP; ES modules and JSON fetches do not work reliably from a file URL. No application server is required in production.

## Edit a project

Edit only `content/projects/<id>.json` for that project's text, tags, source image paths, gallery, role or duration. General biography, skills, work and social links live in `content/site.json`. `content/projects.json` contains ordering, stable IDs, legacy numeric IDs and source filenames. Never renumber an existing legacy ID or change a stable ID when reordering.

The browser continues to accept `page.html?id=0` through `page.html?id=6`. `page.html?project=horror-home` also works and remains stable when the index is reordered. Source images are kept at their original paths. Do not edit `data.json` or `content/assets-manifest.json` by hand.

Run `rtk node tools/build.mjs` after text edits. It validates the browser schema, resolves assets, detects missing references, and generates `data.json`, `index.html`, the legacy `page.html` entry and seven `projects/<id>.html` pages. Edit HTML structure in `tools/templates/` and static rendering in `tools/static-pages.mjs`; generated HTML is not an editorial source. An unchanged build leaves generated files unchanged. `rtk node tools/build.mjs --check` validates and rejects stale generated HTML without writing.

Set `featuredProjectIds` in `content/site.json` to exactly three distinct stable project IDs. Skills use `projectIds` to link to evidence. These references are validated against the project index. Hero greeting and role are also editorial fields. The featured and full project grids are static; filters progressively enhance the full grid. Home content, project details, screenshots, store links, CV, and contact remain available with JavaScript disabled. Legacy query URLs need JavaScript to select their project; the fallback provides links to all static project pages.

The Back to Projects link restores the last selected filter, scroll position, and project card focus within the same tab using optional session storage. Direct visitors get the full project list. The gallery slider has no autoplay and respects reduced motion. Mobile navigation is inert when closed, loops focus while open, and returns focus on Escape. Without JavaScript, the navigation remains a visible list of links.

The browser suite additionally checks static pages without JavaScript, failed modules, retained content during fetch errors, 320/360/390px viewports, desktop grid columns, keyboard navigation, filter/scroll/focus restoration, and reduced motion. Layout screenshots are saved as `task21-home-desktop.png`, `task21-home-mobile.png`, and `task21-project-desktop.png`.

The approved palette and 8px spacing tokens are centralized in `design-system.css`, loaded on both home and project pages. Palette contrast results are saved in `design-contrast-results.json`. The contact email comes from the `mailto:` entry in `content/site.json`; the static address remains visible without JavaScript. The copy button progressively enhances it and announces success or a manual-copy fallback through an accessible status. Availability, time zone and testimonials require confirmed source information before adding them.

## Add or update images

Place the original image in `images/` and reference it in the relevant source content file. Run `python optimize-images.py` with Pillow available and Node on PATH. You can select a specific Node executable using `--node <path>`.

The optimizer fingerprints original image contents and compares the manifest configuration. It regenerates only new, changed or missing variants, stores dimensions with each variant, and keeps originals. A second unchanged run writes neither images nor the manifest unnecessarily. All new sources are decoded before live asset files change. A candidate manifest and generated data are validated before publication; errors preserve the previously published manifest and data bundle. Hashes in variant filenames avoid overwriting images used by the previous bundle. Unreferenced old variants are deliberately retained for a separately reviewed cleanup.

## Checks

```text
node tools/build.mjs --check
node --test tests/schema.test.mjs
python tests/pipeline_test.py
node tests/browser.cjs
node performance-check.cjs
```

Python image checks require Pillow. Browser checks use Playwright and Microsoft Edge on Windows, or installed Playwright Chromium elsewhere. Set `BROWSER_PATH` for another compatible executable. The scripts first resolve Playwright from project dependencies and then from the bundled Node runtime used by this Codex environment. For a separate machine, install Playwright in the project and its Chromium browser before running the browser checks.

`tests/browser.cjs` starts and stops its own local HTTP server. It covers real page loading, seven projects, stable and legacy links, actual Swiper state, filters, resume binding/download, quote-safe gallery events, literal text, schema failures, HTTP/JSON/network errors and retries, missing project IDs, and click-to-load video. The icon CDN is stubbed in this regression suite so functional checks do not depend on it. `performance-check.cjs` uses real asset requests, a fresh browser context, mobile viewport and CPU/network throttling. Reports are saved to `browser-results.json` and `performance-results.json`.

Schema errors identify the project and field in the developer log/build output; the public page shows an understandable content-error message. Missing optional gallery and tags become empty arrays. Unknown section types are rejected before content is published. Link protocols and YouTube embed hosts are validated. Names and descriptions use textContent; gallery buttons use addEventListener and media objects, never generated JavaScript strings.
