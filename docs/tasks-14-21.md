# Tasks 14–21: implementation and verification

Completed locally on 2026-10-10. Task 17 was already complete; its performance budget remains enforced.

| Task | Result |
| --- | --- |
| 14 Content and Reliability | Generated home and seven static project pages; content survives failed modules and data requests. Legacy query URLs remain supported with a static project chooser fallback. |
| 15 Mobile and Keyboard Access | Verified 320/360/390px layouts, skip links, focus-visible, inert closed navigation, focus loop, Escape, and keyboard gallery controls. |
| 16 Motion Controls | Project grids have no autoplay. Reduced motion disables transitions, mouse lighting and gallery slide animation. |
| 18 Hero Positioning | Clear gameplay specialization, Unity/C# description, Project Showcase and Get in touch, Download CV in navigation. |
| 19 Recruiter Journey | Projects before skills/experience/about; project-linked skills; filter/scroll/card-focus restoration; next project and email. |
| 20 Featured Project Grid | Three editorial selections: Azooma Escape, Implant Mission, Horror Home. Two desktop columns and one mobile column, followed by all seven projects. |
| 21 Visible Project Cards | Title, description, contribution, engine, platform, status and View Details are always visible. Images preserve logos with contain. |

Validation: 29 Edge browser scenarios, 7 Node schema tests, image pipeline repeatability/failure test, and build freshness check all passed. Six throttled mobile samples passed the existing performance budget: home LCP 0.976–1.032s, legacy project LCP 2.104–2.120s; maximum CLS 0.00243; initial resource transfer ≤414,705 bytes. These are local lab results, not field measurements.

Reports: `browser-results.json`, `performance-results.json`. Visual checks: `task21-home-desktop.png`, `task21-home-mobile.png`, `task21-project-desktop.png`.

The site is not deployed. Future content changes must run the build; templates and content JSON are the editable sources. Task 22 and later remain outside this completion scope.
