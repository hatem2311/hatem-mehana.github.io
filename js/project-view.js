import { el, link } from './dom.js';
import { renderAbout } from './about.js';
import { renderGallery } from './gallery.js';
import { caseStudyFacts, projectSections } from './case-study.js';
export function renderProject(project, manifest, data) {
  document.title = `${project.name} | Hatem Mehana`;
  document.getElementById('gameTitle').textContent = project.name;
  document.getElementById('gameDescription').textContent = project.description;
  document.getElementById('gameTags').replaceChildren(...project.tags.map(tag => el('span', 'tag', tag)));
  const meta = caseStudyFacts(project);
  document.getElementById('gameMeta').replaceChildren(...Object.entries(meta).map(([label, value]) => { const node = el('p', '', `${label}: `); node.append(el('span', '', Array.isArray(value) ? value.join(', ') : value)); return node; }));
  document.getElementById('buttons-container').replaceChildren(...Object.entries(project.storeLinks || {}).map(([store, item]) => { const node = link(item.url, 'btn btn-primary store-button', store); node.target = '_blank'; node.rel = 'noopener noreferrer'; return node; }));
  document.getElementById('gameAbout').replaceChildren(...projectSections(project).map(section => renderAbout(section, manifest)));
  renderGallery(project, manifest);
  const next = data.showcase.projects[(data.showcase.projects.findIndex(p => p.id === project.id) + 1) % data.showcase.projects.length];
  document.getElementById('next-project').href = `projects/${next.id}.html`;
  document.getElementById('next-project').textContent = `Next Project: ${next.name} →`;
  const email = data.social.find(item => item.url.startsWith('mailto:'));
  if (email) { document.getElementById('project-contact').href = email.url; document.getElementById('project-contact').textContent = email.url.slice(7); }
}
