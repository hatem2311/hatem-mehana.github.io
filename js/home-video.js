import { el, image, link } from './dom.js';
import { safeUrl } from './urls.js';
export function renderHomeVideo(data) {
  const project = data.showcase.projects.find(p => p.id === data.featuredProjectIds[0] && p.videoUrl) || data.showcase.projects.find(p => p.videoUrl);
  const section = document.getElementById('home-video'); if (!section || !project) return;
  const host = section.querySelector('.home-video-frame'); const button = el('button', 'home-video-play'); button.type = 'button'; button.setAttribute('aria-label', `Play ${project.name} gameplay`);
  button.append(image(project.gameplayPoster || project.image, data.responsiveImages, '(max-width: 768px) 90vw, 640px', `${project.name} gameplay preview`), el('span', '', '▶ Play gameplay'));
  const external = new URL('https://www.youtube.com/watch'); external.searchParams.set('v', new URL(safeUrl(project.videoUrl, 'video')).pathname.split('/').at(-1));
  const fallback = section.querySelector('.home-video-fallback'); fallback.replaceChildren(link(external.href, 'evidence-link', 'Watch on YouTube'));
  let timer;
  function play() {
    clearTimeout(timer); const iframe = el('iframe'); iframe.src = safeUrl(project.videoUrl, 'video'); iframe.title = `${project.name} gameplay video`; iframe.allow = 'encrypted-media; fullscreen'; iframe.allowFullscreen = true;
    const status = el('p'); status.setAttribute('role', 'status'); const retry = el('button', 'media-control', 'Retry homepage video'); retry.type = 'button'; retry.hidden = true; retry.addEventListener('click', play);
    const fail = () => { if (iframe.isConnected) { status.textContent = 'If the video is unavailable, retry or watch on YouTube.'; retry.hidden = false; } };
    iframe.addEventListener('error', fail); host.replaceChildren(iframe); fallback.replaceChildren(status, retry, link(external.href, 'evidence-link', 'Watch on YouTube')); timer = setTimeout(fail, 10000);
  }
  button.addEventListener('click', play); host.replaceChildren(button);
}
