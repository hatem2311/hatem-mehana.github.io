export async function initSlider(selector, options) {
  const { default: Swiper } = await import('../vendor/swiper-bundle.mjs');
  const node = document.querySelector(selector);
  return node.swiper || new Swiper(node, options);
}
export function refreshSlider(node) { requestAnimationFrame(() => { if (node.swiper && !node.swiper.destroyed) { node.swiper.update(); node.swiper.slideTo(0, 0); } }); }
