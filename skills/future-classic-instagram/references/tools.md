# Production tools

Before image generation or video-input acceptance, record source-backed front-mark/plate geometry and run `advertising-workflow.mjs check-layout manifest.json`. This verifies markLayout evidence fields, not actual pixels. Original mount, physical centerline and visible cropped fragments matter; identical screen-x does not. See vehicle-identity-qa.md. Before/after `check-ready` checks markLayout independently for each selected state; no universal centered hood badge is invented.

General beauty-film candidate selection: `advertising-workflow.mjs compositions candidates.json` exports optional source-supported camera roles. `init manifest.json selection.json` accepts sourceIds and elementSourceIds; six roles are a compatibility example. `check-camera manifest.json` checks explicit camera reference frame, direction, start/end views and keepHidden. Before/after alternating films instead use the separate `future-classic-before-after` skill/tool and two state-specific Elements.

## Manual Kling handoff package

`node scripts/instagram/prepare-download-pack.mjs manifest.json new-output-directory` (installed skill: `scripts/prepare-download-pack.mjs`) creates matching numbered PNG/TXT files, four exterior Element references, setup, description-only text and Korean instructions. Source SHA256, safe IDs and manifest structure are checked before writing; an existing output is refused. `source.videoPrompt` overrides the generic prompt. It preserves QA states and never submits generation or uploads files. Add a preview sheet and ZIP, then follow `drive-delivery.md` for verified cloud delivery. Run its `.test.mjs` after changes. Keep this helper, its test and `advertising-workflow.mjs` together in the installed scripts folder.

For current finished-car Reels/Shorts use advertising-workflow.mjs (repository scripts/instagram and skill scripts copy): init, prompts, check-images, check-element, check-videos and assemble. See [kling-reel-workflow.md](kling-reel-workflow.md). It selects four exterior Element references, prepares six shot roles without the rejected grille macro, uses Kling3.0/3s/1080p9:16, and assembles1x clips with no added zoom and end fade only. It performs no remote generation or publication.

Run from the diy-cars project root with its installed Node dependencies (`sharp`). Repository tools live in `scripts/instagram`; the installed skill bundles matching files in its `scripts` directory. These local tools never call image generation or publish. The agent must verify source evidence and the real user selection; a JSON field alone is not consent.

Every production configuration includes `selection: {status: "selected", candidateId: "<actual reviewed ID>", userMessage: "<actual choice>", selectedAt: "<timestamp>"}`. Never create this record for an unselected case. A specifically requested cover experiment can instead supply `experiment: {requestedBy: "user", scope: "cover-only"}` to the cover renderer and plate tool only. It cannot unlock packaging or scene planning.

Workflow prerequisite before invoking these tools for production: the selected case has a verified published `siteArticle` as defined in SKILL.md. The current helper code checks selection but does not independently query the live website; the agent must check and record that prerequisite. Do not interpret tool success as proof of a published, searchable site article. Existing cover experiments remain unverified assets until the site-first workflow and identity checks pass.

## Scene planning

For current advertising films, use `review-advertising-plan.mjs` with explicit `background: {setting,lighting,weather,rationale}` and actual reviewed-export history. Rain is optional; repeated wet concepts receive an advisory warning. Original-photo settings, bright/dark spaces, green country roads, factory grounds and harbors are options, not a mandatory sequence. Older `creative-plan.mjs` cover presets below are optional staging suggestions, not authority to override the current film treatment.

Before EVERY vehicle image generation/edit use installed `scripts/validate-image-references.mjs manifest.json` with original-photo crops and actual input file list. Audit prepared and observed submitted inputs separately; schema is in `vehicle-identity-qa.md`. This checks files/hashes/records and cannot inspect emblems itself. The video-input gate now also requires per-angle `lightingReview` observations for body, glazing, lamp lenses, ground and background, with actual evidence files. Known rear-reflection failures must be held even if lamps are OFF.

`node scripts/instagram/creative-plan.mjs plan-config.json`

