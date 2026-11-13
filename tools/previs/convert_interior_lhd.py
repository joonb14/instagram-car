"""MCP entry: reflect the generic cabin and camera paths into driver-left layout.

The old cabin faces -Y, so driver-left is +X. Preserve lens, timing and
relative framing by reflecting both geometry and the camera, with proper
positive-determinant rotations and outward mesh winding. Source stays intact.
"""
import bpy
import bmesh
import json
import sys
from pathlib import Path
from mathutils import Matrix
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/previs'))
from verify_interior_lhd import verify

SOURCE = ROOT / '.local/previs/preset-camera-v003'
OUT = ROOT / '.local/previs/interior-lhd-v001'
assert not (OUT / 'camera-presets.blend').exists(), 'Preserve previous output'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE / 'camera-presets.blend'))
window = bpy.context.window_manager.windows[0]
manifest = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))
records = [r for r in manifest['shots'] if r['classification'] == 'interior']
reflect = Matrix.Diagonal((-1, 1, 1, 1))
checks = []

for row in records:
    scene = bpy.data.scenes[row['id']]
    window.scene = scene
    camera = scene.camera
    assert not camera.parent and not camera.constraints
    old_samples = []
    for frame in range(7, 127):
        scene.frame_set(frame)
        old_samples.append(camera.matrix_world.copy())
    scene.frame_set(7)
    mesh_objects = [o for o in scene.objects if o.type == 'MESH']
    old_uvs = {o.name: world_to_camera_view(scene, camera, o.matrix_world.translation)
               for o in mesh_objects}
    for obj in mesh_objects:
        assert not obj.parent and not obj.animation_data and not obj.constraints
        old_matrix = obj.matrix_world.copy()
        obj.data = obj.data.copy()
        obj.data.transform(reflect)
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        obj.matrix_world = reflect @ old_matrix @ reflect
    camera.animation_data_clear()
    camera.rotation_mode = 'QUATERNION'
    previous = None
    for frame, old_matrix in enumerate(old_samples, 1):
        matrix = reflect @ old_matrix @ reflect
        camera.location = matrix.translation
        rotation = matrix.to_quaternion()
        if previous is not None and previous.dot(rotation) < 0:
            rotation.negate()
        camera.rotation_quaternion = rotation
        previous = rotation.copy()
        camera.keyframe_insert(data_path='location', frame=frame)
        camera.keyframe_insert(data_path='rotation_quaternion', frame=frame)
    for layer in camera.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'
    scene.frame_start = 1
    scene.frame_end = 120
    scene['driving_side'] = 'left_hand_drive'
    scene['vehicle_forward_axis'] = '-Y'
    scene.frame_set(1)
    window.view_layer.update()
    projection_error = 0
    for obj in mesh_objects:
        uv = world_to_camera_view(scene, camera, obj.matrix_world.translation)
        old = old_uvs[obj.name]
        # Perspective coordinates diverge behind/at the camera plane. Only
        # compare points that could contribute to the accepted visible frame.
        if old.z <= scene.camera.data.clip_start or not (0 <= old.x <= 1 and 0 <= old.y <= 1):
            continue
        projection_error = max(projection_error, abs(uv.x - (1-old.x)), abs(uv.y-old.y))
    assert projection_error < 1e-4, (scene.name, projection_error)
    check = verify(scene)
    check['mirrored_anchor_projection_error'] = projection_error
    checks.append(check)
    row.update(frames=120, duration=2, core_duration=2, driving_side='left_hand_drive',
               target=[-row['target'][0], *row['target'][1:]],
               prompt=row['prompt'] + ' Left-hand-drive cabin: steering is on the vehicle left, viewed forward from the seats. Do not mirror the cabin.')
    (OUT / scene.name / 'frames').mkdir(parents=True, exist_ok=True)

for scene in list(bpy.data.scenes):
    if scene.name not in {r['id'] for r in records}:
        bpy.data.scenes.remove(scene)
manifest.update(revision='interior-lhd-v001', shots=records, handles_seconds=0,
                source_revision='preset-camera-v003', driving_side='left_hand_drive',
                method='Blender geometry and camera reflection; original source retained.')
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
(OUT / 'scene-verification.json').write_text(json.dumps(checks, indent=2), encoding='utf-8')
window.scene = bpy.data.scenes['I01']
window.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'camera-presets.blend'))
bpy.ops.wm.open_mainfile(filepath=str(OUT / 'camera-presets.blend'))
reopened = [verify(bpy.data.scenes[r['id']]) for r in records]
(OUT / 'reopened-verification.json').write_text(json.dumps(reopened, indent=2), encoding='utf-8')
result = dict(file=str(OUT / 'camera-presets.blend'), scenes=len(records), checks=checks, reopened_verified=True)
