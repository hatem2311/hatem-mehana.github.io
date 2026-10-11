import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { siteBase, seoMetadata, seoFiles } from '../tools/seo.mjs';
import { staticPages } from '../tools/static-pages.mjs';
const data = JSON.parse(fs.readFileSync(new URL('../data.json', import.meta.url)));
test('unconfirmed publication leaves canonical URLs pending and blocks indexing', () => {
  const html = seoMetadata(data, data.showcase.projects[0]);
  assert.match(html, /noindex, follow/); assert.doesNotMatch(html, /rel="canonical"|property="og:url"/);
  assert.match(seoFiles(data).get('robots.txt'), /Disallow: \//);
});
test('confirmed base preserves subpaths and uses stable project slugs', () => {
  const fixture = structuredClone(data); fixture.seo.siteUrl = 'https://example.test/portfolio/';
  for (const p of fixture.showcase.projects) { const html = seoMetadata(fixture, p); assert.ok(html.includes(`https://example.test/portfolio/projects/${p.id}.html`)); assert.ok(html.includes(`https://example.test/portfolio/share/${p.id}.png`)); }
  const xml = seoFiles(fixture).get('sitemap.xml'); assert.equal((xml.match(/<loc>/g) || []).length, 8); assert.doesNotMatch(xml, /page.html|\?id=/);
  assert.doesNotMatch(seoMetadata(fixture, null, true), /rel="canonical"/);
  for (const url of ['http://example.test', 'https://user:pass@example.test', 'https://example.test/?query=1', 'https://example.test/#hash']) assert.throws(() => siteBase(url));
});
test('crawler metadata is escaped and stored without JavaScript for every page', () => {
  const fixture = structuredClone(data); fixture.showcase.projects[0].description = 'Quotes " & <script>literal</script>';
  const html = seoMetadata(fixture, fixture.showcase.projects[0]); assert.match(html, /&quot; &amp; &lt;script&gt;/); assert.doesNotMatch(html, /<script>/);
  const pages = staticPages(process.cwd(), data);
  for (const file of ['index.html', ...data.showcase.projects.map(p => `projects/${p.id}.html`)]) { assert.match(pages.get(file), /property="og:title"/); assert.match(pages.get(file), /name="description"/); assert.equal(fs.readFileSync(file, 'utf8'), pages.get(file)); }
});
test('all existing share previews have valid PNG dimensions', () => {
  for (const id of ['home', ...data.showcase.projects.map(p => p.id)]) { const bytes = fs.readFileSync(`share/${id}.png`); assert.equal(bytes.subarray(1, 4).toString(), 'PNG'); assert.equal(bytes.readUInt32BE(16), 1200); assert.equal(bytes.readUInt32BE(20), 630); }
});
