# Usability acceptance — task 32

Task 32 remains In progress. Real participants are deferred by the owner. No participant timings, success rates or feedback have been invented.

Local Edge automation passed all eight routes at 1440, 720, 390 and 320 CSS pixels, 25 internal links/anchors, one main heading per page, a keyboard skip link, and JavaScript error checks. CSS zoom at 200% plus 720px reflow passed; this is an emulation, not native browser zoom. A gallery scrollbar overflow found at narrow widths was fixed in shared styles. Long technical contribution text also wraps safely.

All 35 broader browser scenarios passed: project filters, CV download, keyboard menu/focus/Escape, gallery navigation/fullscreen, contact actions, reduced motion, no-JavaScript content, video activation and failure/retry fallbacks. Video integration checks do not establish unrestricted real YouTube playback in every region or device. Six throttled local Edge performance samples passed: homepage LCP 1076–1292ms and project LCP 2200–2276ms; CLS 0; initial transfer at most 448547 bytes, under the 460800-byte budget.

Reproduce with `node tests/acceptance.cjs`, `node tests/browser.cjs` and `node performance-check.cjs`. Machine acceptance results are in `acceptance-results.json`. The screenshot is `acceptance-Edge-zoom.png`.

External HTTP checks returned 200 for WhatsApp, Facebook, YouTube, itch.io and Steam; that proves a response, not a complete logged-in user journey. LinkedIn returned 999 and remains verification-limited. Both Google Play URLs returned 404 in the direct check, while official pages were present in web-source results; availability remains Pending because these observations conflict. The links were retained, not labeled verified working or conclusively dead.

Pending: 3–5 real participant sessions (identify specialization, find a strong project, explain contribution, download CV and contact; record time and friction), Chrome/Firefox not installed, Safari/iOS and physical mobile devices, native 200% browser zoom and unrestricted real video/external-service journeys. WebKit was also unavailable and would not substitute for native Safari testing.
