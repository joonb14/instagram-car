"""Run through verified MCP with v002 open; save a fresh v003 without anatomy."""
import bpy
import hashlib
import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
from person_proxy import remove_anatomy, add_person_block

SOURCE = ROOT / '.local/previs/modular-car-v002'
OUT = ROOT / '.local/previs/modular-car-v003'
CHANGED = ['C01', 'C02', 'C03', 'C04', 'C05', 'C07', 'C08', 'C09']
CAMERA_NOTES = {
    'C01': 'A short smooth lateral slide across the driver door with a gentle push-in during the opening. Maintain waist-height framing and keep the hinge action readable. The orange cuboid indicates a person standing clear of the complete door sweep.',
    'C02': 'Slide a few centimetres along the door panel and push gently toward the large door pull as the door moves inward. Keep the door pull inside the frame.',
    'C03': 'A short diagonal push-in over the console toward the gear knob, with restrained handheld texture. Keep the knob and its shift movement readable.',
    'C04': 'A small sideways slide and gentle downward approach to the handbrake. Preserve a clear view of the lever length and its pivot while it moves.',
    'C05': 'Slowly push from the steering-wheel and cluster context toward the ignition key. Let the framing settle slightly lower on the key turn; keep the key visible.',
    'C07': 'Ease back slightly from the ignition as the key turns off and is removed. Maintain the same side of the steering wheel and reveal a little more cockpit context.',
    'C08': 'A brief close push and slight lateral drift toward the interior release latch. Follow the latch movement in one continuous shot.',
    'C09': 'Slide gently back along the driver door and ease outward as it closes. Keep the closing seam visible. The orange cuboid indicates a person standing clear of the complete door sweep.',
}


def signature(scene, excluded=()):
    rows = []
    for obj in sorted(scene.objects, key=lambda o: o.name):
        if obj.name in excluded:
            continue
        curves = []
        if obj.animation_data and obj.animation_data.action:
            for layer in obj.animation_data.action.layers:
                for strip in layer.strips:
                    for bag in strip.channelbags:
                        for curve in bag.fcurves:
                            curves.append((curve.data_path, curve.array_index, [(list(k.co), k.interpolation) for k in curve.keyframe_points]))
        rows.append((obj.name, obj.parent.name if obj.parent else None, curves))
    return hashlib.sha256(json.dumps(rows, sort_keys=True).encode()).hexdigest()


assert Path(bpy.data.filepath).resolve() == (SOURCE / 'modular-car.blend').resolve()
assert not OUT.exists(), 'Use a fresh revision; never overwrite an existing library'
manifest = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))
source_hash = hashlib.sha256((SOURCE / 'modular-car.blend').read_bytes()).hexdigest()
OUT.mkdir(parents=True)
rows = []
for shot in manifest['shots']:
    sid = shot['id']
    scene = bpy.data.scenes[sid]
    bpy.context.window.scene = scene
    target = OUT / sid
    target.mkdir()
    if sid not in CHANGED:
        for name in ['preview.mp4', 'start.png', 'mid.png', 'end.png', 'prompt.txt', 'render-source.json']:
            shutil.copy2(SOURCE / sid / name, target / name)
        shot['person_proxy_mode'] = 'none'
        continue
    from person_proxy import actor_objects
    removed = sorted(o.name for o in actor_objects(scene))
    before = signature(scene, removed)
    actual_removed = remove_anatomy(scene)
    assert actual_removed == removed and removed
    proof = None
    excluded = []
    if sid in ['C01', 'C09']:
        hinge = next(o for o in scene.objects if o.name.startswith('Driver_door_hinge'))
        block, proof = add_person_block(scene, hinge)
        scene.display.shading.show_shadows = False  # Workbench artifacts on the flat column.
        excluded.append(block.name)
        shot['person_proxy_mode'] = 'single_cuboid'
        shot['door_clearance_m'] = proof['minimum_x_separation_m']
    else:
        shot['person_proxy_mode'] = 'control_only'
    assert before == signature(scene, excluded), ('Retained animation changed', sid)
    shot['contact_method'] = 'No arm, hand or contact geometry. Controls retain their original mechanical animation.'
    shot['camera_prompt'] = CAMERA_NOTES[sid]
    shot['camera_motion']['note'] = CAMERA_NOTES[sid]
    shot['person_geometry_note'] = 'A single cuboid marks a person only in exterior door shots. No anatomical proxy meshes remain.'
    scene['person_proxy_mode'] = shot['person_proxy_mode']
    scene['camera_instruction'] = shot['camera_prompt']
    (target / 'frames').mkdir()
    scene.render.filepath = str(target / 'frames') + '/'
    scene.frame_set(1)
    rows.append({'id': sid, 'removed_objects': removed, 'retained_animation_signature': before, 'door_sweep_proof': proof})

bpy.context.window.scene = bpy.data.scenes['C01']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'modular-car.blend'))
output_hash = hashlib.sha256((OUT / 'modular-car.blend').read_bytes()).hexdigest()
manifest.update(revision='modular-car-v003', base_revision='modular-car-v002', base_blend_sha256=source_hash,
                blend_sha256=output_hash, person_treatment='Single rectangular column at exterior door; no anatomical proxies in any scene. At least 20 cm outside the full door sweep.',
                authorship='Existing directly authored generic car, cameras and controls retained. Anatomical proxies replaced by a single directly authored rectangular person marker.',
                user_visual_approval=False)
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
receipt = {'pid': os.getpid(), 'source_sha256': source_hash, 'blend_sha256': output_hash, 'changed_shots': CHANGED, 'changes': rows,
           'camera_vehicle_wheel_control_animation_unchanged': True, 'preview_shadow_fix': ['C01', 'C09'], 'continuous_playback_review': False, 'user_visual_approval': False}
(OUT / 'person-block-receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2), encoding='utf-8')
result = {'path': str(OUT), 'changed_shots': CHANGED, 'door_separation_m': {r['id']: r['door_sweep_proof']['minimum_x_separation_m'] for r in rows if r['door_sweep_proof']}}
