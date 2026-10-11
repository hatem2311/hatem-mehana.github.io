import { el, link } from './dom.js';
export function enhanceMediaViewer(project) {
  const preview = document.getElementById('mainPreview'), home = preview.parentElement;
  const thumbnails = document.getElementById('mediaThumbnails');
  const events = new AbortController(); const on = (node, type, handler) => node.addEventListener(type, handler, { signal: events.signal });
  const items = [...(project.videoUrl ? [{ caption: `${project.name} — gameplay video` }] : []), ...project.gallery.map((url, i) => ({ caption: project.galleryCaptions?.[i] || project.caseStudy?.figures.find(figure => figure.url === url)?.caption || `${project.name} — screenshot ${i + 1}` }))];
  if (!items.length) return;
  let current = 0, timer, player, returnFocus;
  const toolbar = el('div', 'media-toolbar'), caption = el('p', 'media-caption'), counter = el('span', 'media-counter'); counter.setAttribute('role', 'status'); counter.setAttribute('aria-live', 'polite');
  function button(label, handler) { const node = el('button', 'media-control', label); node.type = 'button'; on(node, 'click', handler); return node; }
  const previous = button('Previous media', () => select(-1)), next = button('Next media', () => select(1));
  const fullscreen = button('Open fullscreen media', open), close = button('Close fullscreen', () => dialog.close()); close.hidden = true;
  toolbar.append(caption, counter, previous, next, fullscreen, close); preview.after(toolbar);
  preview.tabIndex = 0; preview.setAttribute('role', 'region'); preview.setAttribute('aria-label', 'Project media; use left and right arrow keys');
  const marker = el('div'); marker.hidden = true;
  const dialog = el('dialog', 'media-dialog'); dialog.setAttribute('aria-label', `${project.name} media viewer`); document.body.append(dialog);
  function select(delta) { thumbnails.children[(current + delta + items.length) % items.length].click(); }
  function update() { clearTimeout(timer); player = undefined; current = [...thumbnails.children].findIndex(node => node.classList.contains('active')); caption.textContent = items[current].caption; counter.textContent = `${current + 1} / ${items.length}`; const photo = preview.querySelector('img'); if (photo) photo.alt = items[current].caption; }
  on(thumbnails, 'click', update); update(); previous.disabled = next.disabled = items.length < 2;
  const observer = new MutationObserver(() => {
    const iframe = preview.querySelector('iframe'); if (!iframe || iframe === player) return;
    clearTimeout(timer); player = iframe;
    const url = new URL(iframe.src);
    const fallback = el('div', 'video-fallback'), status = el('p'); status.setAttribute('role', 'status');
    const external = new URL('https://www.youtube.com/watch'); external.searchParams.set('v', url.pathname.split('/').at(-1));
    const direct = link(external.href, 'evidence-link', 'Watch on YouTube'); direct.target = '_blank'; direct.rel = 'noopener noreferrer';
    const retry = button('Retry video', () => { thumbnails.children[current].click(); preview.querySelector('.video-preview-button').click(); }); retry.hidden = true;
    fallback.append(status, retry, direct); preview.append(fallback);
    const fail = () => { if (player !== iframe || !iframe.isConnected) return; clearTimeout(timer); status.textContent = 'Video unavailable or not responding. Retry or watch on YouTube.'; retry.hidden = false; };
    iframe.mediaFail = fail; iframe.mediaReady = () => { clearTimeout(timer); status.textContent = ''; retry.hidden = true; };
    on(iframe, 'error', fail); on(iframe, 'load', () => { iframe.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'portfolio-player' }), url.origin); iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onError'] }), url.origin); }); timer = setTimeout(fail, 10000);
  }); observer.observe(preview, { childList: true });
  on(window, 'message', event => { if (!player || event.source !== player.contentWindow || !['https://www.youtube.com', 'https://www.youtube-nocookie.com'].includes(event.origin)) return; let message; try { message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return; } if (message?.event === 'onError') player.mediaFail(); if (message?.event === 'onReady' || message?.event === 'initialDelivery') player.mediaReady(); });
  function open() { returnFocus = document.activeElement; marker.style.height = `${preview.getBoundingClientRect().height + toolbar.getBoundingClientRect().height}px`; marker.hidden = false; home.insertBefore(marker, preview); dialog.append(preview, toolbar); fullscreen.hidden = true; close.hidden = false; dialog.showModal(); close.focus(); }
  on(dialog, 'close', () => { home.insertBefore(preview, marker); preview.after(toolbar); marker.hidden = true; fullscreen.hidden = false; close.hidden = true; thumbnails.children[current].click(); returnFocus?.focus(); });
  function keyboard(event) { if (event.altKey || event.ctrlKey || event.metaKey) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); select(event.key === 'ArrowRight' ? 1 : -1); } }
  on(home, 'keydown', keyboard); on(dialog, 'keydown', keyboard);
  on(preview, 'gallery-dispose', () => { if (dialog.open) dialog.close(); clearTimeout(timer); observer.disconnect(); events.abort(); dialog.remove(); toolbar.remove(); marker.remove(); });
}
