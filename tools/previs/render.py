"""Background Blender render. Pass --stills for contact review before full motion."""
import bpy,sys,json,hashlib
from pathlib import Path
P=Path(bpy.data.filepath).parent
input_sha=hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
manifest=json.loads((P/'manifest.json').read_text(encoding='utf-8'))
stills='--stills' in sys.argv
selected=sys.argv[sys.argv.index('--ids')+1].split(',') if '--ids' in sys.argv else None
rows=[]
for shot in manifest['shots']:
    if selected and shot['id'] not in selected:continue
    s=bpy.data.scenes[shot['id']];bpy.context.window.scene=s
    if stills:
        for label,f in [('start',1),('mid',(s.frame_end+1)//2),('end',s.frame_end)]:
            s.frame_set(f);s.render.filepath=str(P/shot['id']/(label+'.png'));bpy.ops.render.render(write_still=True)
    else:
        s.render.filepath=str(P/shot['id']/'frames')+'/';bpy.ops.render.render(animation=True)
    rows.append({'id':shot['id'],'frames':s.frame_end,'resolution':[s.render.resolution_x,s.render.resolution_y]})
    if not stills:
        (P/shot['id']/'render-source.json').write_text(json.dumps({'blend_sha256':input_sha,'id':shot['id'],'frames':s.frame_end}))
    print('COMPLETED',shot['id'],flush=True)
(P/('stills-receipt.json' if stills else 'render-receipt.json')).write_text(json.dumps({'blend_sha256':input_sha,'shots':rows},indent=2))
