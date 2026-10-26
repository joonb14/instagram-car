# Workflow and review package

## Website amendments and release

Website photo/text/featured amendments reuse the existing article and the shared [static publication procedure](../../garage-forum-editorial/references/static-publication.md). Follow it for release isolation, regenerated indexes/offline EN/KO HTML, preserved client assets, current-publication membership, approval renewal and actual live checks. Do not create a second article or reset its publication time. A social package alone neither changes the website nor resumes scheduled collection.

## Integration points

Read current files rather than relying on prior chat summaries:
- `docs/README.md` and `docs/backend/forum-editorial.md`: implemented site behavior.
- `scripts/forum-editorial/publication.json`: article inputs, stable slugs and publication status.
- `apps/web/app/content/editorial-catalog.ts`: existing article evidence, English text, authors and selected figures. This is generated; do not edit directly.
- `scripts/forum-editorial/crawl-config.json`, `crawl-run.mjs`, `sources.mjs`: current collector policy, ownership and normalized identity.
- Current shared state is normally `artifacts/forum-recurring`; confirm from current configuration before using it. Consult the collector skill's recurring and parallel references for actual commands and run tokens.

Read published and prepared records plus active reservations. Resolve aliases using the existing identity function rather than implementing a competing normalizer. Existing source with adequate evidence: reuse. Existing partial source: request/reserve only missing pages or media through the owned collector. Currently owned source: defer, no parallel duplicate capture. New source: enter existing guarded collector. A cross-post under another thread ID needs manual comparison of author, vehicle and photos; link related records and avoid a duplicate story without merging unrelated identities.

Restoration tags do not force another article. One source may already support multiple deliberately scoped articles; select the relevant existing article and keep its mapping, rather than collapsing all historical splits or creating a new split by default. Instagram revisions use the same post key with a new version. A new campaign from a previously used source should be explicitly intentional.

### Build-blog identity and owned imports

My Build Garage sources use the existing `sources.mjs` implementation: only observed `mybuildgarage.com/YYYY/MM/slug/` article paths qualify, with community `mybuildgarage`, thread ID `YYYY/MM/slug` and key `mybuildgarage.com:YYYY/MM/slug`. Query strings and fragments do not create another source. Author/archive/list pages are not articles. Pass the real dated identity to `buildBundle`; do not assign a numeric forum thread ID.

The scheduled three-forum discovery policy remains unchanged. A manually captured blog article can be prepared with the existing bilingual builder and media/tag/emphasis/translation pipeline. Before importing its reviewed record or publishing, own the existing shared run, acquire its operation lock, recheck owner and duplicate source/slug, preserve the prior state, record the manual-import audit, then release the operation lock. Keep unreviewed media as remaining evidence. Use the existing version-bound agent approval, publication eligibility, catalog and live verification tools. Do not bypass an active owner or mark a partial source fully collected. The completed A delivery is an auditable example in `artifacts/restoration-editorial-2026-10-20/release-work/`.

## Versioned output

### Candidate review, before selection

Prepare a small shortlist, normally three to five when enough strong cases exist, without lowering the full-restoration threshold to reach a number. Assign stable candidate IDs. Each candidate includes model, observed author/community, original links, actual original finished-car and body/paint/cabin before/after thumbnails, verified work scope, completion evidence, photo quality and material limitations. Keep source identities and cross-post aliases for deduplication. Acknowledge unavailable evidence rather than replacing it with generated images. A mobile-friendly private review Page is preferred; no final caption, AI hero or upload package at this stage.

The owner wants rich documentary sequences, not a hero followed by a few beauty shots. Aim for roughly 12–16 distinct usable evidence photos excluding the cover, with several genuine before and several after views, plus informative work stages. Report before/work/after counts separately and show the actual photographs; process pictures do not become untouched before pictures, and repeated exterior angles do not compensate for missing cabin evidence. These are editorial targets, not permission to pad a weak case or exceed platform limits. Flag stripped-cabin-only before coverage and standalone reupholstered-seat-only after coverage explicitly so the owner can judge them. Reserve cases with material gaps separately from recommended candidates.

