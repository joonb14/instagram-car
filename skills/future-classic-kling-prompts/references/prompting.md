# Evidence and preparation schema

Read2026-10-24:
- [Runway AI Video Prompting Guide](https://runway.com/resources/ai-video-prompting-guide): camera-first structure, one primary action, positive descriptions and simple initial prompts. This is Runway guidance; its universal-model marketing claims and5–10second examples do not validate our Kling3second workflow. Its advice to iterate is not permission for repeated paid submissions.
- [Kling VIDEO3.0 guide](https://kling.ai/quickstart/klingai-video-3-model-user-guide): Start Frame+Element support, single-shot behavior with Multi-Shot disabled and configurable duration. These capabilities do not guarantee exact small text, parked-car geometry or a particular orbit speed.

Observed local evidence: earlier prompts said fixed camera while asking movement; others described LEFT and produced tracking; the latest964 front-half orbit changed viewpoint too quickly while other clips were satisfactory. Earlier Jeep Element/Start Frame references carried diagonal wipers that were treated as raised. On2026-10-25 the owner corrected that interpretation and revoked low-horizontal staging; preserve the source-documented rest geometry. Treat these as observed case failures, not proof of a single universal cause. ORBIT is clearer vocabulary but not a magic keyword. Long prompts are not proven to be ignored merely because they are long.

The owner subsequently supplied four actual964 prompt texts reported successful: lamp detail, front toward wheel/side, rear corner toward rear wheel, and front corner toward side. They share a concrete local anchor, restrained arc and a stable preservation/camera-only footer. The updated compiler follows that structure while standardizing pace language. It does not impose new exact numeric angles, copy Porsche parts into Jeep, or treat user-reported964 success as an inspected or successful Jeep generation. Retain the moving-scene/physical-path analysis as a plan check even when the body omits an explicit background-parallax clause.

## Plan JSON

`subject`, `elementName`, `stage: before|after|finished`, `scene`; `settings` contains the owner's model/duration/resolution/aspect/output/audio/Multi-Shot settings. `camera` contains:

- `kind: orbit`, `referenceFrame`: exact starting camera/view;
- `direction`: physical destination, e.g. toward the frontal centerline;
- `anchor`: existing front headlamp, rear corner or other visible part;
- `reveal`: small visible consequence, e.g. slightly more grille face and less outer fender;
- `framing`: tight front-half, full car, rear quarter, etc.;
- `extent: subtle|small`, `pace: gentle` (legacy schema value, always rendered as `slow, steady`); optional `degrees` is recorded as unverified and omitted by the compiler. Extent changes the arc length, not the pace adjective. Identical wording does not calibrate actual output velocity.

`details` has at most two relevant visible-detail sentences. `visibleWipers` controls the parked-blade clause; set it from actual pixels. `reviews.input` and `reviews.element` need genuine pass/notes, and `reviews.wipers.status` must pass when blades are visible. A fabricated pass cannot satisfy actual QA.

CLI `reviewedFiles` records the exact `file`, `sha256`, `status: pass`, matching `stage` and `role: start|element` for the Start Frame and four distinct Element files. Files resolve relative to plan.json. The hash audit detects changed bytes only. Reuse parent skill visual receipts and do not erase hold history. A failed build writes a hold report with draft text for review; do not describe that text as generation-ready.

Separate handoff fields: Start Frame path, four Element reference paths, actual picker name, settings, prompt, readiness/remaining blockers, single test hypothesis, actual observed quote/balance and expected result. Provider credit quotes are not guessed from previous runs. Existing user authorization remains in force; no unnecessary new permission questions for preparation.

## Positive vocabulary

Use desired visible behavior: “subject size remains steady” instead of a repeated zoom prohibition; “vehicle and wheels remain still” for a parked car; “wipers retain their source-documented resting angles and pivots” after checking the original image. “Natural background parallax” accompanies an orbit; “background pixels unchanged” is only appropriate to a still-image restoration-state edit, never an orbiting video.

Avoid overloading a three-second shot with orbit, pullback, pan, lights switching, color transition and fade. Keep a part hidden by choosing/validating the crop and motion corridor; a textual concealment command cannot establish camera geometry. Numeric angles and exact letter preservation remain test targets, not calibrated controls.

For this owner's current Before/After work use one state-specific vehicle Element per clip. The owner rejected the two-Element within-clip transformation test on2026-10-24. The linter flags multiple distinct @Element tokens in this parked-car profile; repetition of the same token is allowed. Single-Element subject motion and lettering failures were also reported on that date, without a newly inspected result link. These reports do not establish a provider root cause or validate an alternative prompt. Return to separate Before/After clips and local cuts; do not present that choice as a cure for single-clip identity defects.

Later that day, Jeep Before05 result942935216526606413 was directly played and scrubbed at0.03s and2.96s. It changes from rear three-quarter to almost straight rear; workshop perspective changes too. Record excessive viewpoint change as observed; rolling/sliding is not independently established. The rear-centerline destination is a plausible overshoot contributor, not a proven model cause. The next single-shot candidate retains rear-three-quarter visibility, follows the user-successful rear-corner-to-wheel direction by only a few degrees, and clarifies the car's fixed world position/orientation. Do not promote this untested candidate to every prompt or describe its text-linter pass as a video-quality fix.
