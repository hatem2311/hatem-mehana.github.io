import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateContent } from '../js/schema.js';
import { caseStudyFacts, projectSections } from '../js/case-study.js';
const fixture = () => JSON.parse(fs.readFileSync(new URL('../data.json', import.meta.url)));
test('technical summaries are documented and reject unsafe evidence', () => {
  const data = validateContent(fixture()); const project = data.showcase.projects.find(p => p.id === 'azooma-escape');
  assert.equal(project.technicalSystems.length, 3);
  assert.equal(projectSections(project).find(s => s.type === 'technical-systems').items.length, 3);
  const invented = fixture(); invented.showcase.projects.find(p => p.id === 'azooma-escape').technicalSystems[0].pseudocode = 'invented code';
  assert.throws(() => validateContent(invented), /pseudocode/);
  const bad = fixture(); const p = bad.showcase.projects.find(p => p.id === 'azooma-escape');
  p.technicalSystems[0].videoUrl = 'https://evil.test/embed/fake'; assert.throws(() => validateContent(bad), /technicalSystems\[0\].videoUrl/);
  p.technicalSystems[0].videoUrl = project.videoUrl; p.technicalSystems[0].presentation = 'production'; assert.throws(() => validateContent(bad), /presentation/);
  p.technicalSystems[0].presentation = 'documented-summary'; p.technicalSystems[1].id = p.technicalSystems[0].id; assert.throws(() => validateContent(bad), /unique system ID/);
});
test('case studies preserve documented scope and source links for all projects', () => {
  const data = validateContent(fixture());
  for (const project of data.showcase.projects) {
    assert.ok(project.caseStudy.contributions.length);
    assert.equal(caseStudyFacts(project).Role, project.role);
    assert.equal(caseStudyFacts(project).Duration, project.duration);
    assert.equal(projectSections(project).filter(s => s.title === 'My Role').length, 0);
    for (const contribution of project.caseStudy.contributions) assert.ok(contribution.evidence.url);
  }
  const horror = data.showcase.projects.find(p => p.id === 'horror-home');
  assert.deepEqual(horror.caseStudy.levelDesign.stages, []);
  assert.deepEqual(horror.caseStudy.levelDesign.decisions, []);
  const jam = data.showcase.projects.find(p => p.legacyId === 2);
  assert.equal(jam.team, '11 members');
  assert.match(jam.caseStudy.outcomes.at(-1).evidence.url, /rate\/2563575$/);
});
test('case study URLs and measurement context fail before publication', () => {
  const unsafe = fixture(); unsafe.showcase.projects[0].caseStudy.contributions[0].evidence.url = 'javascript:alert(1)';
  assert.throws(() => validateContent(unsafe), /caseStudy.contributions\[0\].evidence.url/);
  const measurement = fixture(); measurement.showcase.projects[0].caseStudy.outcomes = [{ text: 'Frame-time measurement', measurement: { result: '16ms' } }];
  assert.throws(() => validateContent(measurement), /measurement.device/);
  const stage = fixture(); stage.showcase.projects[0].caseStudy.levelDesign.stages = [{ url: 'images/example.png', caption: 'Example' }];
  assert.throws(() => validateContent(stage), /stages.label/);
});
