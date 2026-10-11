# SEO and sharing

Task 31 remains In progress because the final public URL is unknown. Existing content provides page-specific titles, descriptions, Open Graph/Twitter metadata and stable project slugs in generated HTML, readable without JavaScript. Eight 1200×630 PNG share cards use existing project images and the existing portrait. All dimensions were verified and two representative cards visually checked locally; no public platform preview is claimed.

Sources: `content/site.json`, `content/projects/*.json`. Generation: `node tools/share-cards.cjs`, then `node tools/build.mjs`. Verification: `node --test tests/seo.test.mjs` and `node tools/build.mjs --check`. Cards are incremental; regenerate after changing their source content. `tools/seo.mjs` preserves a deployment subpath and escapes metadata.

Pending: confirmed `seo.siteUrl`, public canonical/OG image URLs, production sitemap/robots and actual sharing-platform crawler previews. The repository remote is not treated as confirmation of a deployment domain. Until then the local build emits no canonical, blocks indexing and produces an empty sitemap. `node tools/build.mjs --production` rejects a missing publication URL. Once a confirmed HTTPS URL is configured, generation emits absolute canonical/image URLs and eight sitemap entries. Tests use example.test solely as a fixture, never as publication data.
