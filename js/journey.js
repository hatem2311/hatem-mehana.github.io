const key = 'portfolio-project-return';
export function rememberJourney(filter, projectId) {
  try { sessionStorage.setItem(key, JSON.stringify({ filter, projectId, y: window.scrollY })); } catch { /* Storage is optional. */ }
}
export function readJourney() {
  try { const value = JSON.parse(sessionStorage.getItem(key)); return value && typeof value.filter === 'string' && Number.isFinite(value.y) ? value : null; } catch { return null; }
}
export function restoreJourney() {
  if (location.hash !== '#showcase' || !readJourney()) return;
  const state = readJourney();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const card = [...document.querySelectorAll('.showcase-card, .featured-card')].find(node => node.dataset.projectId === state.projectId && !node.closest('[hidden]'));
    (card?.matches('a') ? card : card?.querySelector('.view-details'))?.focus({ preventScroll: true }); window.scrollTo({ top: state.y, behavior: 'instant' });
  }));
}