Config: `selection`, `postKey`, `vehicleReference`, optional `history` JSON path, optional `sceneId`, optional `output` JSON path. History is an array of actual reviewed results with `sceneId`, `candidateId`, `output`, and `reviewedAt`. Excludes the three most recent scene types by default; `explicitRepeat` requires an actual user-requested repeat. Planner writes a plan, not history. After inspecting the actual generated result, append its real scene and selected asset to history; do not log a planned prompt as a finished image. Review recent thumbnails too.

Additional choices: `sceneId: original|harbor|factory` alongside existing scenes. `original` requires a reviewed `sourceBackgroundReference`. Set `atmosphere: bright|dark|source-matched` and `weather: dry|overcast-dry|rain|post-rain`; default is source-matched atmosphere and dry weather, never inherited E30 rain. Record `backgroundRationale` and `identityReferenceManifest` for the chosen image-input audit. Planner fields are planning records, not a completed generation or fidelity pass. Current source-based creative choice may override automatic presets with a recorded rationale; do not ask for routine creative approval.

Plan defaults: `vehicleMode: reference-scene`, parked car, no people, varied setting, background darker than the car with believable soft body lighting. Use imagegen to generate the complete vehicle and setting together from the real finished-car references. Do not paste an original foreground cutout or retain its old pavement/reflections. Preserve observed vehicle identity, lettering and provenance; compare both wheels, badges and body graphics before continuing. Keep documentary photographs faithful. Caption generation is semantic editorial work: use model-first identification, one short description, then short uppercase-headed work-summary sections as specified in SKILL.md; never reproduce the whole source narrative.

## Actual logo on staged cover plate

`node scripts/instagram/brand-plate.mjs plate-config.json`

Config: `selection` (or explicit cover experiment), `image`, `output` PNG, `logo` pointing to the current approved handwritten wordmark, and `quad` containing image-pixel corners in TL, TR, BR, BL order. Input is preserved. Uses an affine approximation suitable for a modestly angled plate; inspect alignment and do not claim arbitrary perspective correction. This helper is for the generated promotional hero. For owner-selected restoration website photos, the owner’s2026-10-25 rule instead reuses `scripts/instagram/composite-plate.py` with the approved opaque plate asset and actual source-pixel TL/TR/BR/BL corners. It preserves every other pixel. Primary vehicle plates use the Future Classic logo; background vehicles receive neutral masks. Inspect full-size originals and results, include background/reflection plates, retain source/hash/coordinate metadata and remove task-owned temporary originals only after verified live publication. Other documentary/social uses retain their existing neutral-mask rule unless the owner directs otherwise.

## Typography and alpha overlay

`node scripts/instagram/render-cover.mjs cover-config.json`

Config: `selection` (or explicit cover experiment), `image`, `output` JPG, `overlay` RGBA PNG, `title`, optional `subtitle`, `badge`, `font` (default Bahnschrift), `fontSize`, `width`, `height`, reviewed source-pixel `crop`, optional `color: {brightness,saturation,contrast,offset,gamma}`, and one layout height below. Historical renderer default: 1080 × 1080; current production configurations must explicitly set width: 1080 and height: 1440. Input is preserved. The separate overlay is transparent outside the text area. Inspect text fit and vehicle framing; the renderer cannot identify which vehicle parts a crop removes. Preserve a photo-only alternative.

## Upload package

`node scripts/instagram/package-post.mjs post-config.json output-directory`

Config: `selection`, `postKey`, `community`, `author`, `caption`, optional `sourceReuseStatus`, and `slides`. Each slide supplies `file` (consistent-size JPG), `stage` (hero/before/work/after), `sourceUrl`, and `plateReview` (`masked-verified` or `no-readable-plate`, only after visual inspection). Order is one hero, before/work, after. Caption includes body and hashtags with `🚗 {Community} · 🧑‍🔧 {author}` as the final line; no URLs or From. Current conservative tool ceiling is five hashtags; verify platform limits before delivery.

Outputs: numbered JPGs, photos-only `photos.zip`, single-paste `caption.txt`, `upload-package.zip`, and a receipt with selection and `published: false`. Add the source evidence ledger and remote review described in `workflow.md`; packaging alone does not validate restoration eligibility, reuse permission or remote delivery.

## Verification

`node --test scripts/instagram/tools.test.mjs`

