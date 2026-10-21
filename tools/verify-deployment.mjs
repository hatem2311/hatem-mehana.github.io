import fs from 'node:fs';
import assert from 'node:assert/strict';
const data = JSON.parse(fs.readFileSync(new URL('../data.json', import.meta.url)));
const base = new URL(data.seo.siteUrl);
async function get(relative, agent = 'facebookexternalhit/1.1') {
  const url = new URL(relative, base);
  const response = await fetch(url, {headers:{'User-Agent':agent}, signal:AbortSignal.timeout(30000)});
  assert.equal(response.status, 200, `${url}: ${response.status}`);
  return response;
}
const assets = new Set([data.hero.resumeUrl, data.hero.profileImage]);
for (const project of [null, ...data.showcase.projects]) {
  const route = project ? `projects/${project.id}.html` : '';
  const html = await (await get(route)).text();
  const expected = new URL(route, base).href;
  assert.ok(html.includes(`rel="canonical" href="${expected}"`), `${route}: canonical`);
  assert.match(html, /content="index, follow"/);
  assert.ok(html.includes(new URL(`share/${project?.id || 'home'}.png`, base).href));
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  const documentBase = new URL(html.match(/<base href="([^"]+)"/)?.[1] || '', new URL(route, base));
  const png = Buffer.from(await (await get(`share/${project?.id || 'home'}.png`)).arrayBuffer());
  assert.equal(png.subarray(1,4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
  for (const match of html.matchAll(/(?:src|data-src|poster)="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;','&'), documentBase);
    if (url.origin === base.origin) assets.add(url.href);
  }
  console.log(`PASS public crawler HTML and share image: ${route || '/'}`);
}
for (const asset of assets) { const response = await get(asset); await response.body.cancel(); }
const sitemap = await (await get('sitemap.xml')).text();
assert.equal((sitemap.match(/<loc>/g)||[]).length,8);
assert.ok((await (await get('robots.txt')).text()).includes(`Sitemap: ${new URL('sitemap.xml',base)}`));
const twitter = await (await get('', 'Twitterbot/1.0')).text();assert.match(twitter,/name="twitter:image"/);
console.log(`PASS ${assets.size} public assets, CV, scripts, media, robots, sitemap and Twitterbot metadata`);
