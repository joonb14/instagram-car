"""Background-only smoke test of fresh C scene construction; no file is saved."""
import bpy
import json
from pathlib import Path

assert bpy.app.background, 'Run in an isolated background Blender, never the owner GUI'
HERE = Path(__file__).resolve().parent
source = (HERE / 'build.py').read_text(encoding='utf-8').split('\nshots=get_shots()\n', 1)[0]
namespace = {'__file__': str(HERE / 'build.py')}
exec(compile(source, str(HERE / 'build.py'), 'exec'), namespace)
from person_proxy import actor_objects

rows = []
for shot in namespace['get_shots']():
    if not shot['id'].startswith('C'):
        continue
    scene = bpy.data.scenes.new('TEST_' + shot['id'])
    bpy.context.window.scene = scene
    namespace['setup'](scene)
    scene.frame_start = 1
    scene.frame_end = shot['frames']
    namespace['interactions'](scene, shot)
    assert not actor_objects(scene), shot['id']
    blocks = [o for o in scene.objects if o.get('role') == 'person_position_only']
    assert len(blocks) == (1 if shot['id'] in ['C01', 'C09'] else 0)
    if blocks:
        assert len(blocks[0].data.vertices) == 8 and len(blocks[0].data.polygons) == 6
        assert shot['door_clearance_m'] >= .20
    assert scene.camera and scene.camera.animation_data
    rows.append({'id': shot['id'], 'person_blocks': len(blocks), 'anatomy_objects': 0, 'mode': shot['person_proxy_mode']})
report = HERE.parents[1] / '.local/analysis/person-block-v003/builder-check.json'
report.parent.mkdir(parents=True, exist_ok=True)
report.write_text(json.dumps({'pass': True, 'scenes': rows}, indent=2), encoding='utf-8')
print('FRESH BUILDER VERIFIED', len(rows))
