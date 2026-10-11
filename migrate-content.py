"""One-time migration from the generated data bundle to editable content sources."""
from pathlib import Path
import json, re, hashlib
from PIL import Image
root = Path(__file__).resolve().parent
directory = root / 'content'
if (directory / 'site.json').exists(): raise SystemExit('Content already migrated')
data = json.loads((root / 'data.json').read_text(encoding='utf-8'))
manifest = {'version': 1, 'options': {'widths': [320, 640, 1280, 1920], 'quality': 82}, 'images': {}}
reverse = {}
for optimized, variants in data.pop('responsiveImages').items():
    base = re.sub(r'-\d+\.webp$', '', optimized.replace('images/optimized/', 'images/'))
    source = next((base + ext for ext in ['.png', '.jpg', '.jpeg', '.webp'] if (root / (base + ext)).is_file()), None)
    if not source: raise ValueError(f'Cannot locate source for {optimized}')
    manifest['images'][source] = {'sha256': hashlib.sha256((root / source).read_bytes()).hexdigest(), 'variants': variants}
    reverse[optimized] = source
def restore(value):
    if isinstance(value, dict): return {key: restore(item) for key, item in value.items()}
    if isinstance(value, list): return [restore(item) for item in value]
    return reverse.get(value, value) if isinstance(value, str) else value
data = restore(data)
projects = data.pop('showcase')['projects']
(directory / 'projects').mkdir(parents=True, exist_ok=True)
def save(file, value): file.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
save(directory / 'site.json', data)
index = []
for i, project in enumerate(projects):
    slug = re.sub(r'[^a-z0-9]+', '-', project['name'].lower()).strip('-')
    project['id'] = slug
    project['legacyId'] = i
    project['role'] = project['meta'].pop('MyRole', project['meta'].pop('Developer', project['meta'].pop('Designer', ''))).strip()
    project['duration'] = project['meta'].pop('Execution Time', '').strip()
    file = f'projects/{slug}.json'
    save(directory / file, project)
    index.append({'id': slug, 'legacyId': i, 'file': file})
save(directory / 'projects.json', index)
save(directory / 'assets-manifest.json', manifest)
print(f'Migrated {len(projects)} projects and {len(manifest["images"])} source images')
