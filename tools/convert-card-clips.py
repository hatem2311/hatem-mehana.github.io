from pathlib import Path
import subprocess, json
root=Path(__file__).resolve().parent.parent
ffmpeg=root/'.video-tools/bin/ffmpeg.exe'
out=root/'images/previews'
for slug in ['implant-mission-the-lost-tree','king-of-stratgy']:
    source=out/(slug+'-source.webm')
    subprocess.run([str(ffmpeg),'-loglevel','error','-y','-i',str(source),'-t','8','-an','-vf','fps=15,scale=480:-2','-c:v','libvpx-vp9','-crf','36','-b:v','0',str(out/(slug+'.webm'))],check=True)
    subprocess.run([str(ffmpeg),'-loglevel','error','-y','-i',str(source),'-t','8','-filter_complex','fps=12,scale=320:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer','-loop','0',str(out/(slug+'.gif'))],check=True)
    print(json.dumps({'project':slug,'webm_bytes':(out/(slug+'.webm')).stat().st_size,'gif_bytes':(out/(slug+'.gif')).stat().st_size}))
