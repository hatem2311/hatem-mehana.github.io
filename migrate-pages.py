from pathlib import Path
import re
root = Path(__file__).resolve().parent
for name, entry in [('index.html', 'js/home-entry.js'), ('page.html', 'js/project-entry.js')]:
    file = root / name
    html = file.read_text(encoding='utf-8')
    html = re.sub(r'<script\b[^>]*>[\s\S]*?</script>', '', html)
    html = html.replace('</body>', f'  <script type="module" src="{entry}"></script>\n  <script type="module" async src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>\n</body>')
    if name == 'index.html':
        html = html.replace('download class="contact-btn"', 'download data-resume-link class="contact-btn resume-link"')
        html = re.sub(r'\s*<!-- <div class="showcase-container">[\s\S]*?-->\s*', '\n', html)
    file.write_text(html, encoding='utf-8')
(root / 'app.js').write_text("// Compatibility entry.\nimport './js/home-entry.js';\n", encoding='utf-8')
(root / 'data-loading.js').write_text("// Compatibility exports.\nexport { fetchPortfolioData, selectProject } from './js/data.js';\nexport { createDataLoader } from './js/loading.js';\n", encoding='utf-8')
