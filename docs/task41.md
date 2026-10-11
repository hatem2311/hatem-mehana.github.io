# Task 41 — Continuous Animated Preview Playback

Local project card videos have autoplay, loop, muted and playsinline. Visible previews start immediately. Other previews start three seconds after window load; this initial delay keeps media downloads from competing with the hero. Scrolling offscreen no longer pauses a started video or resets its position. All three local previews can play concurrently.

Reduced Motion prevents video loading and playback until the preference is disabled. Autoplay rejection or unavailable files retains the existing poster and full-video link. Hidden tabs and pagehide pause videos; visibility restoration and pageshow resume without seeking to the beginning. Rebuilding filtered cards disposes their previous players and loading timer.

Validation: 14 preview scenarios cover actual continuous offscreen playback and return time, throttled mobile with all local clips playing, Reduced Motion toggling, page lifecycle, blocked autoplay, media failures, filters and full-video activation. Schema, case-study and SEO checks: 16 passed. Browser regression: 35 scenarios. Throttled performance smoke: home initial transfer 277790 bytes, LCP 944ms, CLS 0; project initial transfer 453185 bytes, LCP 2284ms, CLS 0. These are local Edge lab measurements.

The initial transfer budget measures before background warming. Continuous playback subsequently downloads approximately 970KB of preview files and consumes decoding work while the page remains visible, including offscreen clips. The mobile test uses 4x CPU throttling and 200KB/s downloads; this is not a physical-device battery benchmark. Browser autoplay restrictions still apply.
