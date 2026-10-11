import fs from 'node:fs';
for (const page of ['index.html', 'page.html']) {
  const modules = page === 'index.html'
    ? ['home-entry.js', 'data.js', 'schema.js', 'urls.js', 'loading.js', 'home-view.js', 'navigation.js', 'projects.js', 'dom.js', 'sliders.js']
    : ['project-entry.js', 'data.js', 'schema.js', 'urls.js', 'loading.js', 'project-view.js', 'about.js', 'gallery.js', 'dom.js', 'sliders.js'];
  const links = modules.map(name => `  <link rel="modulepreload" href="js/${name}">`).join('\n');
  fs.writeFileSync(page, fs.readFileSync(page, 'utf8').replace(/^.*rel="modulepreload".*\r?\n/gm, '').replace('</head>', `${links}\n</head>`).replace(/[ \t]+$/gm, ''));
}
