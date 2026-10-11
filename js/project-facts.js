export function projectFacts(project) {
  return {
    role: project.role || 'Contribution details in project',
    engine: project.engine || project.tags.find(tag => /^(Unity|Roblox)/i.test(tag)) || 'See project tools',
    platform: Array.isArray(project.meta.Platforms) ? project.meta.Platforms.join(', ') : project.meta.Platforms || 'See project details',
    status: project.meta.Status || project.type
  };
}
