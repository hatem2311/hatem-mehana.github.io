const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function siteBase(value) {
  if (!value) return null;
  if (typeof value !== 'string' || value.trim() !== value) throw new Error('seo.siteUrl must be an HTTPS site base');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('seo.siteUrl must be an HTTPS site base without credentials, query or fragment');
  url.pathname = url.pathname.replace(/\/+$/, '') + '/'; return url;
}
export function seoMetadata(data, project, legacy = false) {
  const base = siteBase(data.seo?.siteUrl); const title = project ? `${project.name} | ${data.hero.name}` : legacy ? `Projects | ${data.hero.name}` : `${data.hero.name} | ${data.hero.role}`;
  const description = project ? `${project.description} My role: ${project.role}.` : data.hero.description;
  const canonical = base && !legacy ? new URL(project ? `projects/${project.id}.html` : '', base).href : null;
  const image = base ? new URL(`share/${project?.id || 'home'}.png`, base).href : null;
  const meta = (property, content, name = false) => `<meta ${name ? 'name' : 'property'}="${property}" content="${esc(content)}">`;
  return [meta('description', description, true), meta('robots', legacy || !base ? 'noindex, follow' : 'index, follow', true), meta('og:title', title), meta('og:description', description), meta('og:type', 'website'), meta('og:site_name', `${data.hero.name} Portfolio`), meta('twitter:card', 'summary_large_image', true), meta('twitter:title', title, true), meta('twitter:description', description, true), ...(canonical ? [`<link rel="canonical" href="${esc(canonical)}">`, meta('og:url', canonical), meta('og:image', image), meta('og:image:type', 'image/png'), meta('og:image:width', '1200'), meta('og:image:height', '630'), meta('og:image:alt', project ? `${project.name} — ${project.role}` : `${data.hero.name} — ${data.hero.role}`), meta('twitter:image', image, true)] : [])].join('\n  ');
}
export function seoFiles(data) {
  const base = siteBase(data.seo?.siteUrl);
  const urls = base ? [base.href, ...data.showcase.projects.map(p => new URL(`projects/${p.id}.html`, base).href)] : [];
  return new Map([
    ['sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${esc(url)}</loc></url>`).join('\n')}\n</urlset>\n`],
    ['robots.txt', base ? `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', base).href}\n` : 'User-agent: *\nDisallow: /\n']
  ]);
}
