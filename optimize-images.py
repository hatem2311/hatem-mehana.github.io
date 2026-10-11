from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).resolve().parent / 'tools/optimize-images.py'), run_name='__main__')
