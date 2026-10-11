export function caseStudyFacts(project) {
  return Object.fromEntries(Object.entries({
    Role: project.role, Team: project.team, Duration: project.duration, Engine: project.engine,
    Platform: Array.isArray(project.meta.Platforms) ? project.meta.Platforms.join(', ') : project.meta.Platforms,
    Status: project.meta.Status
  }).filter(([, value]) => value));
}
export function projectSections(project) {
  const study = project.caseStudy;
  if (!study) return project.about;
  const sections = [];
  if (project.technicalSystems?.length) sections.push({ type: 'technical-systems', title: 'Technical systems', items: project.technicalSystems });
  if (study.contributions.length) sections.push({ type: 'evidence-list', title: 'My contributions', items: study.contributions });
  if (study.decisions.length) sections.push({ type: 'decision-list', title: 'Challenge → Solution → Evidence', items: study.decisions });
  if (study.figures.length) sections.push({ type: 'image-section', title: 'A closer look', images: study.figures });
  if (study.outcomes.length) sections.push({ type: 'evidence-list', title: 'Evidence & outcomes', items: study.outcomes });
  const level = study.levelDesign;
  if (level) {
    sections.push({ type: 'paragraph', title: 'Level design: player flow', content: level.summary });
    if (level.stages.length) sections.push({ type: 'image-section', title: 'Layout → Blockout → Final', images: level.stages.map(stage => ({ url: stage.url, caption: `${stage.label}: ${stage.caption}` })) });
    if (level.decisions.length) sections.push({ type: 'decision-list', title: 'Level design decisions', items: level.decisions });
  }
  // Keep the original overview and tools available, avoiding a duplicate role section.
  return [...sections, ...project.about.filter(section => section.title !== 'My Role')];
}
