import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateContent } from '../js/schema.js';
import { staticPages } from './static-pages.mjs';

const root = process.env.CONTENT_EDITOR_ROOT ? path.resolve(process.env.CONTENT_EDITOR_ROOT) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const backups = path.join(root, '.content-editor/backups');
const token = crypto.randomBytes(32).toString('hex');
let preview;
let busy = false;
const uploads = new Map();
function load() {
  const index = read(path.join(root, 'content/projects.json'));
  return { site: read(path.join(root, 'content/site.json')), index, projects: index.map(p => read(projectFile(p))) };
}
function local(relative) {
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep)) throw new Error('Path outside repository');
  let current = file;
  while (current !== root) { if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Symbolic links are not allowed'); current = path.dirname(current); }
  return file;
}
function projectFile(item) {
  if (!/^projects\/[a-z0-9-]+\.json$/.test(item.file)) throw new Error('Invalid project file');
  return local('content/' + item.file);
}
function images(value, out = new Set()) {
  if (typeof value === 'string' && /^images\/.+\.(png|jpg|jpeg|webp)$/i.test(value)) out.add(value);
  else if (Array.isArray(value)) value.forEach(v => images(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(v => images(v, out));
  return out;
}
export function validateDraft(draft, current, exists = relative => fs.existsSync(local(relative))) {
  if (!draft || !Array.isArray(draft.index) || !Array.isArray(draft.projects)) throw new Error('Invalid draft');
  if (draft.index.length !== current.index.length || draft.projects.length !== current.projects.length) throw new Error('Project identities must be preserved');
  const expected = new Map(current.index.map(p => [p.id, p]));
  const seen = new Set();
  draft.index.forEach((item, i) => {
    const original = expected.get(item.id), project = draft.projects[i];
    if (!original || seen.has(item.id) || JSON.stringify(item) !== JSON.stringify(original)) throw new Error('Project index identities and filenames are locked');
    if (project.id !== item.id || project.legacyId !== item.legacyId) throw new Error('Stable and legacy IDs are locked');
    seen.add(item.id);
    const oldProject = current.projects.find(p => p.id === item.id);
    const locked = p => (p.technicalSystems || []).map(s => s.id).sort();
    if (JSON.stringify(locked(project)) !== JSON.stringify(locked(oldProject))) throw new Error('Technical system IDs are locked');
  });
  const data = validateContent({ ...draft.site, showcase: { projects: draft.projects }, responsiveImages: {} });
  function refs(v) {
    if (typeof v === 'string' && v.startsWith('images/')) { if (!exists(v)) throw new Error('Missing asset: ' + v); }
    else if (Array.isArray(v)) v.forEach(refs);
    else if (v && typeof v === 'object') Object.values(v).forEach(refs);
  }
  refs(data);
  if (!exists(data.hero.resumeUrl)) throw new Error('Missing resume file');
  return data;
}
function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.editor-tmp', typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(file + '.editor-tmp', file);
}
function snapshot(draft) {
  const files = ['content/site.json', 'content/projects.json', 'content/assets-manifest.json', 'data.json', 'index.html', 'page.html', 'robots.txt', 'sitemap.xml', ...draft.index.map(p => 'content/' + p.file), ...draft.index.map(p => 'projects/' + p.id + '.html')];
  const id = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
  const dir = path.join(backups, id);
  fs.mkdirSync(dir, { recursive: true });
  const records = files.map(file => ({ file, bytes: fs.existsSync(local(file)) ? fs.readFileSync(local(file)).toString('base64') : null }));
  write(path.join(dir, 'snapshot.json'), { id, created: new Date().toISOString(), records });
  return id;
}
function restore(id) {
  if (!/^\d+-[a-f0-9]{8}$/.test(id)) throw new Error('Invalid backup');
  const saved = read(path.join(backups, id, 'snapshot.json'));
  for (const entry of saved.records) {
    const file = local(entry.file);
    if (entry.bytes === null) { if (fs.existsSync(file)) fs.unlinkSync(file); }
    else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(entry.bytes, 'base64')); }
  }
}
function pipeline(imageChange) {
  const run = (command, args) => {
    const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 300000 });
    if (result.error || result.status !== 0) throw new Error(result.error?.message || (result.stderr + result.stdout).slice(-5000));
  };
  const bundledPython = path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
  const python = process.env.CONTENT_EDITOR_PYTHON || (fs.existsSync(bundledPython) ? bundledPython : 'python');
  if (imageChange) run(python, ['optimize-images.py', '--node', process.execPath]);
  else run(process.execPath, ['tools/build.mjs']);
  run(process.execPath, ['tools/build.mjs', '--check']);
}
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf' };
async function body(req) {
  let size = 0, parts = [];
  for await (const part of req) { size += part.length; if (size > 25 * 1024 * 1024) throw new Error('Request too large'); parts.push(part); }
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}
export function startEditor(port = 4318) {
  const server = http.createServer(async (req, res) => {
    const send = (status, value, type = 'application/json') => { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }); res.end(type === 'application/json' ? JSON.stringify(value) : value); };
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      if (req.headers.host !== new URL(origin).host || (req.headers.origin && req.headers.origin !== origin)) return send(403, { error: 'Local origin required' });
      const url = new URL(req.url, origin);
      if (url.pathname.startsWith('/api/')) {
        if (req.headers['x-editor-token'] !== token) return send(403, { error: 'Editor token required' });
        if (req.method === 'GET' && url.pathname === '/api/content') { const draft = load(); return send(200, { draft, revision: hash(draft) }); }
        if (req.method === 'GET' && url.pathname === '/api/backups') return send(200, fs.existsSync(backups) ? fs.readdirSync(backups).filter(id => /^\d+-[a-f0-9]{8}$/.test(id)).sort().reverse() : []);
        if (req.method !== 'POST') return send(405, { error: 'Method not allowed' });
        if (busy) return send(409, { error: 'Another operation is running' });
        const payload = await body(req), current = load();
        if (busy) return send(409, { error: 'Another operation is running' });
        if (payload.revision !== hash(current)) return send(409, { error: 'Content changed on disk. Reload before continuing.' });
        if (url.pathname === '/api/preview') {
          const data = validateDraft(payload.draft, current, p => uploads.has(p) || fs.existsSync(local(p)));
          const pages = staticPages(root, data);
          const id = crypto.randomBytes(16).toString('hex');
          preview = { id, draft: structuredClone(payload.draft), revision: payload.revision, digest: hash(payload.draft), pages };
          return send(200, { previewId: id, url: '/preview/' + id + '/index.html' });
        }
        if (url.pathname === '/api/save') {
          if (!preview || payload.previewId !== preview.id || preview.revision !== payload.revision || hash(payload.draft) !== preview.digest) throw new Error('Preview these exact changes before saving');
          validateDraft(payload.draft, current, p => uploads.has(p) || fs.existsSync(local(p)));
          busy = true;
          const id = snapshot(current);
          const created = [];
          try {
            for (const src of images(payload.draft)) if (uploads.has(src) && !fs.existsSync(local(src))) { const file = local(src); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, uploads.get(src)); created.push(file); }
            write(local('content/site.json'), payload.draft.site);
            write(local('content/projects.json'), payload.draft.index);
            payload.draft.index.forEach((p, i) => write(projectFile(p), payload.draft.projects[i]));
            pipeline(created.length > 0 || hash([...images(current)].sort()) !== hash([...images(payload.draft)].sort()));
            preview = undefined;
            uploads.clear();
            return send(200, { backupId: id, revision: hash(load()) });
          } catch (e) { restore(id); created.forEach(file => fs.unlinkSync(file)); throw new Error('Save failed; previous files restored. ' + e.message); }
          finally { busy = false; }
        }
        if (url.pathname === '/api/upload') {
          const extension = path.extname(payload.name || '').toLowerCase();
          if (!['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) throw new Error('Use PNG, JPEG or WebP');
          const bytes = Buffer.from(payload.data || '', 'base64');
          if (!bytes.length || bytes.length > 15 * 1024 * 1024) throw new Error('Image must be below 15 MB');
          const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
          const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
          const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
          if (!(extension === '.png' ? png : extension === '.webp' ? webp : jpg)) throw new Error('Image format does not match filename');
          if ([...uploads.values()].reduce((n, b) => n + b.length, 0) + bytes.length > 60 * 1024 * 1024) throw new Error('Upload limit reached. Restart editor to clear unused uploads.');
          const src = 'images/editor/' + crypto.randomBytes(12).toString('hex') + extension;
          uploads.set(src, bytes); preview = undefined;
          return send(200, { src });
        }
        if (url.pathname === '/api/restore') {
          busy = true;
          const recovery = snapshot(current);
          try { restore(payload.id); pipeline(false); preview = undefined; return send(200, { backupId: recovery }); }
          catch (e) { restore(recovery); throw e; }
          finally { busy = false; }
        }
        return send(404, { error: 'Unknown action' });
      }
      if (req.method !== 'GET') return send(405, { error: 'Method not allowed' });
      if (url.pathname === '/' || url.pathname === '/editor') return send(200, fs.readFileSync(local('tools/editor/index.html'), 'utf8').replace('__EDITOR_TOKEN__', token), 'text/html');
      let relative = decodeURIComponent(url.pathname.slice(1));
      if (relative.startsWith('preview/')) {
        const [, id, ...parts] = relative.split('/');
        if (!preview || id !== preview.id) return send(404, { error: 'Preview expired' });
        relative = parts.join('/');
        if (relative === 'data.json') return send(200, validateDraft(preview.draft, load(), p => uploads.has(p) || fs.existsSync(local(p))));
        if (preview.pages.has(relative)) return send(200, preview.pages.get(relative), 'text/html');
      }
      if (uploads.has(relative)) return send(200, uploads.get(relative), mime[path.extname(relative)]);
      if (!/^(images\/|vendor\/|js\/|tools\/editor\/)/.test(relative) && !/^[^/]+\.(css|pdf)$/.test(relative)) return send(404, { error: 'File unavailable' });
      const file = local(relative), type = mime[path.extname(file).toLowerCase()];
      if (!type || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(404, { error: 'File unavailable' });
      return send(200, fs.readFileSync(file), type);
    } catch (e) { send(400, { error: e.message }); }
  });
  server.listen(port, '127.0.0.1', () => console.log(`Content Editor: http://127.0.0.1:${server.address().port}`));
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) startEditor(Number(process.env.CONTENT_EDITOR_PORT || 4318));
