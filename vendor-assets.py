"""Download the existing pinned-major Swiper and Outfit assets for local serving."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import hashlib
import re
root = Path(__file__).resolve().parent / 'vendor'
root.mkdir(exist_ok=True)
def download(url):
    request = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(request, timeout=30) as response:
        return response.read()
for name, url in {
    'swiper-bundle.min.js': 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
    'swiper-bundle.min.css': 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
}.items():
    (root / name).write_bytes(download(url))
(root / 'swiper-bundle.mjs').write_bytes((root / 'swiper-bundle.min.js').read_bytes() + b'\nexport default Swiper;\n')
css = download('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=optional').decode()
for url in set(re.findall(r'url\((https://[^)]+)\)', css)):
    filename = 'outfit-' + hashlib.sha256(url.encode()).hexdigest()[:12] + Path(urlparse(url).path).suffix
    (root / filename).write_bytes(download(url))
    css = css.replace(url, filename)
(root / 'outfit.css').write_text(css, encoding='utf-8')
print('Swiper and Outfit assets saved locally')
