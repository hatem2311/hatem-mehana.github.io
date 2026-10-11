import fs from 'node:fs';
import path from 'node:path';
import { projectFacts } from '../js/project-facts.js';
import { caseStudyFacts, projectSections } from '../js/case-study.js';
import { seoMetadata, seoFiles } from './seo.mjs';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function photo(src, data, alt, eager = false, sizes = '(max-width: 768px) 320px, 600px') {
  const variants = data.responsiveImages[src];
  const attributes = variants ? ` width="${variants.at(-1).width}" height="${variants.at(-1).height}" srcset="${esc(variants.map(v => `${encodeURI(v.src)} ${v.width}w`).join(', '))}" sizes="${esc(sizes)}"` : '';
  return `<img src="${esc(src)}" alt="${esc(alt)}"${attributes} loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''}>`;
}
const header = (title, subtitle) => `<div class="section-header"><h2 class="section-title">${title}</h2><p class="section-subtitle">${subtitle}</p></div>`;
function card(project, data, featured = false) {
  const preview = project.previewVideo || project.previewYouTube;
  const contribution = project.cardSummary?.contribution || project.caseStudy?.contributions[0]?.text;
  let media = photo(project.image, data, project.name);
  if (preview) {
    const full = new URL('https://www.youtube.com/watch'); full.searchParams.set('v', new URL(project.videoUrl).pathname.split('/').at(-1));
    const player = project.previewVideo ? `<video data-src="${esc(project.previewVideo)}" autoplay muted loop playsinline preload="none" aria-hidden="true"></video>` : `<span class="card-preview-player" data-youtube="${esc(project.videoUrl)}" data-start="${project.previewStart ?? 15}" aria-hidden="true"></span>`;
    media = `<a class="card-preview${project.previewVideo ? '' : ' youtube-preview'}" href="${esc(full.href)}" aria-label="Play full ${esc(project.name)} video">${photo(project.image, data, `${project.name} video preview`)}${player}<span class="card-preview-play">▶ Play full video</span></a>`;
  }
  const details = preview ? `<a class="view-details" href="projects/${project.id}.html">View Details →</a>` : '<span class="view-details">View Details →</span>';
  return `<${preview ? 'article' : 'a'} class="${featured ? 'featured-card' : 'showcase-card'}" ${preview ? '' : `href="projects/${project.id}.html" aria-label="${esc(project.name)} — View Details"`} data-project-id="${project.id}">${media}<div class="showcase-content"><h3 class="showcase-title">${esc(project.name)}</h3><p class="showcase-description">${esc(project.cardSummary?.description || project.description)}</p>${contribution ? `<p class="featured-contribution">My contribution: ${esc(contribution)}</p>` : ''}<p class="card-engine">Engine: ${esc(projectFacts(project).engine)}</p>${details}</div></${preview ? 'article' : 'a'}>`;
}
function sectionContent(section, data) {
  let body;
  if (section.type === 'technical-systems') {
    body = `<p>Documented contributions from this project. The video is a gameplay overview; it does not verify private code or architecture.</p>${section.items.map(system => `<article class="technical-system" id="system-${system.id}"><h3>${esc(system.title)}</h3><p>${esc(system.contribution)}</p><a class="evidence-link" href="${esc(system.videoUrl)}">Watch project gameplay overview</a></article>`).join('')}`;
    return `<div class="about-section" id="technical-systems"><h2>${esc(section.title)}</h2>${body}</div>`;
  }
  if (section.type === 'evidence-list' || section.type === 'decision-list') body = `<div class="case-study-list">${section.items.map(item => `<article class="case-study-item">${section.type === 'decision-list' ? `<h3>${esc(item.title)}</h3><p><strong>Challenge: </strong>${esc(item.challenge)}</p><p><strong>Solution: </strong>${esc(item.solution)}</p>` : `<p>${esc(item.text)}</p>`}${item.evidence ? `<a class="evidence-link" href="${esc(item.evidence.url)}">${esc(item.evidence.label)}</a>` : ''}${item.measurement ? `<dl>${Object.entries(item.measurement).map(([key, value]) => `<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join('')}</dl>` : ''}</article>`).join('')}</div>`;
  if (section.type === 'feature-list') body = `<ul class="feature-list">${section.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  if (section.type === 'paragraph') body = `<p class="content-paragraph">${esc(section.content)}</p>`;
  if (section.type === 'specs-list') body = `<div class="specs-grid">${Object.entries(section.items).map(([label, value]) => `<div class="spec-item"><span class="spec-label">${esc(label)}:</span><span class="spec-value">${esc(value)}</span></div>`).join('')}</div>`;
  if (section.type === 'image-section') body = `<div class="image-grid">${section.images.map(img => `<figure>${photo(img.url, data, img.caption)}<figcaption>${esc(img.caption)}</figcaption></figure>`).join('')}</div>`;
  return `<div class="about-section"><h2>${esc(section.title)}</h2>${body}</div>`;
}
export function staticPages(root, data) {
  const projects = data.showcase.projects;
  const email = data.social.find(item => item.url.startsWith('mailto:'));
  const footer = `<footer class="footer"><p>&copy; ${new Date().getFullYear()} ${esc(data.hero.name)}. All rights reserved.</p><p>Designed by <a href="https://linktr.ee/louay_rahali" target="_blank" rel="noopener noreferrer">Louay Rahali</a></p></footer>`;
  const home = `<section id="home" class="main-content other-container"><div class="left-content"><p class="greeting">${esc(data.hero.greeting)}</p><h1 class="name">${esc(data.hero.name)}</h1><p class="hero-role">${esc(data.hero.role)}</p><p class="description">${esc(data.hero.description)}</p><div class="buttons-container"><a class="contact-btn" href="#featured">Project Showcase</a><a class="contact-btn secondary-btn" href="#contact">Get in touch</a></div></div><div class="right-content">${photo(data.hero.profileImage, data, `${data.hero.name} Image`, true, '(max-width: 768px) 90vw, 450px')}</div></section>
  <section id="featured" class="featured-section">${header('Featured Projects', 'Gameplay, level design, and the work behind them')}<div id="featured-projects-grid" class="featured-grid">${data.featuredProjectIds.map(id => card(projects.find(p => p.id === id), data, true)).join('')}</div><a class="all-projects-link" href="#showcase">More Projects ↓</a></section>
  <section id="showcase" class="showcase-section">${header('More Projects', 'Browse the remaining work, or filter all seven projects')}<div id="filter-buttons-container" class="showcase-filter" aria-label="Filter projects"></div><p id="project-count" class="project-count" role="status" aria-live="polite">${projects.length - data.featuredProjectIds.length} more projects · ${projects.length} total</p><div id="all-projects-grid" class="projects-grid">${projects.filter(p => !data.featuredProjectIds.includes(p.id)).map(p => card(p, data)).join('')}</div></section>
  <section id="skills" class="skills-section">${header('Gameplay &amp; Design', 'Skills backed by projects')}<div class="skills-grid">${data.skills.map(skill => `<div class="skill-card"><h3 class="skill-title">${esc(skill.title)}</h3><ul class="skill-description">${skill.points.map(point => `<li>${esc(point)}</li>`).join('')}</ul><div class="skill-evidence">${skill.projectIds.map(id => `<a href="projects/${id}.html">See ${esc(projects.find(p => p.id === id).name)} →</a>`).join('')}</div></div>`).join('')}</div></section>
  <section id="worked" class="worked-section">${header('Experience', 'Studios and collaboration')}<div class="work-grid">${data.work.map(work => `<div class="work-item"><div class="work-image">${photo(work.image, data, work.title)}</div><div class="work-content">${work.current ? '<span class="work-label">Currently working at</span>' : ''}<h3 class="work-title">${esc(work.title)}</h3><p class="work-duration">${esc(work.duration)}</p><p class="work-description">${esc(work.description)}</p></div></div>`).join('')}</div></section>
  <section id="about" class="about-section">${header('About Me', 'The person behind the projects')}<div class="about-content"><div class="about-text"><p>${esc(data.about.description)}</p></div><div class="about-details">${[...data.about.details].sort((a,b) => (a.value.length > 30) - (b.value.length > 30)).map(detail => `<div class="detail-item"${detail.value.length > 30 ? ' data-size="large"' : ''}><div class="detail-content"><span class="detail-label">${esc(detail.label)}</span><span class="detail-value">${esc(detail.value)}</span>${detail.source ? `<a class="evidence-link" href="${esc(detail.source.url)}">${esc(detail.source.label)}</a>` : ""}</div></div>`).join('')}</div></div></section>
  <section id="contact" class="contact-section other-container">${header('Get in touch', 'Let’s talk about your next project')}<div class="social-container">${data.social.map(item => `<a href="${esc(item.url)}">${esc(item.name)}</a>`).join('')}</div></section>`;
  const contact = email ? `<div class="contact-direct" data-contact-direct><a class="contact-email" href="${esc(email.url)}">${esc(email.url.slice(7))}</a><button class="copy-email" type="button" data-copy-email="${esc(email.url.slice(7))}" hidden>Copy email</button><p class="copy-status" role="status" aria-live="polite"></p></div>` : '';
  const fill = (template, values) => template.replace(/\{\{([A-Z_]+)\}\}/g, (_, name) => name === 'CONTACT' ? contact : values[name] ?? '');
  const heroVariants = data.responsiveImages[data.hero.profileImage];
  const heroPreload = heroVariants ? `<link rel="preload" as="image" href="${esc(data.hero.profileImage)}" imagesrcset="${esc(heroVariants.map(v => `${encodeURI(v.src)} ${v.width}w`).join(', '))}" imagesizes="(max-width: 768px) 320px, (max-width: 1100px) 40vw, 520px" fetchpriority="high">` : '';
  const indexTemplate = fs.readFileSync(path.join(root, 'tools/templates/index.html'), 'utf8');
  const projectTemplate = fs.readFileSync(path.join(root, 'tools/templates/project.html'), 'utf8');
  const outputs = new Map([['index.html', fill(indexTemplate, { HOME: home.replace('(max-width: 768px) 90vw, 450px', '(max-width: 768px) 320px, (max-width: 1100px) 40vw, 520px').replace('<div class="social-container">', `${contact}<div class="social-container">`), FOOTER: footer, RESUME: esc(data.hero.resumeUrl), HERO_PRELOAD: heroPreload })]]);
  for (const [i, project] of projects.entries()) {
    const next = projects[(i + 1) % projects.length];
    const meta = caseStudyFacts(project);
    const content = `<div class="game-media"><div class="media-viewer"><div class="main-preview" id="mainPreview">${photo(project.videoUrl ? project.image : project.gallery[0] || project.image, data, project.name, true, '(max-width: 768px) 90vw, 1000px')}</div><div class="media-strip swiper"><div class="swiper-wrapper" id="mediaThumbnails"></div></div><div class="swiper-scrollbar"></div></div><div class="game-details"><h1 id="gameTitle">${esc(project.name)}</h1><p id="gameDescription">${esc(project.description)}</p><div class="game-tags" id="gameTags">${project.tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div><div class="game-meta" id="gameMeta">${Object.entries(meta).map(([label, value]) => `<p>${esc(label)}: <span>${esc(Array.isArray(value) ? value.join(', ') : value)}</span></p>`).join('')}</div><div id="buttons-container" class="game-buttons">${Object.entries(project.storeLinks || {}).map(([store, item]) => `<a href="${esc(item.url)}" class="btn btn-primary store-button" target="_blank" rel="noopener noreferrer">${esc(store)}</a>`).join('')}${project.videoUrl ? `<noscript><a class="btn btn-secondary" href="${esc(project.videoUrl)}">Watch project video</a></noscript>` : ''}</div></div></div><div class="game-about" id="gameAbout">${projectSections(project).map(section => sectionContent(section, data)).join('')}<noscript><h2>Project screenshots</h2><div class="image-grid">${project.gallery.map(src => photo(src, data, project.name)).join('')}</div></noscript></div><div class="project-journey"><a id="next-project" href="projects/${next.id}.html">Next Project: ${esc(next.name)} →</a><a id="project-contact" href="${esc(email?.url || 'index.html#contact')}">${esc(email?.url.slice(7) || 'Get in touch')}</a></div>`;
    outputs.set(`projects/${project.id}.html`, fill(projectTemplate, { BASE: '<base href="../">', TITLE: esc(project.name), PROJECT_ID: `data-project-id="${project.id}"`, PROJECT: content, FOOTER: footer }));
  }
  const fallback = `<h1 id="gameTitle">Choose a project</h1><p id="gameDescription">Explore gameplay and level design projects below.</p><div id="gameTags"></div><div id="gameMeta"></div><div id="buttons-container"></div><div id="mainPreview"></div><div class="media-strip swiper"><div id="mediaThumbnails" class="swiper-wrapper"></div></div><div class="swiper-scrollbar"></div><div id="gameAbout">${projects.map(p => `<p><a href="projects/${p.id}.html">${esc(p.name)} — View Details</a></p>`).join('')}</div><div class="project-journey"><a id="next-project" href="projects/${projects[0].id}.html">Explore projects →</a><a id="project-contact" href="${esc(email?.url || 'index.html#contact')}">${esc(email?.url.slice(7) || 'Get in touch')}</a></div>`;
  const legacyFallback = fallback
    .replace('<h1 id="gameTitle">', '<div class="game-media"><div class="game-details"><h1 id="gameTitle">')
    .replace('<div id="mainPreview">', '</div><div class="media-viewer"><div class="main-preview" id="mainPreview">')
    .replace('<div id="gameAbout">', '</div></div><div class="game-about" id="gameAbout">');
  outputs.set('page.html', fill(projectTemplate, { TITLE: 'Projects', PROJECT: legacyFallback, FOOTER: footer }));
  outputs.set('index.html', outputs.get('index.html').replace('</head>', `  ${seoMetadata(data)}\n</head>`));
  outputs.set('page.html', outputs.get('page.html').replace('</head>', `  ${seoMetadata(data, null, true)}\n</head>`));
  for (const project of projects) { const file = `projects/${project.id}.html`; outputs.set(file, outputs.get(file).replace('</head>', `  ${seoMetadata(data, project)}\n</head>`)); }
  for (const [file, text] of seoFiles(data)) outputs.set(file, text);
  for (const [relative, html] of outputs) {
    if (relative.startsWith('projects/')) outputs.set(relative, html.replace('href="#main"', `href="${relative}#main"`));
  }
  return outputs;
}
