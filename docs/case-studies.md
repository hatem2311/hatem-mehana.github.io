# Case studies and evidence

Edit `content/projects/<id>.json`, then run `node tools/build.mjs`. `js/case-study.js` supplies the same sections and facts to generated HTML and the browser renderer. All seven project pages include documented contributions and evidence links. Team is displayed only when documented (11 members for Implant Mission). The original tools and overview remain available.

`caseStudy.contributions` and `outcomes` contain `{ text, evidence: { label, url } }`. A gameplay video or screenshot illustrates the project; it does not independently verify who authored a feature. Store pages demonstrate availability, not download counts or personal attribution. `decisions` contains `{ title, challenge, solution, evidence }`, populated only from documented project descriptions. `figures` contains `{ url, caption }` and uses the image pipeline.

Optional `measurement` on an outcome requires `device`, `settings`, `method`, and `result`; all are displayed. Do not add FPS, downloads, or frame-time claims without a real measurement and source. No such measurements were supplied for this implementation.

The award link is the primary Game Zanga submission/results page: https://itch.io/jam/gamezanga-specialedition/rate/2563575. The claim is #1 Overall in public voting, not first in the jury awards. Checked on 2026-10-10. Previously unsupported aggregate experience/project/store counts were removed from the public summary; the displayed count is the seven portfolio projects, linked to the grid.

## Level design assets pending

The user explicitly requested that missing layouts, historical blockouts and revision reasons stay Pending. Horror Home includes its documented layout scope and an existing Unity final-scene image, captioned as final environment lighting/composition. No route topology, historical stages, conflict locations or iteration reasons were invented.

When authentic assets are available, add `caseStudy.levelDesign`:

```json
{
  "summary": "Describe the actual player route and design goal.",
  "stages": [
    { "label": "Layout", "url": "images/project/actual-layout.png", "caption": "Explain the real route arrows and conflict points." },
    { "label": "Blockout", "url": "images/project/actual-blockout.png", "caption": "Describe the recorded prototype." },
    { "label": "Final", "url": "images/project/actual-final.png", "caption": "Identify what changed." }
  ],
  "decisions": [
    { "title": "Actual revision", "challenge": "Observed problem", "solution": "Recorded change and why", "evidence": { "label": "Revision evidence", "url": "https://your-source.example/revision" } }
  ]
}
```

The example is documentation only, not published project content. Layout arrows should be part of the authentic annotated plan. Run the optimizer when new raster assets are added. Task 26 remains In progress with these items Pending; there is no Pending public placeholder.

Checks: `node --test tests/schema.test.mjs tests/case-study.test.mjs`, `node tests/browser.cjs`, `node performance-check.cjs`, `node tools/build.mjs --check`. Browser checks cover mobile overflow, evidence links, all seven pages with and without JavaScript, and absent historical stages. Review `tasks24-26-mobile.png` and `tasks24-26-desktop.png` for visual QA.
