"""Incremental, repeatable image generation. Content sources and original images stay intact."""
import argparse, hashlib, json, os, subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageOps
parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
parser.add_argument('--node', default='node')
options = parser.parse_args()
root = options.root.resolve()
manifest_file = root / 'content/assets-manifest.json'
manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
subprocess.run([options.node, str(root / 'tools/build.mjs'), '--source-only'], check=True)
paths = set()
def collect(value):
    if isinstance(value, dict):
        for item in value.values(): collect(item)
    elif isinstance(value, list):
        for item in value: collect(item)
    elif isinstance(value, str) and value.startswith('images/') and Path(value).suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'}: paths.add(value)
collect(json.loads((root / 'content/site.json').read_text(encoding='utf-8')))
for entry in json.loads((root / 'content/projects.json').read_text(encoding='utf-8')):
    collect(json.loads((root / 'content' / entry['file']).read_text(encoding='utf-8')))
config = {'widths': [320, 640, 1280, 1920], 'quality': 82}
changed = []
pending = []
with tempfile.TemporaryDirectory(prefix='.portfolio-images-', dir=root) as temporary:
    staging = Path(temporary)
    for index, source in enumerate(sorted(paths)):
        file = root / source
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        previous = manifest['images'].get(source)
        if manifest.get('options') == config and previous and previous['sha256'] == digest and all((root / variant['src']).is_file() for variant in previous['variants']): continue
        with Image.open(file) as original:
            image = ImageOps.exif_transpose(original).convert('RGBA' if 'A' in original.getbands() else 'RGB')
            variants = []
            for width in config['widths']:
                if variants and width > image.width: continue
                copy = image.copy(); copy.thumbnail((width, 10000), Image.Resampling.LANCZOS)
                target = Path('images/optimized') / Path(source).relative_to('images').parent / f'{file.stem}-{digest[:12]}-{copy.width}.webp'
                stage = staging / f'{index}-{width}.webp'
                copy.save(stage, 'WEBP', quality=config['quality'], method=6)
                variants.append({'src': target.as_posix(), 'width': copy.width, 'height': copy.height})
                pending.append((stage, root / target))
            manifest['images'][source] = {'sha256': digest, 'variants': variants}
            changed.append(source)
    manifest['options'] = config
    # No live files change until every source has decoded successfully.
    for stage, target in pending:
        target.parent.mkdir(parents=True, exist_ok=True)
        os.replace(stage, target)
    candidate = manifest_file.with_suffix('.candidate.json')
    try:
        candidate.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        subprocess.run([options.node, str(root / 'tools/build.mjs'), '--manifest', str(candidate), '--check'], check=True)
        if candidate.read_bytes() != manifest_file.read_bytes(): os.replace(candidate, manifest_file)
    finally:
        if candidate.exists(): candidate.unlink()
    subprocess.run([options.node, str(root / 'tools/build.mjs')], check=True)
print(json.dumps({'changed_images': changed, 'count': len(changed)}))
