import hashlib, json, shutil, subprocess, tempfile, unittest
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
NODE = shutil.which('node') or str(Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe')

class PipelineTests(unittest.TestCase):
    def test_repeatability_changes_and_failure_are_safe(self):
        with tempfile.TemporaryDirectory(prefix='portfolio-pipeline-test-') as temp:
            root = Path(temp)
            for folder in ['content/projects', 'images', 'tools', 'js']: (root / folder).mkdir(parents=True, exist_ok=True)
            for file in ['tools/build.mjs', 'tools/static-pages.mjs', 'tools/optimize-images.py', 'js/project-facts.js', 'js/schema.js', 'js/urls.js', 'package.json']: shutil.copyfile(ROOT / file, root / file)
            shutil.copytree(ROOT / 'tools/templates', root / 'tools/templates')
            def save(file, value): (root / file).write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')
            Image.new('RGB', (640, 480), 'red').save(root / 'images/first.png')
            (root / 'hatem mehana.pdf').write_bytes(b'%PDF-1.4 test')
            save('content/site.json', {'hero': {'name': 'Tester', 'description': 'Test portfolio'}, 'about': {'description': 'Bio', 'details': []}, 'skills': [], 'work': [], 'social': []})
            save('content/projects.json', [{'id': name, 'legacyId': i, 'file': f'projects/{name}.json'} for i, name in enumerate(['test', 'second', 'third'])])
            project = {'id': 'test', 'legacyId': 0, 'name': 'Test project', 'description': 'Test', 'type': 'Game', 'image': 'images/first.png', 'gallery': [], 'tags': [], 'about': [], 'meta': {}}
            save('content/projects/test.json', project)
            for i, name in enumerate(['second', 'third'], start=1): save(f'content/projects/{name}.json', {**project, 'id': name, 'legacyId': i})
            save('content/assets-manifest.json', {'version': 1, 'options': {'widths': [320, 640, 1280, 1920], 'quality': 82}, 'images': {}})
            def optimize(success=True):
                result = subprocess.run([__import__('sys').executable, str(root / 'tools/optimize-images.py'), '--root', str(root), '--node', NODE], capture_output=True, text=True)
                self.assertEqual(result.returncode == 0, success, result.stdout + result.stderr)
                return result
            optimize()
            before = {file: (root / file).read_bytes() for file in ['data.json', 'content/assets-manifest.json', 'content/site.json', 'content/projects/test.json']}
            mtimes = {file: file.stat().st_mtime_ns for file in (root / 'images/optimized').glob('*.webp')}
            result = optimize(); self.assertIn('"count": 0', result.stdout)
            for file, content in before.items(): self.assertEqual((root / file).read_bytes(), content)
            for file, timestamp in mtimes.items(): self.assertEqual(file.stat().st_mtime_ns, timestamp)
            Image.new('RGB', (640, 480), 'blue').save(root / 'images/first.png')
            Image.new('RGB', (320, 240), 'green').save(root / 'images/second.png')
            project['gallery'] = ['images/second.png']; save('content/projects/test.json', project)
            result = optimize(); self.assertIn('"count": 2', result.stdout)
            data = json.loads((root / 'data.json').read_text()); self.assertEqual(len(data['responsiveImages']), 2)
            committed = {file: (root / file).read_bytes() for file in ['data.json', 'content/assets-manifest.json']}
            (root / 'images/second.png').write_bytes(b'broken image')
            optimize(False)
            for file, content in committed.items(): self.assertEqual((root / file).read_bytes(), content)
            project['gallery'] = ['images/missing.png']; save('content/projects/test.json', project)
            result = optimize(False); self.assertIn('missing image', result.stderr)
            self.assertIn('showcase.projects[0].gallery', result.stderr)
            for file, content in committed.items(): self.assertEqual((root / file).read_bytes(), content)

if __name__ == '__main__': unittest.main()
