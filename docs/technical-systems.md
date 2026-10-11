# Technical system evidence

Task 27 remains In progress. Azooma's existing contribution notes support three summaries: saved collectibles, visual detection/enemy alerts, and gameplay UI integration. The existing gameplay video is linked as an overview, not proof of private implementation.

The earlier explanatory problems, architecture flows, pseudocode and trade-offs were removed under the owner's evidence-only instruction. No game source code was available in this repository. Pending: verified architecture, publishable code, actual implementation decisions/trade-offs, and video that demonstrates each system. Do not infer these from gameplay or request new content while this work is deferred.

Edit `technicalSystems` in `content/projects/azooma-escape.json`. Supported fields: unique `id`, `title`, `contribution`, permitted YouTube `videoUrl`, and `presentation: "documented-summary"`. The schema rejects undocumented `problem`, `flow`, `pseudocode` and `tradeoff` fields. Static and dynamic renderers share this evidence boundary.

`js/case-study.js` derives the section used by `js/about.js` and `tools/static-pages.mjs`. Contributions are rendered as text and remain readable without JavaScript.

Validation: schema/case-study tests and the browser scenario "technical summaries use existing evidence without invented details" check three summaries, absence of invented code/flows, 320/390/1440px layout and JavaScript-disabled parity.
