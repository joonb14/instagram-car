---
name: car-shot-previs
description: Use when the owner requests modular Blender car previs from reference videos, per-cut camera prompts, or separate exterior, interior and door-interaction shots for later image-guided video generation.
---

# Car shot previs

Produce editable 3D blocking and independently usable portrait clips. A cut is the unit of creation, photo matching, generation and assembly. Appearance comes from the owner's photos; geometry carries framing and motion.

The maintained implementation is the `instagram-car` repository, currently `C:/Users/joonb/OneDrive/바탕 화면/instagram-car`. Read its `AGENTS.md` and `docs/modular-previs.md`. Keep media and receipts under ignored `.local/`. Installed copies of this skill must match the repository source.

## Begin and inspect

Existing-library selection and prompt/photo preparation use saved files. Enter Blender only when scene creation or revision is needed. A preparation-only request can finish with a recipe and photo slots while all generation remains pending.

For each new Blender MCP task, launch a fresh Blender from the CLI, enable the installed MCP add-on and match an actual MCP Python response PID to the new PID before scene work. Preserve existing scenes; inspect listener ownership before stopping only a known safe listener. Reuse the verified instance within the task. Exact launch and collision procedure is in `AGENTS.md`.

Inspect downloaded source frames across each proposed cut, including adjacent motion. Scene-change scores are candidates: hands and reflections can cause false cuts. Record source in/out, sampled scope and uncertain action. Distinguish a large door pull from a release latch or window crank by observing its movement. Classify door-opening exterior views as **mixed** when the cockpit becomes visible.

## Cut contract

Each cut has an ID, source interval, exterior/interior/mixed class, duration, camera height/angle/crop/path, vehicle or hand action, required photo slots, and compatibility condition. Preserve frontal versus diagonal framing. Record loop-return cuts so ordinary assembly does not accidentally repeat them.

| Cut | Appearance input | Adaptation |
|---|---|---|
| Driving / parked rear | Corresponding exterior angle | Body, wheels, lamps, exhaust; stationary wheels for idle |
| Door opening/closing | Exterior plus open-door cockpit | Hinge, handle, door opening and visible interior |
| Gear / brake / key / latch | Close photo of that control and surroundings | Actual type, position, handedness and hand contact |

Missing photos do not block generic motion studies. Mark photo adaptation pending. A manual lever, physical key or mechanical handbrake is usable only when the target vehicle has it. Different layouts require revised blocking, not a prompt that invents the original mechanism.

## Build and package

Use the repository tools described in `docs/modular-previs.md`; current `shots.py` is an authored reference library, not an automatic camera solver. Create an independent scene and MP4 per cut, native 1080×1920 boundary PNGs, an English prompt and Korean camera/photo notes. Tag roles are motion video, exterior identity and interior identity; confirm actual upload tag bindings later.

Represent each visible person with one rectangular column only, without arms, hands, fingers, separate head or other anatomy. In interior close-ups, preserve control movement and omit the human mesh rather than covering the control with a column. Keep the exterior column outside the entire door swing with a positive margin (current tool: at least 0.20 m); validate all moving door components, not only the main door panel. The column is a presence marker, not an exact human reach/contact guide. Preserve camera framing and control motion when simplifying people. `simplify_people.py` creates v003 from the existing v002; `person_proxy.py` is shared with fresh scene builds.

Derive wheel spin from travel/radius; verify ground contact and final-fps spoke readability. Inspect start/middle/end and dense motion samples before delivery. Check wheel occlusion, cropped subjects, door/column clearance and rendering artifacts. Distinguish mathematical checks, sampled visual review and continuous playback.

Deliver the local scene player (`index.html` / `player.html`), assembly catalog (`catalog.html`), individual clips, editable `.blend`, photo guide and assembly recipe. The player pairs the current video with its scene ID, Korean title/description and English prompt; timeline selection, seeking, continuous playback and repeat are available. Build it from saved media with `tools/previs/player.py` or `package.py --catalog-only`; no Blender launch is needed for this presentation-only step. Preserve relative media paths when copying it. Test timeline boundaries, playback progression and prompt/asset bindings; distinguish these checks from actual browser playback and visual review. `assemble.py` concatenates selected cuts and splits at cut boundaries for an input duration limit; it does not silently trim oversized cuts. Decode output files, check dimensions/frame counts and bind receipts to hashes. This workflow prepares generation inputs; it does not submit paid jobs or publish.

Use the owner's confirmed duration limit for an intended provider. When the limit is unknown, mark it pending and prepare individual clips without claiming submission readiness.

## Still-only direction — 2026-11-11
The owner reported background travel and wheel-speed mismatch in generated footage and replaced the motion direction with fully static cuts. Current delivery: `.local/previs/modular-car-v005-still/`. Freeze camera, vehicle, wheels, background, people, doors and interior controls for each complete cut; retain cut timing and framing. Use `tools/previs/freeze.py` on existing reviewed midpoint PNGs without a Blender launch. This supersedes earlier driving/wheel-animation preferences for current deliveries. Earlier animated libraries remain archived. This is a video/still derivative, not an updated animated Blender scene. Verify all decoded frames within each cut are identical. Current 997 assembly: `assemblies/997-turbo-still-20s-01.mp4`.

## Camera-only presets — current direction 2026-11-11
The owner clarified that camera movement must remain: the current default is a parked vehicle, fixed wheels, fixed environment and fixed interior controls with CAMERA MOVEMENT ONLY. This supersedes the earlier fully frozen-camera preference. Keep the v005 still-only version as an archive. New reusable inputs are `presets/camera-only-20s-v1/`: four exterior-only and four exterior/interior 20-second recipes. Each uses ten 2-second shots at 1080x1920/60fps, silent. Generic interior scenes use only neutral seat, dashboard, door and blank-console volumes; omit E30-specific door pulls, dash, vents, gear lever, keys and buttons. Real interior design must come from the target-car photos. No gear or door operation. The owner explicitly authorized storing these directly authored proxy preset MP4s and their recipes in Git; this does not authorize private vehicle photographs, original reference footage, generated customer films or job receipts in Git. Source Blender and execution receipts stay under `.local/previs/preset-camera-v001/`. Build through verified MCP with `build_camera_presets.py`; render with `render_camera_presets.py`; package with `package_presets.py`.
