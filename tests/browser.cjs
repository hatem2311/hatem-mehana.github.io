const { chromium } = require('./playwright.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.ttf': 'font/ttf', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => { if (error) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(bytes); });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : process.platform === 'win32' ? { channel: 'msedge' } : {}), headless: true });
  const results = [];
  async function scenario(name, action) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.route('https://unpkg.com/**', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    try { await action(page); assert.deepEqual(errors, []); results.push({ name, passed: true }); console.log(`PASS ${name}`); } catch (error) { console.error(name, errors, await page.locator('.data-loading-status').textContent().catch(() => 'No loading panel')); throw error; } finally { await context.close(); }
  }
  const go = (page, route) => page.goto(`${base}/${route}`);
  const loaded = page => page.waitForFunction(() => document.querySelector('.data-loading-status')?.hidden);
  try {
    await scenario('home, static project grids, filters and resume download', async page => {
      await go(page, 'index.html'); await loaded(page);
      assert.equal(await page.locator('.name').textContent(), data.hero.name);
      assert.equal(await page.locator('.featured-card').count(), 3);
      for (const type of ['All', ...new Set(data.showcase.projects.map(p => p.type))]) {
        await page.getByRole('button', { name: type, exact: true }).click();
        assert.equal(await page.locator('.showcase-card').count(), type === 'All' ? data.showcase.projects.length - 3 : data.showcase.projects.filter(p => p.type === type).length);
      }
      await page.getByRole('button', { name: 'Open navigation' }).click();
      const request = page.waitForEvent('download'); await page.locator('[data-resume-link]').click(); const download = await request; assert.equal(await download.failure(), null);
    });
    for (const project of data.showcase.projects) await scenario(`project ${project.id}`, async page => {
      await go(page, `page.html?id=${project.legacyId}`); await loaded(page); assert.equal(await page.locator('#gameTitle').textContent(), project.name);
      await page.waitForFunction(() => document.querySelector('.media-strip').swiper);
      await page.locator('.media-thumbnail').last().click(); assert.equal(await page.locator('#mainPreview img').count(), 1);
      for (const src of [project.image, ...project.gallery]) { const response = await page.request.get(`${base}/${src}`); assert.equal(response.status(), 200, src); }
      await go(page, `page.html?project=${project.id}`); await loaded(page); assert.equal(await page.locator('#gameTitle').textContent(), project.name);
    });
    for (const route of ['index.html', 'page.html?id=0']) for (const failure of ['404', 'json', 'network']) await scenario(`${route}: ${failure} and recovery`, async page => {
      let fail = true; await page.route('**/data.json', route => fail ? failure === 'network' ? route.abort() : route.fulfill({ status: failure === '404' ? 404 : 200, contentType: 'application/json', body: failure === 'json' ? '{broken' : '' }) : route.fulfill({ json: data }));
      await go(page, route); await page.getByRole('button', { name: 'Try again' }).waitFor(); fail = false; await page.getByRole('button', { name: 'Try again' }).click(); await loaded(page);
    });
    for (const query of ['', '?id=999', '?id=abc']) await scenario(`invalid project ${query}`, async page => { await go(page, `page.html${query}`); await page.getByText('Project not found.', { exact: false }).waitFor(); assert.equal(await page.getByRole('link', { name: 'Back to projects' }).count(), 1); });
    await scenario('literal text, quoted image path and bound gallery event', async page => {
      const edited = structuredClone(data); const p = edited.showcase.projects[0]; p.name = `Developer's <img src=x onerror=alert(1)> & demo`; p.gallery = ["images/quote's & shot.webp"];
      await page.route('**/data.json', route => route.fulfill({ json: edited }));
      await page.route(/quote.*shot\.webp/, route => route.fulfill({ contentType: 'image/webp', body: fs.readFileSync(path.join(root, data.showcase.projects[0].image)) }));
      await go(page, 'page.html?id=0'); await loaded(page); assert.equal(await page.locator('#gameTitle').textContent(), p.name); assert.equal(await page.locator('#gameTitle img').count(), 0);
      await page.locator('.media-thumbnail').click(); await page.waitForFunction(() => document.querySelector('#mainPreview img').complete && document.querySelector('#mainPreview img').naturalWidth > 0);
    });
    await scenario('optional media defaults and unknown section error', async page => {
      const edited = structuredClone(data); delete edited.showcase.projects[0].gallery; delete edited.showcase.projects[0].tags;
      await page.route('**/data.json', route => route.fulfill({ json: edited })); await go(page, 'page.html?id=0'); await loaded(page); await page.getByText('No media available for this project.').waitFor();
      edited.showcase.projects[0].about[0].type = 'unknown'; await page.reload(); await page.getByText('The portfolio content is unavailable.', { exact: false }).waitFor();
    });
    await scenario('unsafe video is rejected before rendering', async page => {
      const edited = structuredClone(data); edited.showcase.projects[0].videoUrl = 'https://evil.test/embed/id'; await page.route('**/data.json', route => route.fulfill({ json: edited }));
      await go(page, 'page.html?id=0'); await page.getByText('The portfolio content is unavailable.', { exact: false }).waitFor(); assert.equal(await page.locator('iframe').count(), 0);
    });
    await scenario('missing hero and unsafe link have clear content errors', async page => {
      const edited = structuredClone(data); delete edited.hero; await page.route('**/data.json', route => route.fulfill({ json: edited }));
      await go(page, 'index.html'); await page.getByText('The portfolio content is unavailable.', { exact: false }).waitFor();
      edited.hero = data.hero; edited.social[0].url = 'javascript:alert(1)'; await page.reload(); await page.getByText('The portfolio content is unavailable.', { exact: false }).waitFor();
    });
    await scenario('resume URL data binding and fallback', async page => {
      const edited = structuredClone(data); edited.hero.resumeUrl = 'alternate.pdf'; await page.route('**/data.json', route => route.fulfill({ json: edited }));
      await go(page, 'index.html'); await loaded(page); assert.equal(await page.locator('[data-resume-link]').getAttribute('href'), 'alternate.pdf');
      delete edited.hero.resumeUrl; await page.reload(); await loaded(page); assert.equal(await page.locator('[data-resume-link]').getAttribute('href'), 'hatem mehana.pdf');
    });
    await scenario('video waits for activation', async page => {
      await page.route('https://www.youtube.com/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Video test</body></html>' }));
      await go(page, 'page.html?id=2'); await loaded(page); assert.equal(await page.locator('iframe').count(), 0); await page.getByRole('button', { name: 'Play project video' }).click(); assert.equal(await page.locator('iframe').count(), 1);
    });
    await scenario('static home and all seven project pages without JavaScript', async page => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
      const staticPage = await context.newPage();
      try {
        await go(staticPage, 'index.html');
        assert.equal(await staticPage.locator('.name').textContent(), data.hero.name);
        assert.equal(await staticPage.locator('.featured-card').count(), 3);
        assert.equal(await staticPage.locator('.showcase-card').count(), 4);
        await staticPage.getByRole('link', { name: 'Download CV' }).waitFor({ state: 'visible' });
        for (const project of data.showcase.projects) {
          await go(staticPage, `projects/${project.id}.html`);
          assert.equal(await staticPage.locator('#gameTitle').textContent(), project.name);
          assert.ok((await staticPage.locator('#gameAbout').textContent()).length > 50);
          assert.equal(await staticPage.locator('body').evaluate(node => node.scrollWidth <= innerWidth), true);
        }
      } finally { await context.close(); }
    });
    await scenario('failed module and failed data preserve readable content', async page => {
      await page.route('**/js/home-entry.js', route => route.abort());
      await go(page, 'index.html');
      assert.equal(await page.locator('.name').textContent(), data.hero.name);
      assert.equal(await page.locator('.showcase-card').count(), 4);
      await page.unroute('**/js/home-entry.js');
      await page.route('**/data.json', route => route.abort());
      await page.reload(); await page.getByRole('button', { name: 'Try again' }).waitFor();
      assert.equal(await page.locator('#home').isVisible(), true);
      await go(page, `projects/${data.showcase.projects[0].id}.html`);
      await page.getByRole('button', { name: 'Try again' }).waitFor();
      assert.equal(await page.locator('#gameTitle').textContent(), data.showcase.projects[0].name);
      assert.equal(await page.locator('#gameAbout').isVisible(), true);
    });
    await scenario('mobile widths, persistent card facts and responsive three-two-one featured grid', async page => {
      for (const width of [320, 360, 390, 768, 900, 1000, 1001, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await go(page, 'index.html'); await loaded(page);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `home overflow at ${width}`);
        const columns = await page.locator('.featured-grid').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length);
        assert.equal(columns, width > 1000 ? 3 : width > 768 ? 2 : 1);
        assert.equal(await page.locator('.featured-card .featured-contribution').count(), 3);
        assert.equal(await page.locator('.featured-card').evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth && [...node.querySelectorAll('.showcase-title,.featured-contribution,.card-engine,.view-details')].every(item => getComputedStyle(item).display !== 'none' && item.scrollHeight <= item.clientHeight + 1))), true);
        if ([390, 900, 1440].includes(width)) { await page.locator('#featured').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(root, `task20-featured-${width}.png`) }); }
        for (const selector of ['.showcase-title', '.showcase-description', '.card-engine', '.view-details']) {
          assert.equal(await page.locator(`.featured-card ${selector}`).first().isVisible(), true);
        }
        await go(page, 'projects/implant-mission-the-lost-tree.html'); await loaded(page);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `project overflow at ${width}`);
      }
      await page.screenshot({ path: path.join(root, 'task21-project-desktop.png'), fullPage: true });
      await go(page, 'index.html'); await loaded(page);
      await page.screenshot({ path: path.join(root, 'task21-home-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(root, 'task21-home-mobile.png'), fullPage: true });
    });
    await scenario('keyboard menu, Escape, focus loop and responsive reset', async page => {
      await go(page, 'index.html'); await loaded(page);
      assert.equal(await page.locator('.nav-links').evaluate(node => node.inert), true);
      await page.getByRole('button', { name: 'Open navigation' }).focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('.nav-links a').first().evaluate(node => node === document.activeElement), true);
      await page.keyboard.press('Shift+Tab'); assert.equal(await page.locator('.hamburger').evaluate(node => node === document.activeElement), true);
      await page.keyboard.press('Tab'); assert.equal(await page.locator('.nav-links a').first().evaluate(node => node === document.activeElement), true);
      await page.keyboard.press('Escape'); assert.equal(await page.locator('.hamburger').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('.hamburger').evaluate(node => node === document.activeElement), true);
      await page.keyboard.press('Enter'); await page.getByRole('link', { name: 'Projects', exact: true }).click();
      assert.equal(await page.locator('#featured').evaluate(node => node === document.activeElement), true);
      await page.setViewportSize({ width: 1440, height: 900 });
      assert.equal(await page.locator('.nav-links').evaluate(node => node.inert), false);
    });
    await scenario('recruiter journey preserves filter, scroll and card focus', async page => {
      await go(page, 'index.html'); await loaded(page);
      await page.getByRole('button', { name: 'Level Design', exact: true }).click();
      const card = page.locator('.showcase-card').first(); await card.scrollIntoViewIfNeeded();
      const y = await page.evaluate(() => scrollY); await card.click(); await loaded(page);
      await page.locator('.back-button').click(); await loaded(page);
      await page.waitForFunction(() => document.activeElement?.classList.contains('showcase-card'));
      assert.equal(await page.locator('.filter-btn.active').textContent(), 'Level Design');
      assert.equal(await page.locator('.showcase-card').count(), data.showcase.projects.filter(p => p.type === 'Level Design').length);
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - y) < 4);
      await page.locator('.showcase-card').first().click(); await loaded(page);
      await page.locator('#next-project').click(); await loaded(page);
      assert.ok((await page.locator('#project-contact').getAttribute('href')).startsWith('mailto:'));
    });
    await scenario('reduced motion disables lighting and media transitions', async page => {
      await go(page, 'index.html'); await loaded(page);
      const card = page.locator('.featured-card').first(); await card.hover();
      assert.equal(await card.evaluate(node => node.style.getPropertyValue('--light-x')), '');
      assert.equal(await card.evaluate(node => getComputedStyle(node, '::before').display), 'none');
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
      await go(page, 'projects/implant-mission-the-lost-tree.html'); await loaded(page);
      await page.waitForFunction(() => document.querySelector('.media-strip').swiper);
      assert.equal(await page.locator('.media-strip').evaluate(node => node.swiper.params.speed), 0);
      await page.locator('.media-thumbnail').last().focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('.media-thumbnail').last().getAttribute('aria-pressed'), 'true');
    });
    await scenario('approved design tokens and WCAG AA text contrast on both pages', async page => {
      const reports = [];
      for (const route of ['index.html', 'projects/azooma-escape.html']) {
        await go(page, route); await loaded(page);
        const report = await page.evaluate(() => {
          const css = getComputedStyle(document.documentElement);
          const value = name => css.getPropertyValue(name).trim();
          const luminance = hex => {
            const channels = hex.replace('#', '').match(/.{2}/g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
            return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
          };
          const ratio = (a,b) => { const x = luminance(a), y = luminance(b); return (Math.max(x,y) + .05) / (Math.min(x,y) + .05); };
          const background = value('--color-background'), surface = value('--color-background-light'), text = value('--color-text'), secondary = value('--color-text-secondary'), accent = value('--color-primary');
          return { background, surface, text, secondary, accent, ratios: { primaryOnBackground: ratio(text, background), secondaryOnBackground: ratio(secondary, background), primaryOnSurface: ratio(text, surface), secondaryOnSurface: ratio(secondary, surface), accentOnSurface: ratio(accent, surface), filledButton: ratio(background, accent) } };
        });
        assert.equal(report.background, '#0b1016'); assert.equal(report.surface, '#141c25'); assert.equal(report.secondary, '#b1b6c0');
        assert.equal(report.text, '#f2f3f5'); assert.equal(report.accent, '#67b7ff');
        for (const [pair, ratio] of Object.entries(report.ratios)) assert.ok(ratio >= 4.5, `${route} ${pair}: ${ratio}`);
        reports.push({ route, ...report });
      }
      fs.writeFileSync(path.join(root, 'design-contrast-results.json'), JSON.stringify(reports, null, 2));
    });
    await scenario('copy email success and failure, corrected links and keyboard activation', async page => {
      await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedEmail = text; } } }); });
      for (const route of ['index.html', 'projects/azooma-escape.html']) {
        await go(page, route); await loaded(page);
        const copy = page.getByRole('button', { name: 'Copy email', exact: true }); await copy.focus(); await page.keyboard.press('Enter');
        await page.getByText('Email copied.', { exact: true }).waitFor();
        assert.equal(await page.evaluate(() => window.copiedEmail), 'hatemmehana666@gmail.com');
        assert.equal(await page.locator('.contact-email').getAttribute('href'), 'mailto:hatemmehana666@gmail.com');
      }
      await go(page, 'index.html'); await loaded(page);
      assert.equal(await page.getByRole('link', { name: 'LinkedIn', exact: true }).count(), 1);
      assert.equal(await page.getByRole('link', { name: 'WhatsApp', exact: true }).count(), 1);
      await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Denied'); }; });
      await page.getByRole('button', { name: 'Copy email', exact: true }).click();
      await page.getByText('Select the email address to copy it, or click it to send an email.', { exact: true }).waitFor();
      await page.reload(); await loaded(page);
      await page.setViewportSize({ width: 1440, height: 1000 }); await page.locator('#contact').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(root, 'task23-contact-desktop.png') });
      await page.setViewportSize({ width: 320, height: 800 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('#contact').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(root, 'task23-contact-mobile.png') });
    });
    await scenario('case study evidence, final images and static parity', async page => {
      for (const project of data.showcase.projects) {
        await go(page, `projects/${project.id}.html`); await loaded(page);
        await page.getByRole('heading', { name: 'My contributions', exact: true }).waitFor();
        assert.ok(await page.locator('#gameAbout .evidence-link').count());
        assert.match(await page.locator('#gameMeta').textContent(), /Role:.*Duration:.*Engine:.*Platform:/s);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
      await go(page, 'projects/implant-mission-the-lost-tree.html'); await loaded(page);
      assert.equal(await page.getByRole('link', { name: 'Game Zanga 2024 — public voting results', exact: true }).getAttribute('href'), 'https://itch.io/jam/gamezanga-specialedition/rate/2563575');
      await go(page, 'projects/horror-home.html'); await loaded(page);
      await page.getByRole('heading', { name: 'Level design: player flow' }).waitFor();
      assert.equal(await page.getByRole('heading', { name: 'Layout → Blockout → Final' }).count(), 0);
      await page.locator('#gameAbout').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(root, 'tasks24-26-mobile.png'), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({ path: path.join(root, 'tasks24-26-desktop.png'), fullPage: true });
      const context = await browser.newContext({ javaScriptEnabled: false }); const staticPage = await context.newPage();
      try {
        for (const project of data.showcase.projects) {
          await go(staticPage, `projects/${project.id}.html`);
          assert.equal(await staticPage.getByRole('heading', { name: 'My contributions', exact: true }).count(), 1);
          assert.ok(await staticPage.locator('#gameAbout .evidence-link').count());
        }
        await go(staticPage, 'index.html');
        assert.equal(await staticPage.getByRole('link', { name: 'Game Zanga 2024 — public voting results', exact: true }).count(), 1);
      } finally { await context.close(); }
    });
    await scenario('media viewer captions, fullscreen keyboard and video failure', async page => {
      await go(page, 'projects/horror-home.html'); await loaded(page);
      assert.equal(await page.locator('.media-counter').textContent(), `1 / ${data.showcase.projects[0].gallery.length}`);
      await page.locator('#mainPreview').focus(); await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('.media-counter').textContent(), `2 / ${data.showcase.projects[0].gallery.length}`);
      assert.match(await page.locator('.media-caption').textContent(), /Final environment/);
      assert.equal(await page.locator('#mainPreview img').getAttribute('alt'), await page.locator('.media-caption').textContent());
      await page.getByRole('button', { name: 'Open fullscreen media' }).click(); assert.equal(await page.locator('dialog').evaluate(node => node.open), true);
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog').evaluate(node => node.open), false);
      assert.equal(await page.getByRole('button', { name: 'Open fullscreen media' }).evaluate(node => node === document.activeElement), true);
      const edited = structuredClone(data); const p = edited.showcase.projects[0];
      p.gallery = ['images/portrait.webp', 'images/landscape.webp']; p.galleryCaptions = ['Portrait composition', 'Landscape composition'];
      edited.responsiveImages[p.gallery[0]] = [{ src: p.gallery[0], width: 200, height: 600 }]; edited.responsiveImages[p.gallery[1]] = [{ src: p.gallery[1], width: 600, height: 200 }];
      await page.route('**/data.json', route => route.fulfill({ json: edited }));
      await page.route(/images\/(portrait|landscape)\.webp/, route => route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${route.request().url().includes('portrait') ? 200 : 600}" height="${route.request().url().includes('portrait') ? 600 : 200}"><rect width="100%" height="100%" fill="blue"/></svg>` }));
      await go(page, 'page.html?id=0'); await loaded(page);
      await page.waitForFunction(() => document.querySelector('#mainPreview img').naturalWidth > 0);
      const firstHeight = await page.locator('#mainPreview').evaluate(node => node.getBoundingClientRect().height);
      await page.getByRole('button', { name: 'Next media' }).click();
      assert.equal(await page.locator('#mainPreview').evaluate(node => node.getBoundingClientRect().height), firstHeight);
      assert.equal(await page.locator('#mainPreview img').evaluate(node => getComputedStyle(node).objectFit), 'contain');
      await page.unroute('**/data.json'); await page.route('https://www.youtube.com/**', route => route.abort());
      await go(page, 'page.html?id=2'); await loaded(page);
      assert.equal(await page.locator('iframe').count(), 0); await page.getByRole('button', { name: 'Play project video' }).click();
      await page.getByRole('button', { name: 'Retry video' }).waitFor({ timeout: 15000 });
      assert.equal(await page.getByRole('link', { name: 'Watch on YouTube', exact: true }).count(), 1);
      await page.getByRole('button', { name: 'Next media' }).click(); assert.equal(await page.locator('iframe').count(), 0);
      await page.getByRole('button', { name: 'Previous media' }).click(); await page.getByRole('button', { name: 'Play project video' }).click();
      await page.getByRole('button', { name: 'Open fullscreen media' }).click(); assert.equal(await page.locator('iframe').count(), 1);
      await page.getByRole('button', { name: 'Close fullscreen' }).focus(); await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog').open && !document.querySelector('iframe')); assert.equal(await page.locator('iframe').count(), 0);
      await page.screenshot({ path: path.join(root, 'task30-media-mobile.png') });
    });
    await scenario('homepage omits standalone gameplay and retains three featured cards', async page => {
      await go(page, 'index.html'); await loaded(page);
      assert.equal(await page.locator('#home-video').count(), 0);
      assert.equal(await page.locator('.featured-card').count(), 3);
      assert.equal(await page.locator('.card-preview').count(), 3);
    });
    await scenario('technical summaries use existing evidence without invented details', async page => {
      await go(page, 'projects/azooma-escape.html'); await loaded(page);
      assert.equal(await page.locator('.technical-system').count(), 3);
      assert.equal(await page.locator('.technical-system pre,.system-flow').count(), 0);
      for (const width of [320, 390, 1440]) { await page.setViewportSize({ width, height: 900 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); }
      const context = await browser.newContext({ javaScriptEnabled: false }); const staticPage = await context.newPage();
      try { await go(staticPage, 'projects/azooma-escape.html'); assert.equal(await staticPage.locator('.technical-system').count(), 3); assert.equal(await staticPage.locator('.technical-system pre,.system-flow').count(), 0); } finally { await context.close(); }
    });
    fs.writeFileSync(path.join(root, 'browser-results.json'), JSON.stringify(results, null, 2));
    console.log(`${results.length} browser scenarios passed`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
