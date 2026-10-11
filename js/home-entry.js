import { fetchPortfolioData } from './data.js';
import { createDataLoader } from './loading.js';
import { renderHome } from './home-view.js';
import { initNavigation, initCardLighting } from './navigation.js';
import { restoreJourney } from './journey.js';
import { initContactCopy, renderContact } from './contact.js';
initNavigation();
initCardLighting();
initContactCopy();
const run = createDataLoader(async () => {
  const data = await fetchPortfolioData(); renderHome(data);
  renderContact(data);
  restoreJourney();
}, [...document.querySelectorAll('section')], { preserveContent: true });
run();
