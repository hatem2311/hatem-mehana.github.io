import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from '../js/schema.js';
import { staticPages } from './static-pages.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifestIndex = args.indexOf('--manifest');
const manifest = read(manifestIndex === -1 ? path.join(root, 'content/assets-manifest.json') : args[manifestIndex + 1]);
const site = read(path.join(root, 'content/site.json'));
if (args.includes('--production') && !site.seo?.siteUrl) throw new Error('Production build requires the confirmed seo.siteUrl');
const index = read(path.join(root, 'content/projects.json'));
const sourceProjects = index.map(item => {
  const file = path.resolve(root, 'content', item.file);
  if (!file.startsWith(path.join(root, 'content/projects') + path.sep)) throw new Error('Project file must be inside content/projects');
  const project = read(file);
  if (project.id !== item.id || project.legacyId !== item.legacyId) throw new Error(`${item.file}: ID does not match project index`);
  return project;
});
const source = validateContent({ ...site, showcase: { projects: sourceProjects }, responsiveImages: {} });
function references(value, field = 'content') {
  if (typeof value === 'string' && value.startsWith('images/')) {
    const file = path.resolve(root, value);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) throw new Error(`${field}: missing image ${value}`);
  } else if (Array.isArray(value)) value.forEach((item, i) => references(item, `${field}[${i}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => references(item, `${field}.${key}`));
}
references(source);
if (!fs.existsSync(path.resolve(root, source.hero.resumeUrl))) throw new Error(`hero.resumeUrl: missing file ${source.hero.resumeUrl}`);
if (args.includes('--source-only')) { console.log('Source content valid'); process.exit(0); }
const responsiveImages = {};
function optimized(value) {
  if (typeof value === 'string' && value.startsWith('images/')) {
    if (/\.(webm|mp4)$/.test(value)) return value;
    const record = manifest.images[value];
    if (!record || !record.variants?.length) throw new Error(`Missing optimized image manifest: ${value}`);
    const src = record.variants.at(-1).src; responsiveImages[src] = record.variants; return src;
  }
  if (Array.isArray(value)) return value.map(optimized);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, optimized(item)]));
  return value;
}
const output = optimized(source); output.responsiveImages = responsiveImages;
const validated = validateContent(output); references(validated);
const pages = staticPages(root, validated);
if (args.includes('--check') && manifestIndex === -1) {
  for (const [relative, text] of pages) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) throw new Error(`${relative}: stale generated page; run npm run build`);
  }
}
if (!args.includes('--check')) {
  const file = path.join(root, 'data.json'); const text = JSON.stringify(validated, null, 2) + '\n';
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) { fs.writeFileSync(file + '.tmp', text); fs.renameSync(file + '.tmp', file); }
  for (const [relative, html] of pages) { const target = path.join(root, relative); fs.mkdirSync(path.dirname(target), { recursive: true }); if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== html) { fs.writeFileSync(target + '.tmp', html); fs.renameSync(target + '.tmp', target); } }
}
console.log(`Content valid: ${validated.showcase.projects.length} projects, ${Object.keys(responsiveImages).length} images`);
