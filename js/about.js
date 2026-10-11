import { el, image, link } from './dom.js';
export function renderAbout(section, manifest) {
  const node = el('div', 'about-section'); node.append(el('h2', '', section.title));
  if (section.type === 'technical-systems') {
    node.id = 'technical-systems';
    node.append(el('p', '', 'Documented contributions from this project. The video is a gameplay overview; it does not verify private code or architecture.'));
    for (const system of section.items) {
      const card = el('article', 'technical-system'); card.id = `system-${system.id}`; card.append(el('h3', '', system.title));
      card.append(el('p', '', system.contribution));
      card.append(link(system.videoUrl, 'evidence-link', 'Watch project gameplay overview'));
      node.append(card);
    }
  }
  if (section.type === 'evidence-list' || section.type === 'decision-list') {
    const list = el('div', 'case-study-list');
    for (const item of section.items) {
      const card = el('article', 'case-study-item');
      if (section.type === 'decision-list') {
        card.append(el('h3', '', item.title));
        for (const [key, label] of [['challenge', 'Challenge'], ['solution', 'Solution']]) {
          const paragraph = el('p'); paragraph.append(el('strong', '', `${label}: `), document.createTextNode(item[key])); card.append(paragraph);
        }
      } else card.append(el('p', '', item.text));
      if (item.evidence) card.append(link(item.evidence.url, 'evidence-link', item.evidence.label));
      if (item.measurement) { const facts = el('dl'); for (const [label, value] of Object.entries(item.measurement)) facts.append(el('dt', '', label), el('dd', '', value)); card.append(facts); }
      list.append(card);
    }
    node.append(list);
  }
  if (section.type === 'feature-list') { const list = el('ul', 'feature-list'); list.append(...section.items.map(item => el('li', '', item))); node.append(list); }
  else if (section.type === 'paragraph') node.append(el('p', 'content-paragraph', section.content));
  else if (section.type === 'specs-list') {
    const grid = el('div', 'specs-grid'); Object.entries(section.items).forEach(([key, value]) => { const item = el('div', 'spec-item'); item.append(el('span', 'spec-label', `${key}:`), el('span', 'spec-value', value)); grid.append(item); }); node.append(grid);
  } else if (section.type === 'image-section') {
    const grid = el('div', 'image-grid'); section.images.forEach(img => { const figure = el('figure'); figure.append(image(img.url, manifest, '(max-width: 768px) 90vw, 600px', img.caption), el('figcaption', '', img.caption)); grid.append(figure); }); node.append(grid);
  }
  return node;
}
