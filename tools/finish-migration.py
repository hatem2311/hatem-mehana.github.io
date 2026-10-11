from pathlib import Path
root = Path(__file__).resolve().parent.parent
(root / 'vendor/swiper-bundle.mjs').write_bytes((root / 'vendor/swiper-bundle.min.js').read_bytes() + b'\nexport default Swiper;\n')
(root / 'optimize-images.py').write_text("from pathlib import Path\nimport runpy\nrunpy.run_path(str(Path(__file__).resolve().parent / 'tools/optimize-images.py'), run_name='__main__')\n", encoding='utf-8')
(root / 'image-dimensions.py').write_text("# Image dimensions are generated together with responsive variants.\nfrom pathlib import Path\nimport runpy\nrunpy.run_path(str(Path(__file__).resolve().parent / 'tools/optimize-images.py'), run_name='__main__')\n", encoding='utf-8')
