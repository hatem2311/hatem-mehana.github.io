import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateContent } from '../js/schema.js';
import { safeUrl } from '../js/urls.js';
import { selectProject, fetchPortfolioData } from '../js/data.js';
const fixture = () => JSON.parse(fs.readFileSync(new URL('../data.json', import.meta.url), 'utf8'));
test('optional media and tags default without mutating source content', () => {
  const data = fixture(); delete data.showcase.projects[0].gallery; delete data.showcase.projects[0].tags;
  const result = validateContent(data);
  assert.deepEqual(result.showcase.projects[0].gallery, []); assert.deepEqual(result.showcase.projects[0].tags, []);
  assert.equal(data.showcase.projects[0].gallery, undefined);
});
test('errors identify the project and malformed field', () => {
  for (const type of ['gallery', 'tags']) { const data = fixture(); data.showcase.projects[0][type] = 'wrong'; assert.throws(() => validateContent(data), new RegExp(`project .*${type}`)); }
  const data = fixture(); data.showcase.projects[0].about[0].type = 'unknown'; assert.throws(() => validateContent(data), /about\[0\].type/);
  const missing = fixture(); delete missing.hero; assert.throws(() => validateContent(missing), /hero/);
});
test('unsafe protocols and video hosts are refused; quotes in local image paths remain valid', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///test']) assert.throws(() => safeUrl(value));
  for (const value of ['https://evil.test/embed/abc', 'https://www.youtube.com.evil.test/embed/abc', 'https://www.youtube.com/watch?v=abc']) assert.throws(() => safeUrl(value, 'video'));
  assert.equal(safeUrl("images/quote's & shot.webp", 'image'), "images/quote's & shot.webp");
});
test('stable and legacy URLs continue to select the same project', () => {
  const data = validateContent(fixture());
  for (const project of data.showcase.projects) { assert.equal(selectProject(data, `?id=${project.legacyId}`), project); assert.equal(selectProject(data, `?project=${project.id}`), project); }
  for (const query of ['', '?id=abc', '?id=999', '?id=-1', '?id=', '?project=missing']) assert.throws(() => selectProject(data, query), error => error.code === 'PROJECT_NOT_FOUND');
});
test('network and JSON errors propagate; a successful fetch is validated', async () => {
  await assert.rejects(fetchPortfolioData(async () => ({ ok: false, status: 404 })), /404/);
  await assert.rejects(fetchPortfolioData(async () => ({ ok: true, json: async () => { throw new SyntaxError('JSON'); } })), /JSON/);
  const data = await fetchPortfolioData(async () => ({ ok: true, json: async () => fixture() })); assert.equal(data.showcase.projects.length, 7);
});
test('built images reserve space and fit the performance budget', () => {
  const data = fixture(); const budget = JSON.parse(fs.readFileSync(new URL('../performance-budget.json', import.meta.url)));
  let total = 0;
  for (const variants of Object.values(data.responsiveImages)) { for (const image of variants) { assert.ok(image.height > 0 && image.width > 0 && image.width <= budget.maxImageWidth); assert.ok(fs.existsSync(image.src)); } const size = fs.statSync(variants.at(-1).src).size; assert.ok(size <= budget.largestImageBytes); total += size; }
  assert.ok(total <= budget.publishedImagesTotalBytes);
});

test('featured selection and skill evidence reject missing or duplicate references', () => {
  const duplicate = fixture(); duplicate.featuredProjectIds[1] = duplicate.featuredProjectIds[0];
  assert.throws(() => validateContent(duplicate), /three different projects/);
  const missing = fixture(); missing.skills[0].projectIds = ['does-not-exist'];
  assert.throws(() => validateContent(missing), /unknown project does-not-exist/);
});
test('gallery captions require one non-empty description per image', () => {
  const data = fixture(); data.showcase.projects[0].galleryCaptions = ['Only one'];
  assert.throws(() => validateContent(data), /one caption per gallery image/);
  data.showcase.projects[0].galleryCaptions = data.showcase.projects[0].gallery.map(() => '');
  assert.throws(() => validateContent(data), /galleryCaptions/);
});
test('card previews require a local video file and full video destination', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../data.json', import.meta.url)));
  const project = data.showcase.projects.find(p => p.id === 'azooma-escape');
  project.previewVideo = 'https://evil.test/clip.webm'; assert.throws(() => validateContent(data), /previewVideo/);
  project.previewVideo = 'images/Azooma/game_title.png'; assert.throws(() => validateContent(data), /previewVideo/);
  project.previewVideo = 'images/Azooma/827089c520bfe9f758c14cf58089a032.webm'; delete project.videoUrl; assert.throws(() => validateContent(data), /videoUrl/);
});
