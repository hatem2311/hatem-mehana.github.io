import { el } from './dom.js';
export function createDataLoader(load, content, { preserveContent = false } = {}) {
  const panel = el('div', 'data-loading-status'); panel.setAttribute('role', 'status'); panel.setAttribute('aria-live', 'polite');
  if (preserveContent) panel.classList.add('preserves-content');
  const message = el('p'); const retry = el('button', '', 'Try again'); retry.type = 'button';
  const back = el('a', '', 'Back to projects'); back.href = 'index.html#showcase'; back.hidden = true;
  panel.append(message, retry, back); document.body.prepend(panel);
  let pending = false;
  async function run() {
    if (pending) return;
    pending = true; panel.hidden = false; retry.hidden = true; retry.disabled = true; back.hidden = true; message.textContent = 'Loading portfolio…';
    const footer = document.querySelector('.footer'); if (footer && !preserveContent) footer.style.visibility = 'hidden';
    content.forEach(node => { node.hidden = !preserveContent; node.setAttribute('aria-busy', 'true'); });
    try { await load(); panel.hidden = true; if (!preserveContent) content.forEach(node => { node.hidden = false; }); if (footer) footer.style.visibility = ''; }
    catch (error) {
      console.error('Unable to load portfolio:', error);
      const missing = error.code === 'PROJECT_NOT_FOUND';
      message.textContent = missing ? 'Project not found. Please choose a project from the portfolio.' : error.message.startsWith('Content error:') ? 'The portfolio content is unavailable. Please try again later.' : 'Unable to load this page. Please check your connection and try again.';
      retry.hidden = missing; back.hidden = !missing;
    } finally { pending = false; retry.disabled = false; content.forEach(node => node.setAttribute('aria-busy', 'false')); }
  }
  retry.addEventListener('click', run); return run;
}
