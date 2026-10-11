export function initNavigation() {
  const nav = document.getElementById('nav'); const menu = nav.querySelector('.nav-links'); const toggle = nav.querySelector('.hamburger');
  const mobile = matchMedia('(max-width: 768px)'); nav.classList.add('navigation-ready');
  toggle.setAttribute('aria-label', 'Open navigation'); toggle.setAttribute('aria-expanded', 'false');
  menu.id = 'navigation-links'; toggle.setAttribute('aria-controls', menu.id);
  function setOpen(open, focus = false) { toggle.classList.toggle('active', open); menu.classList.toggle('active', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); menu.inert = mobile.matches && !open; if (focus) (open ? menu.querySelector('a') : toggle).focus(); }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true', true));
  nav.addEventListener('keydown', event => {
    if (!mobile.matches || toggle.getAttribute('aria-expanded') !== 'true' || event.key !== 'Tab') return;
    const nodes = [...menu.querySelectorAll('a'), toggle], first = nodes[0], last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); } });
  const links = [...nav.querySelectorAll('.nav-link')]; links.forEach(link => link.addEventListener('click', () => { setOpen(false); const target = link.hash && document.querySelector(link.hash); if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); } else if (mobile.matches) toggle.focus(); }));
  mobile.addEventListener('change', () => setOpen(false)); setOpen(false);
  window.addEventListener('scroll', () => {
    const y = window.scrollY; nav.classList.toggle('background-active', y > 0);
    let current = '';
    document.querySelectorAll('section').forEach(section => { if (y >= section.offsetTop - section.clientHeight / 3) current = section.id; });
    links.forEach(link => link.classList.toggle('active', link.hash === `#${current}`));
  }, { passive: true });
}
export function observeAnimations() {
  // Content remains visible throughout enhancement.
}
export function initCardLighting() {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('pointermove', event => {
    if (motion.matches || event.pointerType !== 'mouse') return;
    const card = event.target.closest('.skill-card, .featured-card, .showcase-card'); if (!card) return;
    const box = card.getBoundingClientRect(); card.style.setProperty('--light-x', `${event.clientX - box.left}px`); card.style.setProperty('--light-y', `${event.clientY - box.top}px`);
  });
}
