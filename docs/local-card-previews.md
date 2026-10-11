# Local card previews

Implant Mission and King Of Stratgy now use local, muted, looping WebM previews instead of YouTube iframe previews. The full-video destination is preserved as an explicit link. Azooma's existing local preview is unchanged.

Actual clips were extracted from the existing project videos. Implant is now an eight-second montage of three verified gameplay shots around 90, 150 and 220 seconds: water, platforms and trees. King uses the existing battle segment around 15 seconds. WebM uses 480px width and 15fps; downloadable GIF versions use 320px width and 12fps.

| Project | WebM bytes | GIF bytes |
| --- | --- | --- |
| Implant Mission | 171449 | 1771005 |
| King Of Stratgy | 192767 | 1176624 |

WebM is used in cards because it is much smaller and supports pausing when offscreen or reduced motion is enabled. GIF copies are in `images/previews/` for reuse. No YouTube player/API requests are made by the homepage previews. Native clips load only when at least half the preview is visible; all visible local previews now play independently without the previous ten-second rotation wait. Unavailable media retains the poster and full-video link. Implant uses the new `implant-mission-montage.webm` asset path to avoid serving its old single-shot preview from cache.

The updated 13-case preview suite verifies Azooma and Implant starting together within 2.5 seconds in the local desktop test, plus pause/reduced motion, failure and mobile behavior. Reproduce the Implant montage with `tools/make-implant-montage.py --render`; the older extraction/conversion scripts produce the original single-shot clips.

Checks: all 12 `tests/card-preview.cjs` cases pass, including actual playback of both extracted files, duration/mute/loop, zero YouTube requests, failure fallback, filters, keyboard/touch activation and mobile throttling. `tests/tasks35-40.cjs` and nine schema tests pass. Two throttled performance samples pass the existing budgets: home initial transfer 276983 bytes, LCP 960ms, CLS 0; project LCP 2300ms, CLS 0.

Reproduce with Python packages `yt-dlp` and `imageio-ffmpeg` installed into ignored `.video-tools/`, then run `tools/extract-card-clips.py` followed by `tools/convert-card-clips.py`. Node is used by the downloader; no browser cookies are used. Generated intermediate source clips are not needed by the site.