Inspect every actual exported image as well as running tests. A successful script must never advance candidate selection, user review or publishing status.

## Cover layout selection

The following square recipes are historical examples. For current 3:4 production set width: 1080 and height: 1440, choose header height from the photograph, and review the actual portrait composition:

- **Vehicle needs room:** set `headerHeight: 200` on a 1080 square. The image fills the remaining area, with a dedicated dark top header (`headerColor`, default `#151718`), no bottom matte, and all typography inside the header. Overlay opacity defaults to zero. Choose a crop that preserves the complete vehicle. Approved example: `artifacts/instagram/005-e30-325ix/v08-top-header/render-config.json`.
- **Vehicle fits a square:** set `textAreaHeight: 200` with no header. The photograph fills the entire square; only the upper text area receives a translucent black panel. Default `opacity: 0.48`; adjust to the photograph. Everything below this area remains free of the overlay. Keep the car visible and all title/model text inside the panel.

Do not combine `headerHeight` and `textAreaHeight`. Heights use output pixels and must be below canvas height. Review typography for overflow and shorten or resize text as needed. Omitting both retains the old full-image alpha/contain mode for historical recipes only; do not use it as the default for new posts. Current non-cover images follow the portrait documentary layout below; square focal crops are historical. Whole-vehicle shots require the entire vehicle, with padding if needed.


Do not reuse the hero source photograph later in the carousel, even with different crops, zoom, color grading or typography. Deduplicate all slides by original photo identity, not output filename. Record sourceAssetId, sourceImageUrl or sourcePhoto with its publisher URL for each slide, including the hero. Mark whole-vehicle slides with framing: "whole-vehicle" and vehicleComplete: true only after visual review. Keep plate masking in internal review records; do not include operational notices such as "Original build photographs" or "visible plates concealed" in the public caption.


## Portrait documentary layout

`node scripts/instagram/render-photo-slide.mjs layout.json`

