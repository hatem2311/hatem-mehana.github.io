"""Extract the existing eight-second YouTube preview ranges without changing editorial content."""
from pathlib import Path
import sys, shutil
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / '.video-tools'))
import imageio_ffmpeg
from yt_dlp import YoutubeDL
from yt_dlp.utils import download_range_func
from yt_dlp.postprocessor.ffmpeg import FFmpegPostProcessor
ffmpeg = root / '.video-tools' / 'bin' / 'ffmpeg.exe'
ffmpeg.parent.mkdir(exist_ok=True)
if not ffmpeg.exists(): shutil.copyfile(imageio_ffmpeg.get_ffmpeg_exe(), ffmpeg)
FFmpegPostProcessor._ffmpeg_location.set(ffmpeg.as_posix())
out = root / 'images' / 'previews'
out.mkdir(exist_ok=True)
for slug, video, start in [('implant-mission-the-lost-tree','Ssm2PqiFbOQ',90), ('king-of-stratgy','GfK1WgT8G7Y',15)]:
    try:
        with YoutubeDL({'format': 'bv[height<=480]/b[height<=480]', 'outtmpl': str(out / (slug + '-source.%(ext)s')), 'ffmpeg_location': ffmpeg.as_posix(), 'js_runtimes': {'node': {}}, 'download_ranges': download_range_func(None, [(start,start+8)]), 'noplaylist': True, 'socket_timeout': 20, 'retries': 1}) as downloader:
            downloader.download(['https://www.youtube.com/watch?v='+video])
    except Exception as error:
        print(f'EXTRACTION FAILED {slug}: {error}', flush=True)
