const artifactPath = require('../tools/artifact-path.cjs');
const playwright = require('./playwright.cjs'); const fs = require('node:fs'); const path = require('node:path'); const http = require('node:http'); const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'); const data = JSON.parse(fs.readFileSync(path.join(root, 'data.json'))); const results = [];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' };
const server = http.createServer((req,res) => { const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); if (!file.startsWith(root + path.sep)) return res.writeHead(403).end(); fs.readFile(file, (error, bytes) => { if (error) return res.writeHead(404).end(); res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(bytes); }); });
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const base = `http://127.0.0.1:${server.address().port}`;
  const targets = [{ name: 'Edge', engine: 'chromium', channel: 'msedge' }, { name: 'Chrome', engine: 'chromium', channel: 'chrome' }, { name: 'Firefox', engine: 'firefox' }, { name: 'WebKit (not Safari)', engine: 'webkit' }];
  try {
    for (const target of targets) {
      let browser; try { browser = await playwright[target.engine].launch({ headless: true, ...(target.channel ? { channel: target.channel } : {}) }); } catch (error) { results.push({ browser: target.name, status: 'unavailable', reason: error.message.split('\n')[0] }); continue; }
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.route('https://unpkg.com/**', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
      try {
        const routes = ['index.html', ...data.showcase.projects.map(p => `projects/${p.id}.html`)]; const localLinks = new Set();
        for (const route of routes) {
          await page.goto(`${base}/${route}`); await page.waitForFunction(() => document.querySelector('.data-loading-status')?.hidden);
          for (const width of [1440, 720, 390, 320]) { await page.setViewportSize({ width, height: 900 }); await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${route} at ${width}px`); }
          const urls = await page.locator('a[href]').evaluateAll(nodes => nodes.map(n => n.href)); for (const url of urls) if (url.startsWith(base)) localLinks.add(url);
          assert.equal(await page.locator('h1').count(), 1); assert.ok((await page.locator('h1').textContent()).trim());
        }
        for (const url of localLinks) { const response = await page.request.get(url); assert.equal(response.status(), 200, url); const fragment = new URL(url).hash.slice(1); if (fragment && response.headers()['content-type']?.includes('text/html')) assert.ok((await response.text()).includes(`id="${decodeURIComponent(fragment)}"`), `Missing anchor ${url}`); }
        await page.goto(`${base}/index.html`); await page.waitForFunction(() => document.querySelector('.data-loading-status')?.hidden); await page.setViewportSize({ width: 1440, height: 1000 });
        await page.locator('body').evaluate(node => { node.style.zoom = '2'; }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '200% CSS zoom overflow');
        await page.screenshot({ path: artifactPath(`acceptance-${target.name}-zoom.png`) }); await page.locator('body').evaluate(node => { node.style.zoom = ''; });
        await page.locator('.skip-link').focus(); await page.keyboard.press('Enter'); assert.equal(await page.locator('#main').evaluate(n => n === document.activeElement), true);
        assert.deepEqual(errors, []); results.push({ browser: target.name, status: 'passed', routes: routes.length, widths: [1440,720,390,320], localLinks: localLinks.size, zoom: '200% CSS zoom and 720px reflow; not native browser zoom', javascriptErrors: errors });
      } catch(error) { results.push({ browser: target.name, status: 'failed', reason: error.message, overflow: await page.evaluate(() => [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(node).position !== 'fixed').map(node => ({ tag: node.tagName, class: node.className, text: node.textContent.slice(0,60), right: node.getBoundingClientRect().right })).slice(0,12)) }); process.exitCode = 1; } finally { await context.close(); await browser.close(); }
    }
    const external = new Set(data.social.map(s => s.url).filter(url => /^https:/.test(url))); for (const p of data.showcase.projects) for (const store of Object.values(p.storeLinks || {})) external.add(store.url);
    const links = await Promise.all([...external].map(async url => { try { const response = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: 'follow' }); await response.body?.cancel(); return { url, status: response.status, result: response.ok ? 'responded' : response.status === 404 || response.status === 410 ? 'unavailable' : 'verification-limited' }; } catch(error) { return { url, result: 'verification-limited', reason: error.message }; } }));
    fs.writeFileSync(artifactPath('acceptance-results.json'), JSON.stringify({ results, externalLinks: links, pending: ['Real participant usability sessions', 'Native Safari / iOS and physical mobile devices', 'Unverified external services are not classified as working'] },null,2)); console.log(JSON.stringify({ results, externalLinks: links },null,2));
  } finally { server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
