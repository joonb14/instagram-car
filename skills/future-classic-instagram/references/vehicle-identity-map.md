# Source-backed vehicle identity map

Use before generating or repairing a car still, choosing Element references, or writing a new camera prompt. Inspect the supplied ORIGINAL vehicle photographs first. Do not infer the real mounting position from an earlier generated image. The map is a reference specification, not a claim that generated images already pass.

## Deliverable before generation

Keep one `vehicle-identity-map.json` per real vehicle/restoration state, alongside an annotated review, original-pixel detail crops and an image-generation reference brief. Include:

- Original photo ID, file, SHA-256, EXIF-normalized dimensions, view, inspected detail notes and relevant configuration differences. A roof-off original can establish rear hardware but does not establish the desired roof-up silhouette.
- Each visible feature's presence, count/scope, surface, readable wording/case or unresolved lettering, material, placement and original-photo observations. Include lamps/markers, grille openings, emblems, decals, wheel centers AND spoke marks, wiper pivots/rest state, hinges, bumper caps and gaps. Inventory coverage follows the actual photos, not a universal car checklist.
- Numeric source-pixel polygons and annotation uncertainty. Derive normalized image x/y 0–1000 and an N-part grid, normally N=20. Optionally bound the visible front in that source as a separate `projected-image-region` and give its own N-part ranges. Identify the frame for EVERY number.
- Physical relationships: which surface the feature is attached to, paired part/centerline relationship, original bracket and scale, near/far side and actual occlusion. Record vehicle-left separately from image-left. A single projected x-offset does not establish a physical left/right mounting side.
- Explicit source-backed asymmetry exceptions: offset plates, unilateral badges/antennae, tailgate hinges/handle, single marked wheel spoke, one-sided exhaust, missing emblems. No blanket instruction that every mark/plate is centered.
- Owner-requested changes separately from source facts. Examples: promotional plate artwork replaces print while retaining the actual mount. The Jeep low-horizontal wiper edit was revoked on2026-10-25; preserve the source-documented resting angles and pivots. Never rewrite the source observation to match the requested result.

Current generated-video default is plate-free by explicit owner choice: retain original front/rear mount observations as source facts, record removal of plates/removable brackets as a separate ownerEditOverrides entry, and exclude removed plate print from expected generated visibleMarks. Original body/badge/bumper geometry still needs review. Start Frames and all Element references must agree on this policy.

No invented decimal precision or real-world dimensions. Pixel ranges are approximate annotated evidence with uncertainty, not millimeter measurements. A true front-on or calibrated same-plane view can support numerical physical symmetry; an oblique photo alone cannot justify guessed physical percentages. Record that gap and use reliable source relationships instead of manufacturing a precise frontal template.

## Coordinate frames and symmetry

Keep three distinct frames: (1) original image pixels/0–1000 grid, (2) a bounded source-image front region, (3) a verified rectified physical surface. Only the third supports comparing paired landmarks about a physical axis. Whole-image/source-region grids are NOT physical car coordinates and never transfer unchanged to another view or crop.

For numerical symmetry declare the particular plane, four corners in consistent perimeter order, source ID, documented physical symmetry axis, paired part IDs, manually observed landmark centers and a justified annotation tolerance. The tool maps that quadrilateral to 0–1000 and compares paired landmark distances/heights about u=500. The selected plane bounds must actually be symmetric about that axis; an arbitrary visible crop is not sufficient. A numeric result applies only to those points on that surface and cannot certify body curvature, text shape or complete vehicle geometry.

Grille face, hood, bumper top and plate face are different surfaces/depths. A homography for one must not be used for the others. Curved body panels and 3D components need source-view/manual or an explicit calibrated 3D review. Near/far lamps, wheels and fenders will have different pixel sizes in oblique views; do not equalize them. Exclude documented asymmetric parts from mirror tests; check their correct side/count/relationship instead. Never mirror readable lettering to create the other side.

## Main-agent analysis to image generation

Owner-selected workflow: the main agent inspects the originals and native crops, forms the identity map in its current task context, then continues directly into shot-specific prompt writing, image generation and output review when image production is already requested and its applicable background/usage scope is authorized. Do not stop after exporting an analysis brief and treat that export as a completed image request. An analysis-only question still calls for analysis, not an unsolicited generation.

Keep this loop in the same main-agent conversation by default; ordinary image generation is a tool call made by that agent. Do not create a separate agent, agent prompt file or new AGENTS.md merely to carry the analysis into generation. Keep the reusable procedure in this skill, vehicle facts in the map and source files, and the exact per-shot generation request in the attempt record. Context continuity is a working preference, not proof of better rendered fidelity.

For each authorized image:

1. From the freshly inspected evidence select the intended angle, approved scene, actual vehicle/state and the original photos/crops relevant to that view. Use originals as identity authority; an existing generated scene can establish the chosen background/composition but cannot overrule the original hardware. Configuration differences such as roof-off sources stay limited to their documented role.
2. Write one concrete generation prompt: intended output/composition, explicitly numbered input-image roles, the view's important geometry/counts, mounting surfaces/asymmetry, source-readable marks or approved artwork, crop/occlusion and requested edits. The full analysis map is the agent's evidence; it is not automatically the final prompt. Transfer relevant findings into the actual tool prompt rather than relying on the model remembering a JSON file or the agent's unspoken reasoning. Use source-coordinate numbers only with their named view/frame; new viewpoints need physical placement relationships.
3. Bind the actual reference image files to that request. Check the identity-map/reference manifest and the observed tool input limit. A prose filename or a saved brief is not an attached reference. If relevant evidence exceeds the input limit, use clearly documented original-pixel reference panels or deliberate regional passes; inspect them and keep a tile/source receipt. Grid overlays and annotations are QA aids, not appearance references to be copied into the result.
4. Record the exact prompt, input roles/hashes and intended attempt before the built-in image-generation call, following the existing usage ledger. Preserve the output and inspect it against the SAME originals and critical crops while their physical relationships remain in context. A failed detail remains held; follow the existing targeted-repair stopping rule.
5. Carry the verified facts forward to the next angle, while deriving that angle's expected visibility and perspective afresh. Never replace original evidence with an unreviewed generated master. Only individually passing stills may enter the four-reference Element and motion workflow. The owner's manual Kling-submission boundary remains unchanged.

