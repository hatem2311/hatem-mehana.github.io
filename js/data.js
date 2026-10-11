import { validateContent } from './schema.js';
export async function fetchPortfolioData(fetcher = fetch) {
  const response = await fetcher('data.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Data request failed (${response.status})`);
  return validateContent(await response.json());
}
export function selectProject(data, search) {
  const params = new URLSearchParams(search);
  const stable = params.get('project');
  const legacy = params.get('id');
  const project = stable ? data.showcase.projects.find(p => p.id === stable) : legacy !== null && /^\d+$/.test(legacy) && Number.isSafeInteger(Number(legacy)) ? data.showcase.projects.find((p, i) => (p.legacyId ?? i) === Number(legacy)) : null;
  if (!project) { const error = new Error('Project not found'); error.code = 'PROJECT_NOT_FOUND'; throw error; }
  return project;
}
