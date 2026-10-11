import { safeUrl } from './urls.js';
export function el(tag, className = '', text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
export function icon(name) { const node = el('ion-icon'); node.setAttribute('name', name || 'ellipse'); node.setAttribute('aria-hidden', 'true'); return node; }
export function image(src, manifest, sizes, alt = '', eager = false) {
  const node = el('img');
  const variants = manifest?.[src];
  if (variants) {
    node.srcset = variants.map(v => `${encodeURI(safeUrl(v.src, 'image'))} ${v.width}w`).join(', ');
    node.sizes = sizes;
    node.width = variants.at(-1).width; node.height = variants.at(-1).height;
  }
  node.src = safeUrl(src, 'image'); node.alt = alt;
  node.loading = eager ? 'eager' : 'lazy';
  if (eager) node.fetchPriority = 'high';
  return node;
}
export function link(url, className, text) { const node = el('a', className, text); node.href = safeUrl(url); return node; }