Record the owner's actual selection in `selection`: `status: selected`, `candidateId`, `userMessage` (the real selection wording) and `selectedAt`. Candidate IDs must refer to the reviewed shortlist. Do not infer selection from praise, a request to collect candidates, prior cover experiments or tool success. Hold production until the choice arrives. Record rejected/deferred cases without importing them a second time. Read `tools.md` only when production is unlocked.

### Site articles for reviewed restoration cases

Use garage-forum-editorial's contract, workflow and publication references to create/reuse English/Korean site articles for all editorially eligible collected restoration cases, not only Instagram selections. Keep normal source deduplication, source and translation reviews, media evidence and serialized publication. Do not duplicate their implementation in this skill. Verify live details, original attribution, actual photo loading, Gallery listings and model/restoration search. Save each actual article slug, stable source key, English/Korean URLs, verification timestamp and content version/hash as `siteArticle`. Preserve photo gaps in site review and keep Instagram-ineligible cases out of that shortlist. If the owner selects a case early, finish and verify its site article before producing its Instagram derivative.

### Instagram derivative after verified site publication

Prepare captions, edited hero and downloadable slides from the verified site article and its existing source/media ledger. Reuse facts instead of independently rewriting from a different source snapshot. Keep source image context and outstanding limitations aligned. Changes to the site article that affect facts or selected media require rechecking the derivative. Store `siteArticle` in post.json and review materials; no caption URL unless the owner changes that preference.

Record a full-restoration assessment before carousel production: original purpose, deteriorated starting condition, completed body/exterior and cabin restoration, relevant chassis/mechanical work, finished-car evidence, remaining work and verdict. Include a per-area before/after photo map with actual source-post references. Exclude cases lacking visible exterior or cabin transformation; a long repair list and attractive final exterior do not compensate. The rejected SL600 revival is not a fallback candidate. Do not let an existing DIY/restoration tag replace this assessment.

Use `artifacts/instagram/<post-key>/vNN/` without overwriting reviewed versions:
- `post.json`: postKey, version, status, sourceKeys, articleSlug, articleUrl, caption, slides, sourceReuseStatus, reviewStatus, blockers, remoteReviewUrl.
- `slides/01.jpg` onward: final ordered upload-ready JPGs, default 1080 × 1080 (1:1), all readable plates masked. Choose the cover layout from actual framing: full vehicle with a dark top header and no bottom matte if room is needed, otherwise full-bleed square with a translucent black upper text panel only. Preserve documentary evidence with neutral padding when necessary. Photograph/work dominates; reviewer labels stay outside exports. Use sufficient-resolution source assets and inspect every export. Do not silently enlarge tiny site thumbnails into detailed photographs.
- `photos.zip`: numbered final JPGs only, directly uploadable after extraction; private originals are excluded.
- `caption.txt`: one exact copyable English caption including body, relevant hashtags, and mandatory final attribution line. No manual assembly needed.
- `sources.json`: per-image original URL, source post URL, community, observed author/profile, source position/order, local original, dimensions, stage evidence, edits and reuse status. Keep source author and photo credit distinct when the source distinguishes them.
- `review.html`: portable mobile-friendly preview with ordered slides, caption, original links and Korean reviewer notes. A self-contained review PDF is a useful fallback when requested.

Statuses should describe reality: candidate, draft, changes-requested, approved, published. Do not set approved from tool success or source article approval. Approval binds to the exact package version; changes require a new review unless the user's publication request explicitly includes those edits. Publishing is outside the default scope and needs explicit authorization. After an authorized publication, retain the account, post URL, publication time, package/caption hashes, screenshot and actual carousel/caption verification. An ambiguous submit result requires checking the existing profile before retrying to avoid duplicate posts. Never represent credit as proof of reuse permission.

## Remote review

Preferred, when available and authorized: a private ChatGPT Page containing uploaded final slide images, direct download links for each final JPG plus photos.zip and caption.txt, the exact caption in a single copy-friendly block, original source links, version and concise review notes. Use pages:write-page and real returned file references; do not invent cloud URLs. Verify a download works before claiming mobile delivery is complete. A local archive alone is not remotely downloadable. Read back saved content and verify sharing before calling it private. Do not enable public sharing, deploy a review site or create paid hosting to solve delivery. Return the actual Page URL and local exports. If the connector cannot host the downloads, explain that delivery gap instead of describing a preview-only Page as upload-ready.

