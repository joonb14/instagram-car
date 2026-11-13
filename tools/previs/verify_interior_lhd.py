"""Verify driver-relative handedness, framing and camera-only motion in Blender."""
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view


def verify(scene):
    bpy.context.window_manager.windows[0].scene = scene
    scene.frame_set(scene.frame_start)
    ring = next(o for o in scene.objects if o.name.startswith('Plain_steering_ring'))
    dash = next(o for o in scene.objects if o.name.startswith('Dashboard_volume'))
    backs = [o for o in scene.objects if o.name.startswith('Seat_back')]
    rear = sum((o.matrix_world.translation for o in backs), Vector()) / len(backs)
    forward = dash.matrix_world.translation - rear
    forward.z = 0
    forward.normalize()
    left = Vector((0, 0, 1)).cross(forward)
    offset = (ring.matrix_world.translation - dash.matrix_world.translation).dot(left)
    assert offset > .3, (scene.name, 'steering is not on driver left', offset)
    baseline = {o.name: o.matrix_world.copy() for o in scene.objects if o != scene.camera}
    locations = []
    screen_x = []
    for half in range(scene.frame_start * 2, scene.frame_end * 2 + 1):
        frame = half / 2
        scene.frame_set(int(frame), subframe=frame % 1)
        assert scene.camera.matrix_world.to_3x3().determinant() > .999
        for obj in scene.objects:
            if obj == scene.camera:
                continue
            assert not obj.animation_data, obj.name
            assert obj.matrix_world.to_3x3().determinant() > 0, obj.name
            assert max(abs(obj.matrix_world[i][j] - baseline[obj.name][i][j])
                       for i in range(4) for j in range(4)) < 1e-6
        uv = world_to_camera_view(scene, scene.camera, ring.matrix_world.translation)
        if scene.name == 'I01':
            assert .03 < uv.x < .5 and .03 < uv.y < .97 and uv.z > 0, tuple(uv)
        if scene.name == 'I05':
            assert .03 < uv.x < .97 and .03 < uv.y < .97 and uv.z > 0, tuple(uv)
        screen_x.append(uv.x)
        locations.append(scene.camera.matrix_world.translation.copy())
    travel = sum((b-a).length for a, b in zip(locations, locations[1:]))
    assert travel > .02, (scene.name, 'camera unexpectedly frozen')
    assert (scene.render.resolution_x, scene.render.resolution_y,
            scene.render.resolution_percentage, scene.render.fps) == (1080, 1920, 100, 60)
    return dict(id=scene.name, driver_left_offset_m=offset,
                camera_travel_m=travel, samples=len(locations),
                steering_screen_x=[min(screen_x), max(screen_x)],
                non_camera_motion=False)


if __name__ == '__main__':
    result = [verify(s) for s in bpy.data.scenes if s.name.startswith('I')]
    print('LHD VERIFIED', result)