Config: selection, output JPG, images (one portrait or two landscape photos), width/height (default 1080/1440), gap (default 24), background (default #000000). Each image supplies file and a unique sourceAssetId. Use reviewed plate-protected photographs. Paired slides default to cover-fit in equal panels with no outer or inner padding; a 24px opaque black separator remains. Review focal crops. Set fit: contain explicitly only when preserving an entire photo is necessary. Single portrait photographs also default to cover-fit, with no padding. Select pairs editorially: matching before/after, component plus installed result, or related work steps. Portrait sources remain single. Keep pairing rationale in the source ledger.

For packaging paired slides, supply sources with per-image sourceAssetId, sourceUrl, stage and plateReview. All constituent IDs are checked globally, including the hero. Comparisons use stage comparison, comparisonMatchVerified true, first source stage before/work and second after. Non-comparison pairs retain their actual common stage. The top-level sourceUrl and plateReview summarize the slide and do not replace constituent records. Inspect each final portrait export and its profile thumbnail.

Optional legacy label treatment, only when the owner explicitly requests labels again:
For paired comparisons, use a black horizontal divider (24px at 1080 width) and small white English labels right-aligned immediately above/below it. Use BEFORE / AFTER only for verified condition changes; use relationship-specific labels such as RESTORED / INSTALLED for component/result pairs. If no meaningful landscape partner remains, omit genuinely redundant evidence or preserve the unpaired photo alone with neutral padding; never pair unrelated photos solely to fill a slide. render-photo-slide accepts labels: [top, bottom] and allowSingleLandscape: true for this reviewed exception. Record the reason.


Documentary comparison/pair slides use an opaque pure-black (#000000) gutter and label backings with small white type. No translucent black wash or gray matte on these slides. Preserve the source photograph itself. This does not change the separate approved hero typography treatments.

Optional legacy label treatment, only when the owner explicitly requests labels again:
Every small paired-photo label needs its own opaque #000000 rectangular backing sized from measured text bounds, with modest horizontal/vertical padding. Keep white lettering inset inside the rectangle, right-aligned near the separator, so image content never reduces legibility. The renderer measures the actual lettering rather than guessing from character count.


Latest paired-panel layout: fill the full width and height of both photo panels, flush with the black separator and outer canvas edges. Do not leave variable side/top/bottom padding inside paired slides. render-photo-slide defaults paired images to fit cover; each image may set position (for example north for seat headrests). Inspect every crop: preserve complete vehicles when shown as whole-vehicle views, and keep documented work recognizable. If both no-padding and full-vehicle requirements cannot be met, regroup/select a more suitable source rather than silently claiming an intact vehicle. This supersedes earlier contain-fit defaults for paired slides.


Production invocation: `node scripts/instagram/render-photo-slide.mjs layout.json`. The agent supplies the recorded user selection, two reviewed landscape source paths with distinct sourceAssetId values, output, fit: cover and optional labels. Use width: 1080, height: 1440, gap: 24, background: #000000. Save each image position with the recipe so the reviewed crop is reproducible. The helper writes a JPG and returns fit, source IDs and measured label-box bounds. It performs no publication and cannot itself verify source chronology or vehicle completeness.


Portrait source photos also fill their 3:4 slide edge-to-edge with reviewed cover-fit, rather than side padding. Do not leave the last landscape photograph alone: collect an additional distinct, source-backed finished photo to pair it with. Use an already captured photo when available, excluding the hero and all prior constituent photos, and review its plate mask and crop.

Optional legacy label treatment, only when the owner explicitly requests labels again:
Paired-slide labels are flush: the upper opaque black label box touches the upper edge of the separator, the lower box touches its lower edge, and both boxes touch the right canvas edge. No external inset or gap around these joins. Keep modest padding inside each box so the white lettering remains legible.


Current approved documentary style has NO photo labels: omit BEFORE, AFTER, RESTORED, INSTALLED and their individual backing rectangles. Keep the fixed opaque black horizontal separator only. The hero title remains unchanged. Group and order photographs by their actual relationship in the internal ledger; do not put those reviewer descriptions onto exports. render-photo-slide ignores labels by default; showLabels: true is reserved for a new explicit request to restore photo labels.


## Still-photo Reel renderer

Advertising mode uses `scripts/review-advertising-plan.mjs plan.json [history.json]` from the installed skill, with the schema in `advertising-reels.md`. It rejects incomplete plans and a missing requested wide interior, and warns when role order matches a recent reviewed export. It never generates media or automatically rejects an editorially justified repeat. Do not pass an advertising montage through the documentary stage sorter merely to satisfy a default.

Before any generative call, use installed `scripts/generation-spend-ledger.mjs reserve ledger.json intent.json`, then `reconcile ledger.json result.json` against the actual provider task/history. Use `scripts/validate-video-inputs.mjs review.json` for hash-bound still QA. Both are record/integrity guards; neither can inspect visual truth or manufacture approval. See `vehicle-identity-qa.md` for the complete contract.

For restoration production, set `narrative: "restoration-area-sequence"`, label each shot with its `storyStage`, and run `node scripts/instagram/restoration-sequence.mjs input.json ordered.json` before rendering. See reels.md for the ordered stages, separate thumbnail delivery and evidence-backed missingStages. Keep restoration-sequence.mjs, subpixel-pan.mjs, render-comparison.mjs and wide-frame.mjs beside render-reel.mjs in installed copies.

Use `node scripts/instagram/render-reel.mjs reel.json`; see reels.md for the motion, text, encoding and review contract. It writes a silent H.264 MP4, poster, storyboard and source receipt. Verify with `node --test scripts/instagram/reel.test.mjs` and decode the actual output before delivery. The helper never publishes.


## Separate video thumbnail

Use the existing `render-cover.mjs` for a standalone designed JPG and transparent typography overlay. Supply an explicit portrait `width`/`height` (normally 1080 × 1920 for a Reel/Short cover), reviewed source crop, title and approved font; inspect the central profile crop and complete vehicle framing. A source-backed before/after composition may be prepared as a separate input layout. Keep its source and plate ledger. Deliver this JPG alongside the MP4; do not insert it into `shots`. The Reel/sequence tools reject `thumbnail` and `thumbnailOnly` timeline entries. The renderer's automatic `poster.jpg` is a frame preview, distinct from this designed cover.
