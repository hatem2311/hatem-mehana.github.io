# Tasks 22–23

Implemented locally on 2026-10-10.

Task 22 applies the approved dark palette to both page types through `design-system.css`: background #0B1016, surfaces #141C25, primary text #F2F3F5, secondary text #B1B6C0, border #2B2F36 and Ice Blue #67B7FF. Shared spacing uses 8px increments. Cards retain horizontal 16:9 images, visible details, quiet pointer lighting, focus outlines and reduced-motion support. Text/accent/background contrast pairs measured between 8.01:1 and 17.20:1, exceeding AA text requirements; this is not a full WCAG certification.

Task 23 keeps the public identity Hatem Mehana consistent, corrects LinkedIn, WhatsApp, YouTube, Google Play and itch.io labels, and edits related English copy. The contact section and project pages expose the actual mailto address plus a keyboard-operable copy button. Copy success is announced; a rejected or unavailable clipboard gives a manual-copy instruction and keeps the address usable. The button is hidden without JavaScript. No availability claim, time zone label, testimonial or contact form was added without confirmed information.

Validation: 31 Edge browser scenarios and seven schema tests passed. Browser coverage includes palette contrast on both page types, clipboard success/failure paths, keyboard activation, 320/360/390px layouts, static content, gallery and old URLs. Visual QA covered `task23-contact-desktop.png` and `task23-contact-mobile.png`. Performance results are in `performance-results.json`; the existing budget is enforced by `performance-check.cjs`.

Six throttled mobile performance samples passed the existing budget: maximum LCP 2.156s, CLS 0.00085, and initial resource transfer 420,718 bytes. These are local lab measurements, not production field results.

Both page types use the same Segoe UI/Arial system font stack to avoid downloading font files and preserve the mobile transfer budget. Sources remain the content JSON, templates, and modules. Run the build after content edits. No production deployment was performed.
