import bpy, json, sys
from pathlib import Path
P=Path(bpy.data.filepath).parent
m=json.loads((P/'manifest.json').read_text(encoding='utf-8'))
stills='--stills' in sys.argv
selected=sys.argv[sys.argv.index('--ids')+1].split(',') if '--ids' in sys.argv else None
for row in m['shots']:
    if selected and row['id'] not in selected:continue
    s=bpy.data.scenes[row['id']];bpy.context.window.scene=s
    if stills:
        s.frame_set(60);s.render.filepath=str(P/row['id']/'mid.png');bpy.ops.render.render(write_still=True)
    else:
        s.render.filepath=str(P/row['id']/'frames')+'/'
        bpy.ops.render.render(animation=True)
    print('DONE '+row['id'],flush=True)