Collect feedback by slide number and caption section in the Page or this chat. Review notes are feedback, not permission to post. Preserve image order and version in any revised package. A Page containing only text or placeholders is not a completed image review.

## Quality check

Check every rendered slide at phone scale and full size; verify subjects, crop, resolution and unreadable plates, including reflections/background cars. Compare the exterior and cabin before/after map with source context. Every factual caption clause must have evidence. Planned work stays planned. Cover beauty is not proof of restoration. Check the caption is one paste including hashtags, the emoji attribution is the last nonempty line and caption URLs are omitted, and source credits remain intact. Check the photos-only ZIP extracts to correctly numbered JPGs and remote downloads resolve to the final masked exports. Verify publication status matches authorization: unpublished for review-only work; a real post URL, saved caption and carousel verification for an explicitly authorized publication.

If no eligible case exists, retain the rejection reasons and missing evidence in a candidate report; continue discovery only within the authorized collector workflow. Never manufacture an after image to satisfy the sequence.


Do not reuse the hero source photograph later in the carousel, even with different crops, zoom, color grading or typography. Deduplicate all slides by original photo identity, not output filename. Record sourceAssetId, sourceImageUrl or sourcePhoto with its publisher URL for each slide, including the hero. Mark whole-vehicle slides with framing: "whole-vehicle" and vehicleComplete: true only after visual review. Keep plate masking in internal review records; do not include operational notices such as "Original build photographs" or "visible plates concealed" in the public caption.


Current approved export: 1080 × 1440 (3:4). Landscape photos are paired vertically based on their restoration story; portrait photos stand alone. The owner authorizes the agent to choose groups, including component/installed-result pairs, with source-backed stages and no repeated photographs. Retain the source ledger per constituent and verify the portrait profile preview. Historical square recipes are not the current default.

Optional legacy label treatment, only when the owner explicitly requests labels again:
For paired comparisons, use a black horizontal divider (24px at 1080 width) and small white English labels right-aligned immediately above/below it. Use BEFORE / AFTER only for verified condition changes; use relationship-specific labels such as SEATS / INSTALLED for component/result pairs. If no meaningful landscape partner remains, omit genuinely redundant evidence or preserve the unpaired photo alone with neutral padding; never pair unrelated photos solely to fill a slide. render-photo-slide accepts labels: [top, bottom] and allowSingleLandscape: true for this reviewed exception. Record the reason.


Documentary comparison/pair slides use an opaque pure-black (#000000) gutter and label backings with small white type. No translucent black wash or gray matte on these slides. Preserve the source photograph itself. This does not change the separate approved hero typography treatments.


Latest paired-panel layout: fill the full width and height of both photo panels, flush with the black separator and outer canvas edges. Do not leave variable side/top/bottom padding inside paired slides. render-photo-slide defaults paired images to fit cover; each image may set position (for example north for seat headrests). Inspect every crop: preserve complete vehicles when shown as whole-vehicle views, and keep documented work recognizable. If both no-padding and full-vehicle requirements cannot be met, regroup/select a more suitable source rather than silently claiming an intact vehicle. This supersedes earlier contain-fit defaults for paired slides.


Portrait source photos also fill their 3:4 slide edge-to-edge with reviewed cover-fit, rather than side padding. Do not leave the last landscape photograph alone: collect an additional distinct, source-backed finished photo to pair it with. Use an already captured photo when available, excluding the hero and all prior constituent photos, and review its plate mask and crop.

Optional legacy label treatment, only when the owner explicitly requests labels again:
Paired-slide labels are flush: the upper opaque black label box touches the upper edge of the separator, the lower box touches its lower edge, and both boxes touch the right canvas edge. No external inset or gap around these joins. Keep modest padding inside each box so the white lettering remains legible.


Current approved documentary style has NO photo labels: omit BEFORE, AFTER, RESTORED, INSTALLED and their individual backing rectangles. Keep the fixed opaque black horizontal separator only. The hero title remains unchanged. Group and order photographs by their actual relationship in the internal ledger; do not put those reviewer descriptions onto exports. render-photo-slide ignores labels by default; showLabels: true is reserved for a new explicit request to restore photo labels.
