"""Single-cuboid person marker, kept outside the entire door sweep."""
import math
import bpy
from mathutils import Vector

ACTOR_PREFIXES = ('Adult_proxy', 'Door_hand', 'Door_pull_hand', 'Latch_hand',
                  'Shifter_hand', 'Brake_hand', 'Key_hand', 'Upper_arm', 'Forearm')


def actor_objects(scene):
    found = set()
    for obj in scene.objects:
        if obj.name.startswith(ACTOR_PREFIXES):
            found.add(obj)
            found.update(obj.children_recursive)
    return found


def remove_anatomy(scene):
    objects = actor_objects(scene)
    names = sorted(o.name for o in objects)
    for obj in objects:
        mesh = obj.data if obj.type == 'MESH' else None
        bpy.data.objects.remove(obj, do_unlink=True)
        if mesh is not None and mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    return names


def door_sweep_min_x(scene, hinge):
    """Analytical X envelope of all rigid child vertices over linear Z rotation.

    Closed form extrema include interval endpoints and sin/cos critical angles.
    A column wholly left of this envelope cannot hit the door at any subframe.
    Valid only for this fixed, upright, unit-scale hinge and rigid door assembly.
    """
    scene.frame_set(1)
    origin = hinge.matrix_world.translation.copy()
    children = [o for o in hinge.children_recursive if o.type == 'MESH']
    assert children, 'Door mesh required'
    assert not hinge.constraints
    for child in hinge.children_recursive:
        assert not child.animation_data and not child.constraints, 'Non-rigid door child unsupported'
        if child.type == 'MESH':
            assert not child.data.shape_keys and not child.data.animation_data
            assert all(mod.type in {'BEVEL', 'WEIGHTED_NORMAL'} for mod in child.modifiers), 'Deforming modifier unsupported'
    initial = {o.name: (hinge.matrix_world.inverted() @ o.matrix_world).copy() for o in children}
    angles = []
    for frame in range(scene.frame_start, scene.frame_end + 1):
        scene.frame_set(frame)
        assert (hinge.matrix_world.translation - origin).length < 1e-6, 'Moving hinge unsupported'
        assert abs(hinge.rotation_euler.x) < 1e-6 and abs(hinge.rotation_euler.y) < 1e-6
        assert (hinge.matrix_world.to_scale() - Vector((1, 1, 1))).length < 1e-6
        if hinge.parent:
            assert not hinge.parent.animation_data and not hinge.parent.constraints, 'Animated car parent unsupported'
            assert hinge.parent.matrix_world.to_quaternion().angle < 1e-6, 'Rotated car unsupported'
        for obj in children:
            assert not obj.animation_data, 'Animated door child unsupported'
            delta = hinge.matrix_world.inverted() @ obj.matrix_world
            assert max(abs(delta[r][c] - initial[obj.name][r][c]) for r in range(4) for c in range(4)) < 1e-5
        angles.append(float(hinge.rotation_euler.z))
    action = hinge.animation_data.action
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    assert all(k.interpolation == 'LINEAR' for k in curve.keyframe_points), 'Door curve may overshoot'
    low, high = min(angles), max(angles)
    assert high - low < math.pi
    scene.frame_set(1)
    dg = bpy.context.evaluated_depsgraph_get()
    inverse = hinge.matrix_world.inverted()
    bound = math.inf
    vertex_count = 0
    for obj in children:
        evaluated = obj.evaluated_get(dg)
        mesh = evaluated.to_mesh()
        transform = inverse @ evaluated.matrix_world
        for vertex in mesh.vertices:
            p = transform @ vertex.co
            candidates = [low, high]
            critical = math.atan2(-p.y, p.x)
            for turn in range(-3, 4):
                angle = critical + turn * math.pi
                if low <= angle <= high:
                    candidates.append(angle)
            bound = min(bound, *(origin.x + p.x * math.cos(a) - p.y * math.sin(a) for a in candidates))
            vertex_count += 1
        evaluated.to_mesh_clear()
    return {'min_x': bound, 'angles_rad': [low, high], 'hinge_origin': list(origin),
            'door_meshes': [o.name for o in children], 'evaluated_vertices': vertex_count,
            'method': 'Analytical extrema over the complete linear hinge-angle range; rigid child meshes.'}


def add_person_block(scene, hinge, clearance=.20):
    sweep = door_sweep_min_x(scene, hinge)
    width, depth, height = .30, .30, 1.74
    # An extra millimetre protects the requested clearance against float rounding.
    center_x = sweep['min_x'] - clearance - .001 - width / 2
    bpy.ops.mesh.primitive_cube_add(size=1, location=(center_x, .29, -.01 + height / 2))
    obj = bpy.context.object
    obj.name = 'Person_block'
    obj.dimensions = (width, depth, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mat = bpy.data.materials.get('Person_block_orange') or bpy.data.materials.new('Person_block_orange')
    mat.diffuse_color = (.88, .42, .17, 1)
    obj.data.materials.append(mat)
    obj['role'] = 'person_position_only'
    obj['representation'] = 'one rectangular prism; no head, arms, hands, fingers, legs or clothing geometry'
    obj['door_clearance_m'] = clearance
    assert len(obj.data.vertices) == 8 and len(obj.data.polygons) == 6
    sweep.update(block=obj.name, block_center=list(obj.location), block_dimensions=list(obj.dimensions),
                 minimum_x_separation_m=sweep['min_x'] - (center_x + width / 2),
                 required_clearance_m=clearance)
    return obj, sweep
