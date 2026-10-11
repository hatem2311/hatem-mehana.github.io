import { fetchPortfolioData, selectProject } from './data.js';
import { createDataLoader } from './loading.js';
import { initSlider } from './sliders.js';
import { renderProject } from './project-view.js';
import { initContactCopy, renderContact } from './contact.js';
initContactCopy();
const run = createDataLoader(async () => {
  const data = await fetchPortfolioData();
  const search = location.search || (document.body.dataset.projectId ? `?project=${document.body.dataset.projectId}` : '');
  const project = selectProject(data, search);
  renderProject(project, data.responsiveImages, data);
  renderContact(data);
  const preview = document.querySelector('#mainPreview img');
  Promise.resolve(preview?.decode().catch(() => {})).then(() => initSlider('.media-strip', { speed: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200, spaceBetween: 15, slidesPerView: 'auto', scrollbar: { el: '.swiper-scrollbar' } })).catch(error => console.error('Gallery enhancement unavailable:', error));
}, [document.querySelector('.game-show')], { preserveContent: Boolean(document.body.dataset.projectId) });
run();
