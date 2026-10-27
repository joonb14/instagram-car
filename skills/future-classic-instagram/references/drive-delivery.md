# Google Drive delivery

## Kling preparation downloads — owner standard 2026-10-23

Deliver a private Review package with individual downloads. Create a ZIP only on an explicit request; preserve existing archives. Use `01_VIDEO_INPUTS` for all 1080x1920 PNGs, `02_KLING_ELEMENT` for exactly four complementary exterior images plus `00_ELEMENT_SETUP.txt` and copyable `01_DESCRIPTION_ONLY.txt`, and `03_VIDEO_PROMPTS` for one English TXT per image. Match PNG/TXT numeric prefixes and source IDs. Include requested additional detail shots, a numbered contact sheet and Korean `00_START_HERE.txt`. Give the actual Element name and description in the chat handoff. Select the real @Element with Kling's picker; typed text is not proof of binding.

Use `prepare-download-pack.mjs manifest.json new-output-directory` before delivery. Preserve custom wording in `source.videoPrompt`. Check source hashes and preserve review states; packaging does not certify visual QA. Default: Kling3.0, 3 seconds, 1080p, 9:16, one output, Multi-Shot off, audio off, lamps off. The owner submits generation manually. Preserve Drive IDs for moves/renames; put superseded ZIPs in `99_PREVIOUS_VERSIONS`. Verify remote names/counts/sizes and save the receipt. Packaging uses no Kling credits.

Use the owner's Google Drive as the recurring phone-download destination for reviewed social packages. Read this when delivering final carousel/Reel/Short files. A local path, cloud-looking local directory, ZIP or review Page is not proof that the owner can download on a phone.

## Folder and file layout

Use one owner-private root `Future Classic`, with `01 Ready to Upload`, `02 Review` and `03 Published`. Discover and record their real Drive folder IDs and account on first use; reuse IDs thereafter. Do not create duplicate roots from name alone. Preserve existing unrelated Drive content and sharing. Do not enable public link access by default.

For this workspace, the established root/folder/file IDs are recorded in `artifacts/social/005-e30-325ix/drive-delivery-v01/drive-receipt.json`. Read and verify that receipt before creating another root. Use `Google Drive` connector create_folder/upload_file/list_folder/get_file_metadata actions when available; raw video uploads use upload_file rather than document import. Account identity may be redacted by the connector; do not fill it from an unrelated browser login.

Use an immutable package key and version, for example `2026-10-21_005_BMW-E30-325iX_v01`. Use the preparation date in Asia/Seoul, the existing editorial/package ID and a short vehicle name; dates are not scheduled publication promises. Put reviewed final packages in Ready; unapproved variants belong in Review. A ready video may still await platform-native music; say so explicitly. A new visual/copy revision increments the version and supersedes the previous ready version, which moves to Review rather than remaining a competing latest copy.

Each phone-ready package exposes the MP4/JPGs individually, not only in a ZIP:

- `01_VIDEO_005_E30-325iX_v01_SILENT.mp4` — one clean master shared across Reels/Shorts
- `02_INSTAGRAM_CAPTION.txt`
- `03_YOUTUBE_TITLE.txt`
- `04_YOUTUBE_DESCRIPTION.txt`
- `00_READ_FIRST.txt` — short Korean handoff: vehicle/version, silent/music status, final media file, target accounts and next action

For a newly completed film intended for Reels and Shorts, the final handoff includes the master AND all three upload-copy files plus the three copyable chat blocks. Preparing that draft copy is part of finishing the requested video package; do not leave it until the owner asks again. Record copy readiness independently from media readiness and publication. A later move-only request retains existing copy, as described below.

For a carousel add `CAROUSEL` with zero-padded image order `01_COVER.jpg`, `02.jpg`, etc. The Reel/Short master and captions stay separate; no duplicate video for each platform. Keep optional ZIPs and technical provenance in local artifacts/review records so phone-ready folders stay uncluttered. Original source URLs remain in the internal ledger; public captions follow their own source-credit contract.

## Final-package promotion and findability

Treat the final edit and generation sources as separate packages. Review holds input images, Element references, prompts, raw paid clips, QA evidence, unsuccessful variants and technical records. Ready exposes the current reviewed upload master and its short handoff/copy files directly inside one vehicle/version folder. Music pending or manual uploading still to do does not put that final master back in Review. A technically unverified or unselected alternate remains in Review.

Before a final handoff, perform this recipe through the Google Drive connector skill:

1. Ground the root, Ready, source package and final media from the existing receipt and current metadata/listings. Compare actual IDs and parents. A folder named `FINAL` deep inside an Element or test folder is still a Review deliverable until promoted.
2. If an existing final-only folder contains the master and handoff files, move that folder directly under Ready. If final media are mixed with raw tests, move only the master and matching handoff files into a dedicated Ready package. Use `update_file` with verified `addParents` and `removeParents`; keep the same file IDs, unrelated parents and sharing. Reuse matching remote bytes/metadata instead of uploading a second copy. A same-name file with different content is a distinct version, not an overwrite target.
3. Use a date-first, vehicle-specific display name, such as `2026-10-26_006_Dodge-Charger_15s_v01`; keep the immutable package key in the receipt even if the display name changes. Leave one current version in Ready. Move superseded unpublished versions to Review and record which version replaced them; preserve Published history.
4. Read back the moved folder's parent and the final file's name, MIME type, byte count and parent. List Ready to confirm the vehicle folder is a direct child. Preserve permission state. Verify that a local media hash is unchanged after cleanup; report remote hashes only when actually returned. Do not describe an unobserved phone download or playback as verified.
5. Update the existing local delivery receipt, collection/review index and `00_READ_FIRST.txt` with the current destination. Add the final-folder/file links to the source package's existing `00_START_HERE.txt` so an old source link still leads to the final master. Remove obsolete statements that generation or editing has not happened. If a receipt stores an original upload response, retain that history and add the current location explicitly.
6. Give the exact final-file and Ready vehicle-folder links in chat. Sorting is secondary: the owner should not need to search raw tests or change a sort setting to find the master. A suggestion to sort by name is not a substitute for moving the file to the right stage. Do not claim to have changed the Drive UI sort without observing that action.

