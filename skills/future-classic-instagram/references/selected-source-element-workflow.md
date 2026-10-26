# Owner-selected six-image source workflow (2026-10-23)

HISTORICAL SNAPSHOT: superseded by [kling-reel-workflow.md](kling-reel-workflow.md). The owner discarded the kidney-grille video; latest six-source recipe replaces it with a side-dominant closing. Current model is Kling3.0, four exterior Element inputs, color/lamps-off sources, original-speed assembly and final fade only. Do not enforce this document's obsolete grille-role gate.

Use this workflow for Future Classic finished-car beauty films. The owner selected the recent E30 six-image set as the reusable source-language baseline, not rejected early experiments. Six sources are front-half, low front three-quarter, rear three-quarter, whole-car front three-quarter, hood-emblem macro, and hood-emblem with grille. Their order in the edit is deliberate, not the order of filenames. This is a starting vocabulary for future vehicles, not a requirement to invent matching parts or repeat every film.

The optional closing dolly-out can reuse the whole-car source; six source images do not automatically mean six clips plus a seventh NEW image. Track source count and clip count separately. The new mirrored-composition lights-on whole-car image remains a candidate until reviewed; it does not silently replace an accepted source.

## Required flow
1. Original-car evidence and mark crops → owner-selected portrait composition → inspect generated stills for source-specific geometry and marks.
2. Assemble the selected six-source manifest with actual paths and SHA-256 hashes, composition role, owner selection evidence, and independent identity review. Selection is not a pass. Old chrome grille, misplaced roundel, duplicate marker and incorrect exhaust sources remain rejected/held.
3. Create a Kling vehicle Element from reviewed images of THIS vehicle: a clear whole-car three-quarter primary image and complementary reviewed angles/details as the current UI permits. Never put the M3 composition screenshot in the Element. Record actual Element name, UI tag, images/hashes and registration evidence. Existing owner-created Elements are reused; do not recreate or assert their inputs were reviewed without evidence.
4. Per clip: select the reviewed image as Start Frame AND select/mention the actual Element via @ picker. A typed literal @name is not proof of a binding. Record observed binding evidence. Element supplies identity; Start Frame supplies composition and visible geometry. Do not force out-of-frame emblems, plate text or decals into view.
5. Short ENGLISH motion prompt: camera movement first, one small physical move, parked car, essential identity constraints. No contradictory fixed-camera/constant-distance instructions when requesting an arc/dolly. No duplicated decorative symbols. Avoid lists of every tiny part overwhelming the motion.
6. Inspect actual moving frames and playback for stationary car/wheels, actual viewpoint change, attached markings, original black grille and lamp arrangement. Reject duplication, melting lettering, drift or wrong mounting. Element improves observed results but is not a guarantee.
7. Edit selected passing clips locally; retain native originals, credits ledger and private Drive review. No automatic social publication.

## Current generation preference supersedes historical low-resolution defaults
Always 1080p, 9:16, one output. Kling 3.0/4.0 tests use 3 seconds when supported and observed. Multi-Shot OFF, native audio OFF for these single-camera cuts. Older models may retain native 5-second output for later trimming. The ledger can record an explicit owner-quality override with provenance, never fabricate lowest-available evidence. Read live credit quote and before/after balances; reconcile ambiguous tasks before retrying. Null token usage is unavailable, not zero.

## Lighting and spatial identity
Lights off is an earlier E30 treatment, not a permanent ban. The owner now requested an additional whole-car source with only the two OUTERMOST factory headlights lit. Keep inner headlights, separate auxiliary lamps, fog lamps and markers off for that shot. Light state is recorded per source. Avoid artificial pools or displaced reflections. A mirrored camera composition changes viewing side; do not mirror lettering, exhaust or vehicle hardware.
The single hood badge aligns with the actual centerline between the paired kidneys near the hood front edge, not screen center or an arbitrary hood crease. If outside crop, leave outside. Match actual black grille dimensions as well as color.

## Tool
Run scripts/review-element-workflow.mjs manifest.json before a new video submission. It verifies local file hashes, six required roles for this profile, independent source pass records, Element source membership and recorded real binding. It cannot inspect pixels or confirm a remote UI; truthful human/agent visual evidence is required. Existing review-advertising-plan and generation-spend-ledger remain in use.