If the task resumes after a context reset or handoff, reload the map, approved scene, latest failed/passing observations and relevant ORIGINAL image pixels before preparing the next generation. Reopening those saved materials restores the usable evidence; a text summary alone cannot settle small lettering or a disputed mount. Do not require a new user approval merely because context was refreshed.

## Actual generation inputs and prompt shape

Inspect whole originals, then native detail crops; a contact sheet alone cannot settle tiny lettering. Use the real vehicle photos AND original-pixel crops as actual generation inputs. Additional artwork is a lettering reference, not proof of mounting location. If an input limit prevents including needed evidence, prepare deliberate regional passes or report the limit; do not silently discard critical references or add all of them only in prose.

Build the STILL-generation prompt from: scene/composition → same real vehicle/state → source-backed geometry/counts → correct surface/mount/scale and asymmetry → exact source-readable lettering/artwork → expected cropping/occlusion → approved edits. Numeric ranges must identify the source/view/frame and uncertainty. For a new camera angle, specify physical relationships and reference crops; don't tell the model to keep old screen coordinates. Models may ignore numerical instructions; the output comparison remains mandatory.

Keep the full map out of the motion prompt and short Element description. Use only one or two relevant detail clauses there; the Start Frame/Element pixels carry identity. A failed image is repaired before it becomes an Element/video input. For every new angle, derive a shot-specific crop/visibility map and compare actual saved output plus original details. Source analysis, generated-image review, Element review and video review remain separate. A schema/hash success never promotes a held asset.

## Tools and schema

Canonical utility: `scripts/instagram/vehicle-identity-map.mjs`; self-contained copy in this skill's `scripts/`.

```
node scripts/vehicle-identity-map.mjs check vehicle-identity-map.json
node scripts/vehicle-identity-map.mjs brief vehicle-identity-map.json IMAGE_GENERATION_REFERENCE_BRIEF.txt
node scripts/vehicle-identity-map.mjs render vehicle-identity-map.json identity-review.html
```

Sources use EXIF-normalized PNG files so hash and dimensions describe the exact inspected orientation. The renderer can use a `previewFile` resized from that source for display; evidence/coordinates/hashes remain tied to the native original. Annotated images and grids are QA aids, not video inputs.

Minimal record structure (fill with actual evidence, not these illustrative values):

```json
{
  "schemaVersion": 1,
  "vehicle": "actual identified vehicle",
  "stage": "finished",
  "reviewedAt": "actual review timestamp",
  "gridDivisions": 20,
  "coordinateConvention": "image x increases right, y down; vehicle sides separately named",
  "inventoryNotes": "what originals/details were inspected and what remains unresolved",
  "sources": [{"id":"raw-front","file":"original.png","sha256":"actual SHA-256","width":2000,"height":1000,"view":"oblique-front","notes":"actual observations"}],
  "parts": [{"id":"front-plate","surface":"front-bumper-face","presence":"present","count":1,"placement":"original offset bracket","observations":[{"sourceId":"raw-front","polygon":[[200,600],[600,600],[600,800],[200,800]],"uncertaintyPx":10,"notes":"manual original-photo boundary"}]}],
  "planes": [],
  "symmetry": {"pairs":[],"exceptions":[{"partId":"front-plate","reason":"original offset mount","evidenceSourceIds":["raw-front"]}]}
}
```

Optional `sourceRegions`: `{id,sourceId,rect:[x,y,width,height],basis:"projected-image-region",notes}`; observation `regionId` adds that region's grid ranges. Never label this as calibrated front width.

Absent/unknown parts use `presence: absent-in-original|unresolved`, `placement`, `surface` and `evidenceSourceIds`; do not invent coordinates for an invisible badge. Readable `text` uses `{legibility:"readable",value,notes}`; unresolved text has no guessed value. `text.usage:"source-only"` prevents copying an original registration into the generation brief. Keep approved changes in `ownerEditOverrides: [{detail,sourceObservation,requestedEdit}]`.

The reference validator requires a map by default. For new still submissions, record `identityMapRequired:true`, `identityMapFile` and current `identityMapHash` in the existing validate-image-references record. Each `visibleMarks[]` gets `identityPartId` matching a present part observed on that actual source. This new record slot prevents the prose reminder being skipped. The validator checks source/map/crop hashes and source association; it cannot detect an omitted mark or visually read the crop. Retain the existing original-crop membership and actual submission audit fields. Legacy records stay historical and do not retroactively become compliant.

## Jeep application, not universal hardware defaults

The inspected restored YJ has a chrome seven-slot front fascia, two square headlamps, two lower front amber lamps, a separate amber marker on each evidenced fender, dark embossed Jeep lettering on the BLACK BUMPER TOP, side Jeep/LAREDO, rear-quarter WRANGLER and Jeep on one wheel spoke. No hood crest. The owner's front offset plate instruction does not transfer to the rear plate. These details apply only to the documented Jeep; another vehicle starts from its own originals.

Explicit `identityMapRequired:false` exists only to inspect historical reference/crop integrity; its report is marked `legacyIntegrityOnly` and does not authorize a new generation. Missing flags cannot bypass the default map gate. A failed recorded numeric symmetry pair holds the specification rather than returning a merely advisory warning.
