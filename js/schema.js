import { safeUrl } from './urls.js';
export function validateContent(input) {
  const data = structuredClone(input);
  const fail = (field, message) => { throw new Error(`Content error: ${field}: ${message}`); };
  const object = (v, field) => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(field, 'expected an object'); };
  const text = (v, field) => { if (typeof v !== 'string' || !v.trim()) fail(field, 'expected non-empty text'); };
  const array = (v, field) => { if (!Array.isArray(v)) fail(field, 'expected an array'); };
  const texts = (v, field) => { array(v, field); v.forEach((s, i) => text(s, `${field}[${i}]`)); };
  const url = (v, field, kind) => { try { safeUrl(v, kind); } catch (e) { fail(field, e.message); } };
  object(data, 'root'); object(data.hero, 'hero');
  text(data.hero.name, 'hero.name'); text(data.hero.description, 'hero.description');
  data.hero.greeting ??= "Hey, I'm Hatem!"; data.hero.role ??= 'Gameplay Developer';
  text(data.hero.greeting, 'hero.greeting'); text(data.hero.role, 'hero.role');
  if (data.hero.profileImage) url(data.hero.profileImage, 'hero.profileImage', 'image');
  data.hero.resumeUrl ||= 'hatem mehana.pdf'; url(data.hero.resumeUrl, 'hero.resumeUrl', 'asset');
  object(data.about, 'about'); text(data.about.description, 'about.description');
  array(data.about.details, 'about.details');
  data.about.details.forEach((item, i) => { object(item, `about.details[${i}]`); text(item.label, `about.details[${i}].label`); text(item.value, `about.details[${i}].value`); });
  data.about.details.forEach((item, i) => { if (item.source) { object(item.source, `about.details[${i}].source`); text(item.source.label, `about.details[${i}].source.label`); url(item.source.url, `about.details[${i}].source.url`, 'link'); } });
  for (const field of ['skills', 'work', 'social']) array(data[field], field);
  data.skills.forEach((item, i) => { text(item.title, `skills[${i}].title`); texts(item.points, `skills[${i}].points`); item.projectIds ??= []; texts(item.projectIds, `skills[${i}].projectIds`); });
  data.work.forEach((item, i) => { text(item.title, `work[${i}].title`); text(item.description, `work[${i}].description`); url(item.image, `work[${i}].image`, 'image'); });
  data.social.forEach((item, i) => { text(item.name, `social[${i}].name`); url(item.url, `social[${i}].url`, 'link'); });
  object(data.showcase, 'showcase'); array(data.showcase.projects, 'showcase.projects');
  const ids = new Set();
  data.showcase.projects.forEach((project, i) => {
    const field = `project ${project?.name || i}`;
    object(project, field);
    for (const key of ['name', 'description', 'image', 'type']) text(project[key], `${field}.${key}`);
    url(project.image, `${field}.image`, 'image');
    if (project.cardSummary !== undefined) { object(project.cardSummary, `${field}.cardSummary`); text(project.cardSummary.description, `${field}.cardSummary.description`); text(project.cardSummary.contribution, `${field}.cardSummary.contribution`); }
    if (project.previewStart !== undefined && (!project.previewYouTube || !Number.isFinite(project.previewStart) || project.previewStart < 0)) fail(`${field}.previewStart`, 'expected nonnegative seconds for a YouTube preview');
    if (project.previewYouTube !== undefined) { if (typeof project.previewYouTube !== 'boolean') fail(`${field}.previewYouTube`, 'expected a boolean'); if (project.previewYouTube && !project.videoUrl) fail(`${field}.videoUrl`, 'a YouTube preview needs a full video'); }
    if (project.previewVideo !== undefined) { url(project.previewVideo, `${field}.previewVideo`, 'asset'); if (!/^images\/.+\.(webm|mp4)$/.test(project.previewVideo)) fail(`${field}.previewVideo`, 'expected a local WebM or MP4 file'); if (!project.videoUrl) fail(`${field}.videoUrl`, 'a preview needs a full video'); }
    project.id ||= `project-${i}`;
    if (!/^[a-z0-9-]+$/.test(project.id) || ids.has(project.id)) fail(`${field}.id`, 'expected a unique stable ID');
    ids.add(project.id);
    project.tags ??= []; project.gallery ??= []; project.about ??= []; project.meta ??= {};
    texts(project.tags, `${field}.tags`); texts(project.gallery, `${field}.gallery`);
    project.gallery.forEach(src => url(src, `${field}.gallery`, 'image'));
    if (project.galleryCaptions !== undefined) { texts(project.galleryCaptions, `${field}.galleryCaptions`); if (project.galleryCaptions.length !== project.gallery.length) fail(`${field}.galleryCaptions`, 'expected one caption per gallery image'); }
    object(project.meta, `${field}.meta`);
    project.role ??= project.meta.MyRole || project.meta.Developer || project.meta.Designer || '';
    project.duration ??= project.meta['Execution Time'] || '';
    if (typeof project.role !== 'string' || typeof project.duration !== 'string') fail(field, 'role and duration must be text');
    if (project.technicalSystems !== undefined) {
      array(project.technicalSystems, `${field}.technicalSystems`); const systems = new Set();
      project.technicalSystems.forEach((system, n) => { const key = `${field}.technicalSystems[${n}]`; object(system, key); for (const name of ['id', 'title', 'contribution']) text(system[name], `${key}.${name}`); if (!/^[a-z0-9-]+$/.test(system.id) || systems.has(system.id)) fail(`${key}.id`, 'expected a unique system ID'); systems.add(system.id); url(system.videoUrl, `${key}.videoUrl`, 'video'); if (system.presentation !== 'documented-summary') fail(`${key}.presentation`, 'only documented summaries are supported'); for (const name of ['flow', 'pseudocode', 'tradeoff', 'problem']) if (system[name] !== undefined) fail(`${key}.${name}`, 'unverified technical details must remain pending'); });
    }
    for (const key of ['team', 'engine']) if (project[key] !== undefined) text(project[key], `${field}.${key}`);
    if (project.caseStudy !== undefined) {
      const study = project.caseStudy; const label = `${field}.caseStudy`; object(study, label);
      const evidence = (item, key) => { if (item.evidence) { object(item.evidence, `${key}.evidence`); text(item.evidence.label, `${key}.evidence.label`); url(item.evidence.url, `${key}.evidence.url`, 'link'); } };
      const decisions = (items, key) => { array(items, key); items.forEach((item, n) => { object(item, `${key}[${n}]`); for (const name of ['title', 'challenge', 'solution']) text(item[name], `${key}[${n}].${name}`); evidence(item, `${key}[${n}]`); }); };
      for (const key of ['contributions', 'decisions', 'figures', 'outcomes']) study[key] ??= [];
      for (const key of ['contributions', 'outcomes']) { array(study[key], `${label}.${key}`); study[key].forEach((item, n) => { object(item, `${label}.${key}[${n}]`); text(item.text, `${label}.${key}[${n}].text`); evidence(item, `${label}.${key}[${n}]`); if (item.measurement) { object(item.measurement, `${label}.${key}[${n}].measurement`); for (const name of ['device', 'settings', 'method', 'result']) text(item.measurement[name], `${label}.${key}[${n}].measurement.${name}`); } }); }
      decisions(study.decisions, `${label}.decisions`);
      const figures = (items, key) => { array(items, key); items.forEach((item, n) => { url(item.url, `${key}[${n}].url`, 'image'); text(item.caption, `${key}[${n}].caption`); }); };
      figures(study.figures, `${label}.figures`);
      if (study.levelDesign) { const level = study.levelDesign; object(level, `${label}.levelDesign`); text(level.summary, `${label}.levelDesign.summary`); level.stages ??= []; level.decisions ??= []; figures(level.stages, `${label}.levelDesign.stages`); level.stages.forEach(item => text(item.label, `${label}.levelDesign.stages.label`)); decisions(level.decisions, `${label}.levelDesign.decisions`); }
    }
    if (project.videoUrl) url(project.videoUrl, `${field}.videoUrl`, 'video');
    if (project.gameplayPoster) url(project.gameplayPoster, `${field}.gameplayPoster`, 'image');
    if (project.storeLinks) { object(project.storeLinks, `${field}.storeLinks`); Object.entries(project.storeLinks).forEach(([name, item]) => { object(item, `${field}.storeLinks.${name}`); url(item.url, `${field}.storeLinks.${name}`, 'link'); }); }
    array(project.about, `${field}.about`);
    project.about.forEach((section, j) => {
      const label = `${field}.about[${j}]`; object(section, label); text(section.title, `${label}.title`);
      if (section.type === 'feature-list') texts(section.items, `${label}.items`);
      else if (section.type === 'paragraph') text(section.content, `${label}.content`);
      else if (section.type === 'specs-list') object(section.items, `${label}.items`);
      else if (section.type === 'image-section') { array(section.images, `${label}.images`); section.images.forEach(img => { url(img.url, `${label}.images.url`, 'image'); text(img.caption, `${label}.images.caption`); }); }
      else fail(`${label}.type`, `unknown section type ${section.type}`);
    });
  });
  data.featuredProjectIds ??= data.showcase.projects.slice(0, 3).map(p => p.id);
  texts(data.featuredProjectIds, 'featuredProjectIds');
  if (data.featuredProjectIds.length !== 3 || new Set(data.featuredProjectIds).size !== 3) fail('featuredProjectIds', 'expected three different projects');
  [...data.featuredProjectIds, ...data.skills.flatMap(skill => skill.projectIds)].forEach(id => { if (!ids.has(id)) fail('project references', `unknown project ${id}`); });
  data.responsiveImages ??= {};
  object(data.responsiveImages, 'responsiveImages');
  Object.entries(data.responsiveImages).forEach(([src, variants]) => {
    url(src, 'responsiveImages key', 'image'); array(variants, `responsiveImages.${src}`);
    if (!variants.length) fail(src, 'image variants cannot be empty');
    variants.forEach(image => { url(image.src, src, 'image'); if (!Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(image.height) || image.height <= 0) fail(src, 'image dimensions must be positive integers'); });
  });
  return data;
}
