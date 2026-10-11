"""Create a local montage from the existing project gameplay video."""
from pathlib import Path
import sys, subprocess, json
root=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(root/'.video-tools'))
from yt_dlp import YoutubeDL
ffmpeg=root/'.video-tools/bin/ffmpeg.exe'
source=root/'.video-tools/implant-full.webm'
if not source.exists():
    with YoutubeDL({'format':'bv[height<=480]/b[height<=480]','outtmpl':str(source),'js_runtimes':{'node':{}},'socket_timeout':20,'retries':1,'quiet':True}) as y:
        y.download(['https://www.youtube.com/watch?v=Ssm2PqiFbOQ'])
for start in [90,150,220]:
    subprocess.run([str(ffmpeg),'-loglevel','error','-y','-ss',str(start),'-i',str(source),'-frames:v','1',str(root/'.video-tools'/f'implant-{start}.jpg')],check=True)
if '--render' in sys.argv:
    out=root/'images/previews'
    cuts=';'.join(f'[0:v]trim=start={start}:duration={duration},setpts=PTS-STARTPTS[v{i}]' for i,(start,duration) in enumerate([(90,2.666),(150,2.666),(220,2.668)]))
    filters=cuts+';[v0][v1][v2]concat=n=3:v=1:a=0,fps=15,scale=480:-2[out]'
    subprocess.run([str(ffmpeg),'-loglevel','error','-y','-i',str(source),'-filter_complex',filters,'-map','[out]','-an','-c:v','libvpx-vp9','-crf','36','-b:v','0',str(out/'implant-mission-montage.webm')],check=True)
    subprocess.run([str(ffmpeg),'-loglevel','error','-y','-i',str(out/'implant-mission-montage.webm'),'-filter_complex','fps=12,scale=320:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer','-loop','0',str(out/'implant-mission-montage.gif')],check=True)
    print(json.dumps({'webm_bytes':(out/'implant-mission-montage.webm').stat().st_size,'gif_bytes':(out/'implant-mission-montage.gif').stat().st_size}))
