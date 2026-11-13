"""Build the actual neutral-cabin section in an isolated Blender and check LHD."""
import ast
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector
import sys

assert bpy.app.background, 'Use an isolated background Blender'
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from verify_interior_lhd import verify

tree = ast.parse((HERE / 'build_camera_presets.py').read_text(encoding='utf-8-sig'))
nodes = []
for node in tree.body:
    if isinstance(node, ast.FunctionDef) and node.name in {'setup', 'animate', 'mat', 'cube'}:
        nodes.append(node)
    if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id in {'GRAY', 'DARK', 'LIGHT', 'VIEWS'} for t in node.targets):
        nodes.append(node)
    if isinstance(node, ast.For) and isinstance(node.iter, ast.Name) and node.iter.id == 'VIEWS':
        nodes.append(node)
namespace = dict(bpy=bpy, math=math, Vector=Vector,
                 WINDOW=bpy.context.window_manager.windows[0], records=[])
exec(compile(ast.Module(body=nodes, type_ignores=[]), 'actual_cabin_builder', 'exec'), namespace)
checks = [verify(bpy.data.scenes[row['id']]) for row in namespace['records']]
assert len(checks) == 6
out = HERE.parents[1] / '.local/previs/interior-lhd-v001/fresh-builder-verification.json'
out.write_text(json.dumps(checks, indent=2), encoding='utf-8')
print('PASS: six fresh LHD cabins; camera-only paths and forward-looking composition')
