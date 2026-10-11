const { chromium } = require('../tests/playwright.cjs');
const fs = require('node:fs'); const path = require('node:path'); const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'); const data = JSON.parse(fs.readFileSync(path.join(root, 'data.json')));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const entries = [{ id: 'home', name: data.hero.name, role: data.hero.role, description: data.hero.description, image: data.hero.profileImage }, ...data.showcase.projects.map(p => ({ id: p.id, name: p.name, role: p.role, description: p.description, image: p.image }))];
(async () => {
  const browser = await chromium.launch({ ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : process.platform === 'win32' ? { channel: 'msedge' } : {}), headless: true });
  const directory = path.join(root, 'share'); fs.mkdirSync(directory, { recursive: true }); const manifestPath = path.join(directory, 'manifest.json'); const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath)) : {}; const manifest = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    for (const entry of entries) {
      const bytes = fs.readFileSync(path.join(root, entry.image)); const fingerprint = crypto.createHash('sha256').update('share-card-v2').update(JSON.stringify(entry)).update(bytes).digest('hex'); manifest[entry.id] = fingerprint;
      const target = path.join(directory, `${entry.id}.png`); if (old[entry.id] === fingerprint && fs.existsSync(target)) continue;
      const src = `data:image/webp;base64,${bytes.toString('base64')}`;
      await page.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;background:#0b1016;color:#edf3fa;font-family:Arial,sans-serif}.card{width:1200px;height:630px;display:grid;grid-template-columns:52% 48%;padding:48px;gap:32px;overflow:hidden}.content{display:flex;flex-direction:column;justify-content:center;min-width:0}h1{font-size:44px;margin:12px 0;overflow-wrap:anywhere;line-height:1.12}.role{color:#67b7ff;font-size:24px}p{font-size:23px;line-height:1.45}.brand{font-size:20px;color:#67b7ff}img{width:100%;height:100%;object-fit:contain;min-width:0;max-height:534px}</style></head><body><main class="card"><div class="content"><div class="brand">Hatem Mehana · Portfolio</div><h1>${esc(entry.name)}</h1><div class="role">${esc(entry.role)}</div><p>${esc(entry.description)}</p></div><img alt="${esc(entry.name)}" src="${src}"></main></body></html>`);
      await page.addStyleTag({ content: '.card{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}' });
      await page.locator('img').evaluate(image => image.decode());
      if (!await page.locator('.card').evaluate(card => [...card.children].every(node => { const r = node.getBoundingClientRect(); return r.right <= 1200 && r.bottom <= 630 && node.scrollHeight <= node.clientHeight + 1; }))) throw new Error(`${entry.id}: share card content clipped`);
      await page.screenshot({ path: target + '.tmp', type: 'png' }); fs.renameSync(target + '.tmp', target); console.log(`Generated share/${entry.id}.png`);
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