The required current-location record contains `packageKey`, `version`, `stage`, `folderId`, `folderName`, `parentFolderId`, `folderUrl`, `finalFileId`, `finalFileUrl`, `previousParentId` when moved, `verifiedAt`, local `sha256`/`bytes`, and separate Instagram/YouTube publication and music states. `stage: ready` describes delivery readiness, not artistic approval or publication. Carry existing owner selection and observed limitations truthfully. Unknown account identity, remote checksum or publication status stays unknown. Reuse the existing receipt's equivalent field names rather than creating a parallel release ledger.

For a delivery-only or move-only request, retain existing caption files; do not invent new copy or require missing copy before delivering the requested master. The three copy blocks below apply when the owner requests upload copy as part of the handoff.

In the same chat handoff, deliver the actual final copy in three separately copyable writing blocks: Instagram caption (including hashtags and final credit), YouTube title, and YouTube description. Use the current exact uploaded text, without reviewer notes or file labels inside the copy blocks. Drive text files are backups, not a replacement for in-chat copy. Put the video/folder links outside those blocks. On a requested copy correction, show the corrected affected block and keep delivered files consistent.

## Sorting, retry and platform status

Tell the owner to sort Ready by folder name descending to see newest preparation dates first; prefix numbered files to retain a clear reading order inside each package. Offer the exact Drive folder link and exact video-file link in the handoff once actually observed. Do not invent IDs or URLs, and do not claim cloud sync from a local OneDrive path.

Record Drive account, package key/version, parent/folder/file IDs, media hash and byte count, copy versions, upload/verification timestamps and sharing status in the existing release receipt. Before a retry, inspect the recorded IDs and current contents. Reuse matching files; do not upload another same-name copy blindly. If upload outcome is ambiguous, inspect contents before retrying. Record and clearly mark older releases as superseded without silently replacing the package someone may already have downloaded.

Track Instagram and YouTube independently in the existing receipt: music pending, ready, uploaded-private, published-verified, deleted, or blocked with the actual reason. Drive delivery is not social publication; downloading is not approval or proof of posting. Keep a package in Ready while either intended platform still needs action. Move it to Published only once all intended platform publications are verified (or the owner explicitly cancels the remaining target). Retain real publication URLs and deletion history. Do not delete originals or social uploads as part of delivery cleanup.

## Intermediate-file cleanup

Run cleanup only within the requested project/date scope. Inventory first and classify the actual files by use, not by a name such as `temp`, `old` or `QA`. Preserve the upload master, native paid video clips, all reusable image/Element inputs, genuine source photographs and detail crops, extracted source lettering, identity maps, exact successful prompts/settings, useful contact sheets, owner decisions, publication records and reusable tools/dependencies. A generated image can be an output or an important failed-input record; do not discard it merely because a newer image exists.

Candidates include regenerable timestamp frames, temporary inspection enlargements, encoding fragments, unused trial exports and exact duplicate copies with a verified retained canonical file. Check references before removing anything. Keep an overview contact sheet and review outcome when discarding individual review frames. Preserve HTML/index targets or update their links; historical JSON sample paths may remain as evidence, with the cleanup receipt marking those samples as removed after review.

Save a cleanup receipt outside the candidate set before action: resolved scope roots, exact candidate paths/reasons/bytes, retained source/result hashes, intended recovery method and status. Validate every target remains inside those roots and that it is not a path through an unreviewed reparse point. On Windows use one native filesystem API throughout. Prefer the Recycle Bin for disposable local intermediates or a clearly recorded archive for material worth keeping; never empty the Recycle Bin as part of routine cleanup. Drive intermediates should stay in Review or an existing archive; use recoverable trash only when deletion is within the owner's request. Preserve IDs when organizing remote files.

Record each completed move/removal, failures and restoration location. Recheck retained hashes and final-media metadata after cleanup. Report the actual count and bytes removed from the working folder; recycled bytes are not disk space reclaimed. Do not sweep all Downloads, global generated images, unrelated vehicles, shared runtimes or Git changes. Organization does not authorize a paid generation, social publication, new sharing permission or destructive cleanup.

## Phone and automation boundary

Provide a brief phone workflow: open the exact Drive folder → download the MP4 to the device → select it in the relevant app → add that platform's music → paste its prepared copy. A Drive offline-only flag is not proof the video is available to the social app's gallery picker. Keep platform-native songs out of the shared master unless a separate license covers the intended embedded use. Never upload a silent placeholder to a social platform just to transfer it to the phone when music will require a new upload.

Use an available authorized Drive connector for recurring transfers; otherwise the signed-in web UI can deliver files. Do not install a connector, grant new access, create credentials, set up a scheduled automation or promise unattended uploads merely from a request to improve this skill. Report actual delivery and remaining manual music steps separately. Verify observed Drive filenames and sizes; phone playback/download remains unverified until actually observed or reported.


## Generation-input delivery preference (owner2026-10-25)

For staged Reel/Shorts source images and prompts, deliver individual files in Google Drive. Keep each image and its same-name prompt together, with a short selection guide; do not create ZIP archives unless the owner explicitly asks. Preserve existing older archives rather than deleting them as an unrequested cleanup. This preference is separate from documentary carousel archive requirements.
