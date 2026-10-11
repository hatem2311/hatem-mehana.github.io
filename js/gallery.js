import { el, image } from './dom.js';
import { safeUrl } from './urls.js';
import { refreshSlider } from './sliders.js';
import { enhanceMediaViewer } from './media-viewer.js';
export function renderGallery(project, manifest) {
  document.getElementById('mainPreview').dispatchEvent(new Event('gallery-dispose'));
  const preview = document.getElementById('mainPreview'); const thumbnails = document.getElementById('mediaThumbnails');
  const media = [...(project.videoUrl ? [{ type: 'video', url: project.videoUrl, poster: project.image }] : []), ...project.gallery.map(url => ({ type: 'image', url }))];
  function show(item, index) {
    const src = item.type === 'video' ? item.poster : item.url;
    if (item.type === 'video') {
      const button = el('button', 'video-preview-button'); button.type = 'button'; button.setAttribute('aria-label', 'Play project video');
      button.append(image(src, manifest, '(max-width: 768px) 90vw, 1000px', '', true), el('span', '', '▶ Play video'));
      button.addEventListener('click', () => { const iframe = el('iframe'); const url = new URL(safeUrl(item.url, 'video')); url.searchParams.set('autoplay', '1'); url.searchParams.set('enablejsapi', '1'); url.searchParams.set('origin', location.origin); iframe.src = url.href; iframe.title = `${project.name} video`; iframe.allow = 'autoplay; encrypted-media; fullscreen'; iframe.allowFullscreen = true; preview.replaceChildren(iframe); }, { once: true });
      preview.replaceChildren(button);
    } else preview.replaceChildren(image(src, manifest, '(max-width: 768px) 90vw, 1000px', `${project.name} screenshot ${index + 1}`, true));
    [...thumbnails.children].forEach((button, i) => { button.classList.toggle('active', index === i); button.setAttribute('aria-pressed', String(index === i)); });
  }
  thumbnails.replaceChildren(...media.map((item, i) => {
    const button = el('button', 'media-thumbnail swiper-slide'); button.type = 'button'; button.dataset.index = i; button.setAttribute('aria-label', item.type === 'video' ? 'Show project video' : `Show screenshot ${i + 1}`);
    button.append(image(item.type === 'video' ? item.poster : item.url, manifest, '160px', ''));
    if (item.type === 'video') button.append(el('span', 'play-overlay', '▶'));
    button.addEventListener('click', () => show(item, i)); return button;
  }));
  if (media.length) show(media[0], 0); else preview.replaceChildren(el('p', '', 'No media available for this project.'));
  refreshSlider(document.querySelector('.media-strip'));
  enhanceMediaViewer(project, manifest);
}
