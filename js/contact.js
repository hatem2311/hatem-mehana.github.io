import { el, link } from './dom.js';
export function renderContact(data) {
  const email = data.social.find(item => item.url.startsWith('mailto:'));
  if (!email) return;
  document.querySelectorAll('[data-contact-direct]').forEach(container => {
    const address = link(email.url, 'contact-email', email.url.slice(7));
    const button = el('button', 'copy-email', 'Copy email'); button.type = 'button'; button.dataset.copyEmail = email.url.slice(7); button.hidden = true;
    const status = el('p', 'copy-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    container.replaceChildren(address, button, status);
  });
  enableCopyButtons();
}
function enableCopyButtons() { document.querySelectorAll('[data-copy-email]').forEach(button => { button.hidden = false; }); }
export function initContactCopy() {
  enableCopyButtons();
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy-email]'); if (!button) return;
    const status = button.parentElement.querySelector('.copy-status');
    button.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      status.textContent = 'Email copied.';
    } catch { status.textContent = 'Select the email address to copy it, or click it to send an email.'; }
    finally { button.disabled = false; }
  });
}
