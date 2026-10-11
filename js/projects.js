import { el, image } from './dom.js';
import { projectFacts } from './project-facts.js';
import { rememberJourney, readJourney } from './journey.js';
import { cardPreview, initCardPreviews } from './card-preview.js';
export function projectCard(project, manifest, featured = false) {
  const hasPreview = project.previewVideo || project.previewYouTube;
  const card = el(hasPreview ? 'article' : 'a', featured ? 'featured-card' : 'showcase-card');
  if (!hasPreview) { card.href = `projects/${project.id}.html`; card.setAttribute('aria-label', `${project.name} — View Details`); }
  card.dataset.projectId = project.id;
  const body = el('div', 'showcase-content');
  body.append(el('h3', 'showcase-title', project.name), el('p', 'showcase-description', project.cardSummary?.description || project.description));
  const contribution = project.cardSummary?.contribution || project.caseStudy?.contributions[0]?.text;
  if (contribution) body.append(el('p', 'featured-contribution', `My contribution: ${contribution}`));
  const engine = el('p', 'card-engine', `Engine: ${projectFacts(project).engine}`);
  const details = el(hasPreview ? 'a' : 'span', 'view-details', 'View Details →'); if (hasPreview) details.href = `projects/${project.id}.html`;
  body.append(engine, details);
  card.append(hasPreview ? cardPreview(project, manifest) : image(project.image, manifest, '(max-width: 768px) 320px, 600px', project.name), body);
  card.addEventListener('click', () => rememberJourney(featured ? 'All' : document.querySelector('.filter-btn.active')?.textContent || 'All', project.id));
  return card;
}
export function displayProjects(filter, projects, manifest, featuredIds) {
  const selected = projects.filter(project => filter === 'All' ? !featuredIds.includes(project.id) : project.type === filter);
  document.getElementById('featured').hidden = filter !== 'All';
  document.getElementById('all-projects-grid').replaceChildren(...selected.map(project => projectCard(project, manifest)));
  document.getElementById('project-count').textContent = filter === 'All' ? `${selected.length} more projects · ${projects.length} total` : `${selected.length} matching projects · ${projects.length} total`;
  initCardPreviews();
}
export function initProjects(data) {
  const container = document.getElementById('filter-buttons-container');
  const types = ['All', ...new Set(data.showcase.projects.map(project => project.type))];
  const saved = location.hash === '#showcase' ? readJourney()?.filter : null;
  const selected = types.includes(saved) ? saved : 'All';
  const buttons = types.map(type => {
    const button = el('button', `filter-btn${type === selected ? ' active' : ''}`, type); button.type = 'button'; button.setAttribute('aria-pressed', String(type === selected));
    button.addEventListener('click', () => { buttons.forEach(btn => { btn.classList.toggle('active', btn === button); btn.setAttribute('aria-pressed', String(btn === button)); }); displayProjects(type, data.showcase.projects, data.responsiveImages, data.featuredProjectIds); });
    return button;
  });
  container.replaceChildren(...buttons);
  document.getElementById('featured-projects-grid').replaceChildren(...data.featuredProjectIds.map(id => projectCard(data.showcase.projects.find(p => p.id === id), data.responsiveImages, true)));
  displayProjects(selected, data.showcase.projects, data.responsiveImages, data.featuredProjectIds);
}
