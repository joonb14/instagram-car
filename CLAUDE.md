# Project instructions

Read and follow [AGENTS.md](AGENTS.md) before working in this repository. It is the maintained source of project rules, including video format, source preservation, generation authorization, and the current Car Commercial direction.

## Required Blender MCP default

For each new Blender MCP task, launch a fresh Blender instance through the CLI in the current session, enable its MCP add-on, and verify the connection with a real MCP call. Match the returned process ID to the newly launched PID before editing the scene. Reuse that verified instance for follow-ups within the same task.

Check existing processes and listener ports first. Preserve open scenes and unsaved work; never kill an unidentified process to free a port. Follow the launch command, collision handling, and verification procedure in AGENTS.md. Do not assume a prior session's Blender connection remains valid.

The assistant builds the scene-by-scene Blender previs; the owner reviews framing and movement. Current reference direction: Higgsfield “Use Case 5 — The Car Commercial,” with road, car, and people retained and interior-visible shots separated from exterior-only shots.

For the reusable driving/interior cut library, read `skills/car-shot-previs/SKILL.md` and `docs/modular-previs.md`. Source tools are under `tools/previs/`; private clips, photos and receipts stay under `.local/`.

Represent a person in previs with one rectangular column only: no arms, hands, fingers or separate anatomy. Interior detail shots retain control motion without hand meshes. The person column must remain clear of the full door-opening/closing sweep (current implementation: at least 0.20 m). Current simplified-person library: `.local/previs/modular-car-v003/`.
