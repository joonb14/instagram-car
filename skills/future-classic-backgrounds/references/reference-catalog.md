# Background reference catalog

Create or extend a catalog only when reference collection is requested. Reuse an existing project collection if present; otherwise use `artifacts/background-references/catalog.json` relative to the project root. Outside a project use available persistent file storage. Keep large originals outside the skill package, and preserve their actual storage IDs or paths.

Inspect each original before accepting it. Favor readable ground depth, realistic light and text-free scenery; a vehicle in the reference itself is acceptable. Record any visible signs or text as unsuitable regions, not as a clean background. Deduplicate by source image identity rather than exported filename.

Use a JSON array with one entry per inspected image and these fields:

| Field | Meaning |
| --- | --- |
| id | Stable local reference identifier |
| source | Actual source photo identity, article URL or persistent file ID |
| original | Available original image path or file ID; null if unavailable |
| preview | Available preview path or file ID; null if unavailable |
| kind | original-photo, generated-background, or edited-background |
| provenance | camera-photo, generated, or unverified; do not infer from appearance alone |
| scene | Short observed location description; do not invent a real place name |
| ground | Surface, slope and usable parking area |
| camera | Observed view, horizon and approximate height; mark estimates |
| light | Direction, softness and time/weather cues; mark estimates |
| textReview | Object with status (clear, has-text, or unverified) and notes (regions to avoid) |
| portraitFit | Object with status (reviewed-fit, recompose, or unverified) and notes (crop/placement assessment) |
| reuseStatus | Known permission/source conditions, or unknown |
| notes | Why it is useful and any limitations |

Store an original photograph with its car intact. An edited vehicle-free plate is a separate entry linked to the original in notes; disclose synthesis of hidden ground and scenery. Generated outputs also remain separate from photographic references.

Add an entry only after inspecting available original or preview pixels; identify which was inspected in notes. If neither is accessible, keep the known source and access limitation in a separate pending-sources record rather than the inspected catalog. Do not fill the catalog with invented examples or count pending sources as collected images. Report missing material without claiming inspection succeeded. Reference-only access is not permission to redistribute the original as a downloadable background.
