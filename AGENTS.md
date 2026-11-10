# Working rules

Communicate in concise Korean. Treat this repository as the maintained source for the new per-scene Blender MCP previs skill. The former Future Classic bundle was removed by owner request. Keep installed copies and Git history consistent; do not claim a local edit was backed up before a successful push.

All video production is9:16 by owner requirement. Prepare actual1080x1920 Start Frames before paid requests. Landscape Element references are not landscape-video authorization. Validate actual file geometry, selected composition and provider settings before every Generate click. Do not compensate for a wrong source with an unrequested split-screen or landscape final.

Preserve user-selected camera framing. Front-half describes coverage, not automatic permission to substitute a diagonal angle for a frontal view. Source selection, photo QA, paid generation authorization and publication are separate facts.

Preserve original vehicle details when extending backgrounds. Store private media and job receipts outside Git. Use the existing shared source registry for restoration collection; do not create competing ingestion state.

Run meaningful tests for changed tools. Never fabricate visual approvals, exact costs, provider job IDs or publication results. No automatic paid retries or publication.

## Blender MCP startup — required default

For every new Blender MCP task, launch a fresh Blender instance from the CLI in the current session, enable the installed MCP add-on, and verify the live MCP connection before scene work. Do not assume a previous session's process or connection is usable. Reuse the verified instance for follow-up steps within that same task; do not launch another instance for each tool call.

Before launch, inspect Blender processes and the MCP listener (currently localhost:9876). Preserve existing scenes and unsaved work. If the port is occupied, identify its owner and stop only the known MCP listener when safe, or configure an isolated port supported by the client. Never kill an unidentified Blender process or discard unsaved work merely to free the port. If safe isolation is unavailable, explain the conflict and ask for the needed decision.

Verified installation at the time of writing: `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`; official add-on module: `bl_ext.user_default.mcp`. Check these paths and module availability before use. PowerShell launch:

```powershell
Start-Process -FilePath 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' -ArgumentList '--online-mode','--addons','bl_ext.user_default.mcp' -WindowStyle Hidden -PassThru
```

Record the new PID and verify with an actual Blender MCP Python call returning `os.getpid()`, `bpy.app.version_string`, `bpy.data.filepath`, and enabled add-ons. The returned PID must match the launched instance. A running process or open port alone is not proof of connection. Keep launch/connection receipts under `.local/`, outside Git. Use a visible window when the owner requests interactive viewing.

## Current previs direction

The owner wants to follow “Use Case 5 — The Car Commercial” in the Higgsfield Blender workflow article. Read that section before claiming its exact procedure: https://higgsfield.ai/@adilinthewild/blogs/this-blender-higgsfield-ai-workflow-changes-how-you-make-ai-video

Reference video: https://www.youtube.com/watch?v=fvlAGwLelT8. The assistant creates the Blender previs through MCP; do not require the owner to build it manually. Keep road, car, and people. Separate any interior-visible footage from exterior-only footage, and prepare independent scene outputs for later generation and assembly. Preserve selected framing while applying the owner's 9:16 production requirement. Previs creation does not authorize paid generation or publication.

## Reusable cut library

Use the maintained skill at `skills/car-shot-previs/SKILL.md` and `docs/modular-previs.md` for modular car shots. Current additional references: `eaq0oFtTaQs`, `NHWZKfeyJII`, and `xPlXE8XQi0Y`. The local library is `.local/previs/modular-car-v001/`; source tools are `tools/previs/`. Classify open-door shots with visible cabins as mixed, even when the camera is outside. Interior photos must match the actual gear, brake, key and latch layout; generic blocking does not establish target-vehicle fidelity. Maintain per-cut camera prompts, photo slots and duration-limited assembly recipes.

The owner accepted reference-consistent wheel rotation; retain it for driving shots. The camera-motion variant is `.local/previs/modular-car-v002/`, with added slides and push/pull moves on ASMR shots C01–C09. Keep v001 available for comparison. Added camera treatment is distinct from the source camera reconstruction.

People in previs must be represented by one rectangular column per visible person. Do not model arms, hands, fingers, a separate head or anatomical parts. Interior close-ups may show only the moving controls, without adding a person column that obscures the selected framing. Keep the column outside the entire moving door sweep, with positive clearance through all frames and subframes; never let the door intersect it. Current implementation uses at least 0.20 m separation. The current simplified-person revision is `.local/previs/modular-car-v003/`; retain earlier revisions for comparison.

