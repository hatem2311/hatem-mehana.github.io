import { el, image, link } from './dom.js';
import { safeUrl } from './urls.js';
export function cardPreview(project, manifest) {
  const full = new URL('https://www.youtube.com/watch'); full.searchParams.set('v', new URL(safeUrl(project.videoUrl, 'video')).pathname.split('/').at(-1));
  const media = link(full.href, 'card-preview', ''); media.setAttribute('aria-label', `Play full ${project.name} video`);
  media.append(image(project.image, manifest, '(max-width: 768px) 320px, 600px', `${project.name} video preview`));
  if (project.previewVideo) {
    const video = el('video'); video.dataset.src = safeUrl(project.previewVideo, 'asset'); video.autoplay = true; video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none'; video.setAttribute('aria-hidden', 'true'); media.append(video);
  } else { const player = el('span', 'card-preview-player'); player.dataset.youtube = safeUrl(project.videoUrl, 'video'); player.dataset.start = project.previewStart ?? 15; player.setAttribute('aria-hidden', 'true'); media.classList.add('youtube-preview'); media.append(player); }
  media.append(el('span', 'card-preview-play', '▶ Play full video')); return media;
}
export function initCardPreviews() {
  disposePreviews?.();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...document.querySelectorAll('.card-preview video, .card-preview-player')];
  const players = new Map(), timers = new Map(), loops = new Map(); let disposed = false;
  const visible = new Set(), failed = new Set(), playing = new Set(); let active, warmed = false, pageActive = true;
  function pause(video) { if (!video) return; if (video.tagName === 'VIDEO') { video.pause(); playing.delete(video); } else { clearTimeout(timers.get(video)); timers.delete(video); clearInterval(loops.get(video)); loops.delete(video); players.get(video)?.destroy(); players.delete(video); video.replaceChildren(); } video.parentElement?.classList.remove('is-playing'); if (active === video) active = undefined; }
  function youtube(video) {
    loadYouTube().then(YT => {
      if (disposed || active !== video || document.hidden || motion.matches) return;
      const mount = el('span'); video.append(mount); const id = new URL(video.dataset.youtube).pathname.split('/').at(-1);
      const start = Number(video.dataset.start) || 15;
      const fail = () => { if (disposed) return; failed.add(video); pause(video); sync(); };
      const player = new YT.Player(mount, { videoId:id, playerVars:{autoplay:0,playsinline:1,controls:0,loop:1,playlist:id,start,end:start+8,origin:location.origin}, events:{
        onReady: event => { if(disposed || active !== video) return; event.target.mute(); event.target.playVideo(); const iframe=event.target.getIframe(); iframe.tabIndex=-1; iframe.setAttribute('aria-hidden','true'); iframe.title='Silent gameplay preview'; },
        onStateChange:event => { if(event.data === 1 && active === video) { if(!event.target.isMuted()) { event.target.mute(); return; } clearTimeout(timers.get(video)); video.parentElement.classList.add('is-playing'); } },
        onAutoplayBlocked:fail, onError:fail
      }}); players.set(video,player); timers.set(video,setTimeout(fail,15000));
      loops.set(video,setInterval(() => { if(active === video && player.getCurrentTime?.() >= start+8) { player.seekTo(start,true); player.playVideo(); } },500));
    }).catch(() => { if(disposed) return; failed.add(video); pause(video); sync(); });
  }
  function sync() {
    const enabled = pageActive && !document.hidden && !motion.matches;
    for (const video of videos.filter(v => v.tagName === 'VIDEO')) {
      if (!enabled || failed.has(video)) { pause(video); continue; }
      if (!warmed && !visible.has(video) && !playing.has(video)) continue;
      if (playing.has(video)) continue;
      playing.add(video); video.muted = true;
      if (!video.getAttribute('src')) video.src = video.dataset.src;
      video.play().then(() => { if (!disposed && pageActive && playing.has(video) && !document.hidden && !motion.matches) video.parentElement.classList.add('is-playing'); else pause(video); }).catch(() => { failed.add(video); pause(video); });
    }
    const candidate = enabled ? videos.find(v => v.dataset.youtube && visible.has(v) && !failed.has(v)) : undefined;
    for (const video of videos) if (video.dataset.youtube && video !== candidate) pause(video);
    if (!candidate || active === candidate) return;
    active = candidate;
    if(candidate.dataset.youtube) { youtube(candidate); return; }
    candidate.muted = true;
    if (!candidate.getAttribute('src')) candidate.src = candidate.dataset.src;
    candidate.play().then(() => { if (active === candidate && visible.has(candidate) && !document.hidden && !motion.matches) candidate.parentElement.classList.add('is-playing'); else pause(candidate); }).catch(() => { failed.add(candidate); pause(candidate); });
  }
  const observer = new IntersectionObserver(entries => { for (const {target,isIntersecting,intersectionRatio} of entries) { if(isIntersecting && intersectionRatio >= .5) visible.add(target); else visible.delete(target); } sync(); }, {threshold:[0,.5]});
  for (const video of videos) { observer.observe(video); video.addEventListener('error', () => {failed.add(video); pause(video); sync();}); }
  document.addEventListener('visibilitychange', sync); motion.addEventListener('change', sync);
  // Give the hero its initial loading budget, then start even offscreen clips.
  const warm = () => { warmed = true; sync(); };
  let warmTimer;
  const scheduleWarm = () => { warmTimer = setTimeout(warm, 3000); };
  if (document.readyState === 'complete') scheduleWarm(); else window.addEventListener('load', scheduleWarm, {once:true});
  const hide = () => { pageActive = false; for(const video of videos) pause(video); };
  const show = () => { pageActive = true; sync(); };
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  disposePreviews = () => { disposed = true; clearTimeout(warmTimer); window.removeEventListener('load', scheduleWarm); hide(); observer.disconnect(); document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync); window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show); };
}
let disposePreviews;
let youtubeAPI;
function loadYouTube() {
  if(window.YT?.Player) return Promise.resolve(window.YT);
  youtubeAPI ||= new Promise((resolve,reject) => {
    const script=document.createElement('script'); script.src='https://www.youtube.com/iframe_api';
    const timeout=setTimeout(()=>reject(new Error('YouTube API unavailable')),12000);
    const previous=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);previous?.();resolve(window.YT);};
    script.onerror=()=>{clearTimeout(timeout);reject(new Error('YouTube API unavailable'));};document.head.append(script);
  });return youtubeAPI;
}
