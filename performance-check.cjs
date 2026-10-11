const artifactPath = require('./tools/artifact-path.cjs');
const { chromium } = require('./tests/playwright.cjs');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const budget = require('./performance-budget.json');
const root = __dirname;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(bytes);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : process.platform === 'win32' ? { channel: 'msedge' } : {}), headless: true });
  const results = [];
  try {
    const routes = process.argv.includes('--smoke') ? ['index.html', 'page.html?id=2'] : ['index.html', 'page.html?id=2', 'index.html', 'page.html?id=2', 'index.html', 'page.html?id=2'];
    for (const route of routes) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      const errors = [], failures = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('requestfailed', req => failures.push({ url: req.url(), error: req.failure()?.errorText }));
      await page.addInitScript(() => {
        window.metrics = { lcp: 0, cls: 0, interactions: [] };
        new PerformanceObserver(list => { for (const entry of list.getEntries()) window.metrics.lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.metrics.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => { for (const entry of list.getEntries()) if (entry.interactionId) window.metrics.interactions.push(entry.duration); }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      });
      await page.goto(`http://127.0.0.1:${server.address().port}/${route}`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => document.querySelector('.data-loading-status').hidden, { timeout: 30000 });
      await page.waitForTimeout(1500);
      const initial = await page.evaluate(() => ({ lcp: window.metrics.lcp, cls: window.metrics.cls, transferredBytes: performance.getEntriesByType('resource').reduce((n, r) => n + r.transferSize, 0), resources: performance.getEntriesByType('resource').map(r => ({ name: r.name.split('/').at(-1), bytes: r.transferSize })).sort((a,b) => b.bytes - a.bytes).slice(0, 10) }));
      await page.screenshot({ path: artifactPath(`performance-initial-${route.startsWith('index') ? 'home' : 'project'}.png`) });
      if (route.startsWith('index')) {
        assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').filter(item => item.name.endsWith('/swiper-bundle.mjs')).length), 0);
        await page.locator('#showcase').scrollIntoViewIfNeeded();
        await page.locator('.filter-btn').nth(1).click();
        await page.locator('.filter-btn').first().click();
        assert.equal(await page.locator('.showcase-card').count(), 4);
      } else {
        await page.waitForFunction(() => document.querySelector('.swiper').swiper);
        assert.equal(await page.locator('iframe').count(), 0);
        await page.locator('.video-preview-button').click();
        assert.equal(await page.locator('iframe').count(), 1);
      }
      const metrics = await page.evaluate(() => ({ ...window.metrics, transferredBytes: performance.getEntriesByType('resource').reduce((n, r) => n + r.transferSize, 0) }));
      results.push({ route, initial, ...metrics, errors: [...errors], failures: [...failures] });
      await page.screenshot({ path: artifactPath(`performance-${route.startsWith('index') ? 'home' : 'project'}.png`), fullPage: false });
      await context.close();
    }
    fs.writeFileSync(artifactPath('performance-results.json'), JSON.stringify({ profile: '390x844, 150ms latency, 1.6Mbps download, CPU 4x; lab sample', results }, null, 2));
    console.log(JSON.stringify(results, null, 2));
    for (const result of results) {
      assert.equal(result.errors.length, 0, 'Browser JavaScript errors');
      assert.equal(result.failures.length, 0, 'Failed requests before browser teardown');
      assert.ok(result.initial.lcp <= budget.lcpMs, `${result.route}: LCP ${result.initial.lcp}ms`);
      assert.ok(result.cls <= budget.cls, `${result.route}: CLS ${result.cls}`);
      assert.ok(result.initial.transferredBytes <= budget.initialTransferredBytes, `${result.route}: initial bytes ${result.initial.transferredBytes}`);
      assert.ok(result.interactions.every(ms => ms <= budget.sampledInteractionMs), 'Sampled interaction exceeded budget');
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
