import { el, image, icon, link } from './dom.js';
import { safeUrl } from './urls.js';
import { initProjects } from './projects.js';
export function renderHome(data) {
  document.querySelector('.name').textContent = data.hero.name;
  document.querySelector('.greeting').textContent = data.hero.greeting;
  document.querySelector('.hero-role').textContent = data.hero.role;
  document.querySelector('.description').textContent = data.hero.description;
  const existing = document.querySelector('.right-content img');
  if (data.hero.profileImage && existing.getAttribute('src') !== data.hero.profileImage) existing.replaceWith(image(data.hero.profileImage, data.responsiveImages, '(max-width: 768px) 320px, (max-width: 1100px) 40vw, 520px', `${data.hero.name} Image`, true));
  document.querySelectorAll('[data-resume-link]').forEach(resume => { resume.href = safeUrl(data.hero.resumeUrl || 'hatem mehana.pdf', 'asset'); });
  document.querySelector('.about-text p').textContent = data.about.description;
  document.querySelector('.about-details').replaceChildren(...[...data.about.details].sort((a, b) => (a.value.length > 30) - (b.value.length > 30)).map(detail => {
    const node = el('div', 'detail-item'); if (detail.value.length > 30) node.dataset.size = 'large';
    const symbol = icon(detail.icon); symbol.className = 'detail-icon';
    const body = el('div', 'detail-content'); body.append(el('span', 'detail-label', detail.label), el('span', 'detail-value', detail.value)); if (detail.source) body.append(link(detail.source.url, 'evidence-link', detail.source.label)); node.append(symbol, body); return node;
  }));
  document.querySelector('.skills-grid').replaceChildren(...data.skills.map(skill => {
    const node = el('div', 'skill-card'); const symbol = icon(skill.icon); symbol.className = 'skill-icon'; const list = el('ul', 'skill-description'); list.append(...skill.points.map(point => el('li', '', point))); node.append(symbol, el('h3', 'skill-title', skill.title), list);
    const evidence = el('div', 'skill-evidence');
    skill.projectIds.forEach(id => { const project = data.showcase.projects.find(p => p.id === id); evidence.append(link(`projects/${id}.html`, '', `See ${project.name} →`)); });
    node.append(evidence); return node;
  }));
  document.querySelector('.work-grid').replaceChildren(...data.work.map(work => {
    const node = el('div', 'work-item'); const photo = el('div', 'work-image'); photo.append(image(work.image, data.responsiveImages, '(max-width: 768px) 90vw, 400px', work.title));
    const body = el('div', 'work-content'); if (work.current) body.append(el('span', 'work-label', 'Currently working at'));
    body.append(el('h3', 'work-title', work.title), el('p', 'work-duration', work.duration || ''), el('p', 'work-description', work.description)); node.append(photo, body); return node;
  }));
  document.querySelector('.social-container').replaceChildren(...data.social.map(social => { const node = link(social.url, '', social.name); node.prepend(icon(social.icon)); return node; }));
  initProjects(data);
}
