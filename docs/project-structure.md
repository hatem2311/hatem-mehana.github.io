# Project files

| Location | Purpose |
| --- | --- |
| `content/` | Editable site and project content. Preserve stable IDs. |
| `images/` | Project images, optimized variants and video previews. |
| `js/` | Feature modules and shared browser code. |
| `tools/` | Build, media processing and SEO utilities. |
| `tests/` | Automated checks; persistent inputs live in `tests/fixtures/`. |
| `docs/` | Implementation and editing documentation. |
| `projects/`, `share/` | Generated project pages and sharing images. |
| `vendor/` | Local browser dependencies. |
| `artifacts/` | Ignored reports, screenshots and retained design references. |

Browser and performance checks save reports and screenshots in `artifacts/`. Historical documentation may mention filenames without this directory prefix. These outputs can be regenerated. Keep `tests/fixtures/tasks35-40-before.json`: it is a required regression input.

Root HTML, CSS, compatibility scripts, `data.json`, SEO files and the CV have stable paths used by the site or tooling. `.video-tools/` holds media-processing dependencies. Use the main project checkout for development; redundant publishing clones have been removed.
