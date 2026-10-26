# Pairing manifest and local tool

Use Node24+ and the project's installed dependencies. The installed skill wrapper locates the project's maintained tool via explicit `--project`; it never embeds a stale application copy. If an isolated historical production source predates this tool/registry, first port the reviewed home-film registration implementation, selectors and tests to that staging source without discarding subsequent live changes. Do not fall back to deploying the whole shared checkout.

Commands (run from the current project or use absolute paths):

```powershell
node scripts/home-films/sync.mjs plan --project . --input artifacts/home-film-sync/RUN/pairing.json --output artifacts/home-film-sync/RUN/plan.json
node scripts/home-films/sync.mjs apply --project . --plan artifacts/home-film-sync/RUN/plan.json --output artifacts/home-film-sync/RUN/applied.json
```

Every output path must be new. Plan changes no app files. Apply revalidates source/registry/asset hashes under an exclusive `apps/web/app/content/home-film-sync.lock`; a changed input requires a fresh review/plan, never resetting the hash by hand. Never delete another owner's lock. Public assets must not collide with differing bytes. Failed apply rolls back its newly copied assets. The registry is replaced only after checks succeed. Archive manifest/plan/receipt with the eventual deployment evidence. Applying does not deploy or touch the forum collector state.

Manifest fields:

- `channel`: exactly `https://www.youtube.com/@future_classic_club`.
- `url`: actually observed HTTPS YouTube Shorts/watch/share URL; `card.video` is its11-character ID.
- `sourceKey`: exact existing article `sourceIds` value, not model/generation.
- Optional `replacesVideoId`: actual previous ID when a new upload replaces this same case's existing card.
- `review`: `observedAt` ISO timestamp, `notes` describing actual evidence, and true findings for `public`, `channelVerified`, `sameVehicle`, `embeddingPlayable`, `articleLiveEn`, `articleLiveKo`, `photosReviewed`. These describe actual observations; never set them merely to satisfy validation.
- `card`: matches `HomeFilm` in `apps/web/app/lib/home-films.ts`: `slug`, `video`, `name`, supported `year`, bilingual `{en,ko}` `title`, `intro`, `text`, `credit`, `disclosure`, plus1–3`photos` with `file`, bilingual `label` and `alt`. `|` separates short heading/intro lines. A `file` is a unique lowercase hyphenated basename, never a path; the renderer appends`.webp`.
- `photos`: one evidence record for each card photo: same `file`, project-relative `assetPath` to the reviewed WebP, `articleSlug`, `sourceImageUrl` matching that article's original figure URL, `sameVehicle:true` after actual visual/source review, and `sha256` of those exact reviewed bytes. Use meaningful case-prefixed basenames. The WebP must decode, be at least200px each side and omit EXIF. Use an already protected derivative; the tool does not mask plates or judge car identity from pixels.

The source gallery must be published under`community`. Copy only approved derivative bytes into `/home-films`; keep private provenance and raw capture under artifacts, not the public registry. An article source URL or profile being inaccessible is not permission to invent metadata. For an unsupported match or blocked embed, leave registry/assets unchanged and record the exact missing evidence. Existing valid duplicate mappings return`already-linked`.

Run regression tests:

```powershell
node node_modules/vitest/vitest.mjs run tests/integration/home-film-sync.test.ts tests/integration/home-film-selector.test.ts tests/integration/home-films.test.ts tests/integration/home-featured.test.ts tests/integration/feed-pagination.test.ts
```

Then perform scoped type/build/browser/live verification required by the requested publication scope. Never use a successful tool receipt as a substitute for actual image/video/source review or as a claim of deployment.
