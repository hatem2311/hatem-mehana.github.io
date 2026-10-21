# SEO and sharing

Task 31 uses the GitHub Pages URL verified through the repository Pages API on 2026-10-21: https://hatem2311.github.io/hatem-mehana.github.io/. Pages publishes main at the repository root; no custom domain is configured. The account root returns 404, while the project URL returns 200.

Sources: content/site.json and content/projects/*.json. Generate share cards with node tools/share-cards.cjs, then node tools/build.mjs --production. Eight pages contain unique titles, descriptions, canonical URLs, Open Graph and Twitter metadata directly in HTML without JavaScript. Eight 1200x630 PNG share cards use existing project images and the current portrait. Legacy page.html remains noindex.

The sitemap contains the home page and seven stable project URLs, preserving the GitHub Pages subpath. robots.txt allows crawling and points to that sitemap. Initial SEO/schema/case-study validation: 17 tests passed; build --check passed. The unconfirmed-URL safety test uses an explicit empty fixture and continues to prevent publishing invented URLs.

After deployment run node tools/verify-deployment.mjs. It checks public canonical URLs, index directives, Facebook/Twitter crawler metadata, all share PNG dimensions, embedded local assets, CV, sitemap and robots. A successful HTTP crawler check does not prove the appearance or cached state of a preview inside a social network; platform UI previews require a separate check.

Deployment 103d5a4 completed successfully. Public crawler checks passed for all eight page canonicals and all eight 1200x630 PNG cards. Actual preview UI/cached rendering inside social platforms remains pending; Task 31 must remain In progress until that acceptance check is completed.
Public deployment verification also passed for 69 local assets, including embedded images, scripts, preview videos and CV, plus robots, the eight-entry sitemap and Twitterbot metadata.
