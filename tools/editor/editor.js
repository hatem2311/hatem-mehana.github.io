const $ = id => document.getElementById(id);
let draft, revision, previewId, selected = '3d-tic-tac-toe', dirty = false, working = false;
const templates = new Map();
for (const [key, value] of Object.entries({ contributions: { text: '', evidence: { label: '', url: '' } }, outcomes: { text: '' }, decisions: { title: '', challenge: '', solution: '' }, figures: { url: 'images/', caption: '' }, stages: { url: 'images/', caption: '', label: '' }, gallery: 'images/', galleryCaptions: '', tags: '', points: '', about: { type: 'paragraph', title: '', content: '' } })) templates.set(key, value);
const label = key => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, s => s.toUpperCase());
function status(text, error = false) { $('status').textContent = text; $('status').className = error ? 'error' : ''; }
async function api(action, payload) {
  const response = await fetch('/api/' + action, { method: payload ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'X-Editor-Token': window.editorToken }, body: payload ? JSON.stringify({ revision, ...payload }) : undefined });
  const result = await response.json(); if (!response.ok) throw new Error(result.error); return result;
}
function changed() { dirty = true; previewId = undefined; $('save').disabled = true; $('preview-panel').hidden = true; status('Unsaved changes. Preview to validate before saving.'); }
function button(text, action) { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.onclick = action; return b; }
function learn(value, key = '') {
  if (Array.isArray(value)) { if (value.length && !templates.has(key)) templates.set(key, structuredClone(value[0])); value.forEach(v => learn(v, key)); }
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => learn(v, k));
}
function field(parent, key, value, set, context = '') {
  if (Array.isArray(value)) {
    const box = document.createElement('fieldset'), legend = document.createElement('legend'); legend.textContent = label(key); box.append(legend);
    value.forEach((item, i) => {
      const row = document.createElement('div'); row.className = 'array-item';
      field(row, 'Item ' + (i + 1), item, v => { value[i] = v; set(value); }, key);
      const controls = document.createElement('div'); controls.className = 'controls';
      const move = delta => { const to = i + delta; if (to < 0 || to >= value.length) return; [value[i], value[to]] = [value[to], value[i]]; set(value); changed(); render(); };
      controls.append(button('Move Up', () => move(-1)), button('Move Down', () => move(1)));
      if (key !== 'technicalSystems') controls.append(button('Remove', () => { value.splice(i, 1); set(value); changed(); render(); }));
      row.append(controls); box.append(row);
    });
    if (key !== 'technicalSystems') box.append(button('Add Item', () => { const sample = value[0] ?? templates.get(key) ?? ''; value.push(structuredClone(sample)); set(value); changed(); render(); }));
    parent.append(box); return;
  }
  if (value && typeof value === 'object') {
    const box = document.createElement('fieldset'), legend = document.createElement('legend'); legend.textContent = label(key); box.append(legend);
    Object.entries(value).forEach(([k, v]) => field(box, k, v, next => {
      value[k] = next;
      if (k === 'type' && context === 'about') {
        delete value.content; delete value.items; delete value.images;
        if (next === 'paragraph') value.content = '';
        if (next === 'feature-list') value.items = [''];
        if (next === 'specs-list') value.items = { Label: '' };
        if (next === 'image-section') value.images = [{ url: 'images/', caption: '' }];
        set(value); changed(); render();
      } else set(value);
    }, context || key));
    if (['meta', 'storeLinks'].includes(key) || (key === 'items' && context === 'about' && !Array.isArray(value))) {
      box.append(button('Add Field', () => { const name = prompt('Field name'); if (!name) return; if (['__proto__', 'constructor', 'prototype'].includes(name) || name in value) { status('Use a new field name.', true); return; } value[name] = key === 'storeLinks' ? { url: '', text: name } : ''; set(value); changed(); render(); }));
    }
    parent.append(box); return;
  }
  const wrapper = document.createElement('label'), caption = document.createElement('span'); caption.textContent = label(key); wrapper.append(caption);
  const locked = ['id', 'legacyId', 'presentation'].includes(key);
  const image = typeof value === 'string' && (/^images\/.+\.(png|jpe?g|webp)$/i.test(value) || ['image', 'profileImage', 'gameplayPoster', 'gallery'].includes(key) || context === 'gallery');
  let input;
  if (key === 'type' && context === 'about') {
    input = document.createElement('select'); for (const type of ['paragraph', 'feature-list', 'specs-list', 'image-section']) { const option = document.createElement('option'); option.value = type; option.textContent = label(type); input.append(option); }
  } else if (key === 'featuredProjectIds' || context === 'featuredProjectIds' || context === 'projectIds') {
    input = document.createElement('select'); draft.projects.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name; input.append(o); });
  } else if (typeof value === 'boolean') { input = document.createElement('input'); input.type = 'checkbox'; input.checked = value; }
  else if (typeof value === 'number') { input = document.createElement('input'); input.type = 'number'; input.step = 'any'; }
  else if (!locked && !image && !/url|icon|type|engine|duration|category/i.test(key) && String(value).length > 65) input = document.createElement('textarea');
  else { input = document.createElement('input'); input.type = 'text'; }
  if (typeof value !== 'boolean') input.value = value ?? '';
  input.disabled = locked;
  input.oninput = () => { set(typeof value === 'boolean' ? input.checked : typeof value === 'number' ? Number(input.value) : input.value); changed(); };
  wrapper.append(input); parent.append(wrapper);
  if (image) {
    const img = document.createElement('img'); img.className = 'image-preview'; img.alt = label(key) + ' preview'; img.src = '/' + value; parent.append(img);
    const uploadLabel = document.createElement('label'); uploadLabel.textContent = 'Upload Image'; const upload = document.createElement('input'); upload.type = 'file'; upload.accept = 'image/png,image/jpeg,image/webp'; uploadLabel.append(upload); parent.append(uploadLabel);
    upload.onchange = async () => { try { const file = upload.files[0]; if (!file) return; if (file.size > 15 * 1024 * 1024) throw new Error('Use an image below 15 MB'); const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(file); }); const result = await api('upload', { name: file.name, data }); set(result.src); changed(); render(); } catch (e) { status(e.message, true); } };
  }
}
function render() {
  $('navigation').replaceChildren();
  for (const [id, name] of [['site', 'Site Content'], ['order', 'Project Order'], ...draft.projects.map(p => [p.id, p.name])]) {
    const b = button(name, () => { selected = id; render(); }); b.setAttribute('aria-current', String(id === selected)); $('navigation').append(b);
  }
  $('fields').replaceChildren();
  if (selected === 'order') {
    $('heading').textContent = 'Project Order';
    draft.index.forEach((item, i) => { const row = document.createElement('div'); row.className = 'row'; const title = document.createElement('span'); title.textContent = draft.projects[i].name; row.append(title); const move = delta => { const to = i + delta; if (to < 0 || to >= draft.index.length) return; for (const list of [draft.index, draft.projects]) [list[i], list[to]] = [list[to], list[i]]; changed(); render(); }; row.append(button('Move Up', () => move(-1)), button('Move Down', () => move(1))); $('fields').append(row); }); return;
  }
  const object = selected === 'site' ? draft.site : draft.projects.find(p => p.id === selected);
  $('heading').textContent = selected === 'site' ? 'Site Content' : object.name;
  Object.entries(object).forEach(([key, value]) => field($('fields'), key, value, v => { object[key] = v; }));
  if (selected !== 'site') {
    const optional = { videoUrl: '', gameplayPoster: 'images/', galleryCaptions: (object.gallery || []).map(() => ''), storeLinks: { Steam: { url: '', text: 'Steam' } }, team: '', technicalSystems: [] };
    const controls = document.createElement('div'); controls.className = 'controls';
    for (const [key, value] of Object.entries(optional)) if (!(key in object) && key !== 'technicalSystems') controls.append(button('Add ' + label(key), () => { object[key] = structuredClone(value); changed(); render(); }));
    $('fields').append(controls);
  }
}
async function load() { const result = await api('content'); draft = result.draft; revision = result.revision; learn(draft.site); draft.projects.forEach(p => learn(p)); dirty = false; previewId = undefined; $('save').disabled = true; $('preview-panel').hidden = true; render(); await backups(); }
async function backups() { $('backups').replaceChildren(); for (const id of await api('backups')) { const o = document.createElement('option'); o.value = id; o.textContent = new Date(Number(id.split('-')[0])).toLocaleString() + ' · ' + id.slice(-8); $('backups').append(o); } $('restore').disabled = !$('backups').options.length; }
async function run(action) { if (working) return; working = true; document.querySelectorAll('button').forEach(b => b.disabled = true); $('fields').inert = true; try { await action(); } catch (e) { status(e.message, true); } finally { working = false; $('fields').inert = false; document.querySelectorAll('button').forEach(b => b.disabled = false); $('save').disabled = !previewId; $('restore').disabled = !$('backups').options.length; } }
$('reload').onclick = () => { if (dirty && !confirm('Discard unsaved changes and reload?')) return; run(async () => { await load(); status('Content reloaded.'); }); };
$('preview').onclick = () => run(async () => { status('Validating and preparing preview…'); const result = await api('preview', { draft }); previewId = result.previewId; const url = selected !== 'site' && selected !== 'order' ? result.url.replace('index.html', 'projects/' + selected + '.html') : result.url; $('frame').src = url; $('preview-link').href = url; $('preview-panel').hidden = false; status('Validation passed. Review Preview, then Save Changes.'); });
$('save').onclick = () => run(async () => { status('Saving backup and running build tools…'); const result = await api('save', { draft, previewId }); await load(); status('Saved and verified. Backup: ' + result.backupId); });
$('restore').onclick = () => { const id = $('backups').value; if (!id || !confirm('Restore this backup? Current content will be backed up first.')) return; run(async () => { status('Restoring and rebuilding…'); await api('restore', { id }); await load(); status('Backup restored and build verified.'); }); };
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
run(async () => { await load(); status('Start with 3D Tic Tac Toe: edit the project, preview, then save.'); });
