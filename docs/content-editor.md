# No-Code Content Editor

Run `npm run editor` (or `node tools/content-editor.mjs` if npm is unavailable), then open `http://127.0.0.1:4318`. Keep the terminal running while editing. The server only listens on the local loopback interface; it does not publish the site.

## First project

The editor starts with **3D Tic Tac Toe**. Edit its name, description, card summary, role, metadata, tags, gallery and About sections using the forms. Image fields include **Upload Image** for PNG, JPEG and WebP files up to 15 MB. Uploads stay in memory until saving. Use **Preview** to validate the complete draft and view the real project page. Check the gallery, content and links; then choose **Save Changes**. Repeat the same workflow for any other project or **Site Content**.

IDs, legacy IDs, project filenames and technical system IDs are locked. The editor preserves existing source fields. Lists have **Add Item**, **Remove**, **Move Up** and **Move Down** controls. New list items copy the shape of the first item, so replace the copied text before saving. Empty editorial lists use a starter form. **Project Order** reorders the source index without changing identities; **Featured Project Ids** selects the three featured projects separately. Gallery captions, when enabled, must match the gallery count and order.

## Preview and validation

Preview uses the existing schema and static page generator, with unsaved content and original image sources. It also serves draft `data.json` so the interactive page sees the same content. Optimized sizes are generated on save. Every content change invalidates the previous preview. Missing assets, invalid links, duplicate featured selections and invalid section data block preview or save. Disk changes made by another editor require **Reload**. Preview is available while this server is running and expires after save or another preview.

## Save and undo

Each save creates `.content-editor/backups/<timestamp-id>/snapshot.json` before writing `content/site.json`, `content/projects.json` and project sources. The snapshot includes source content, the image manifest, the generated bundle, HTML pages and SEO files. Backups are local and ignored by Git. **Restore Backup** first takes a recovery snapshot, restores the selected version and rebuilds it. A failed build automatically restores the exact files captured before the operation.

Text, link and order changes run `node tools/build.mjs`. Changes to raster image references and uploaded images run the existing `python optimize-images.py` pipeline, passing the current Node executable; both paths finish with `node tools/build.mjs --check`. Unreferenced uploaded originals and generated variants remain on disk after a successful save/undo, so earlier backups can still reference them. Original image files are never overwritten by uploads.

The editor uses Codex's bundled Python when available, otherwise `python` on PATH. Set `CONTENT_EDITOR_PYTHON` to a Python executable with Pillow to override it. Set `CONTENT_EDITOR_PORT` to change the local port. `CONTENT_EDITOR_ROOT` is available for isolated test fixtures; normal use requires no configuration.

## Checks

`node --test tests/*.test.mjs` includes a complete isolated project editing test: preview/save gating, identity protection, stale draft conflicts, rollback, project reordering, staged image upload, real image optimization and failed-build recovery. It also checks all seven project forms, site content preview and mobile width with Edge through the repository's Playwright setup. It creates a temporary copy and leaves live editorial content unchanged.

Run `node tools/build.mjs --check` to verify generated content. Run `node tests/browser.cjs` for the existing website regression checks.
