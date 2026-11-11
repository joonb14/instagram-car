"""MCP entry: only revise the two owner-requested shots from v3."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector,Quaternion
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'.local/previs/preset-camera-v003'
OUT=ROOT/'.local/previs/preset-camera-v004'
assert not (OUT/'camera-presets.blend').exists()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'camera-presets.blend'))
w=bpy.context.window_manager.windows[0]
m=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
ORDER=['A06','A07','I01','I05','I02','I03','I04','I06','A08','B08','A02','A03','A11']
m['shots']=[next(s for s in m['shots'] if s['id']==sid) for sid in ORDER]
checks=[]
for sid in ['B08','A02']:
    s=bpy.data.scenes[sid];w.scene=s;s.frame_set(7);c=s.camera
    row=next(r for r in m['shots'] if r['id']==sid)
    origin=c.location.copy();rot=c.rotation_quaternion.copy()
    baseline={o.name:o.matrix_world.copy() for o in s.objects if o!=c}
    if sid=='B08':
        target=Vector(row['target'])
        # Increase camera-target distance by 30%, retaining the same focal length,
        # look direction and twenty-degree descending arc.
        origin=target+(origin-target)*1.30
        title='뒤 데크 · 원경 하강 수직 아크'
        cue='From a wider rear-deck view, descend on a twenty-degree vertical camera arc. Keep the rear glass and deck readable and reveal more surrounding rear bodywork. Use the same focal length; the camera is physically farther away.'
    else:
        # The original optical ray meets the hood region at z=.9. Rotate the
        # physical camera about that point, as in B08, rather than just tilting.
        forward=rot@Vector((0,0,-1));target=origin+forward*((.9-origin.z)/forward.z)
        title='전면 사선 · 보닛 하강 수직 아크'
        cue='Start from the accepted elevated front-quarter composition and descend on a twenty-degree vertical camera arc around the hood region, using the same camera technique as the rear-deck shot. Retain the hood, windshield and front-wheel context.'
    c.animation_data_clear();right=rot@Vector((1,0,0))
    for f in range(1,133):
        t=(f-7)/119;u=.7*t+.3*(3*t*t-2*t*t*t)
        a=Quaternion(right,math.radians(20)*u)
        c.location=target+a@(origin-target);c.rotation_quaternion=a@rot
        c.keyframe_insert(data_path='location',frame=f);c.keyframe_insert(data_path='rotation_quaternion',frame=f)
    heights=[];error=0;uvs=[];radii=[]
    for h in range(2,265):
        f=h/2;s.frame_set(int(f),subframe=f-int(f))
        heights.append(c.location.z);radii.append((c.location-target).length)
        uv=world_to_camera_view(s,c,target);uvs.append((uv.x,uv.y))
        for o in s.objects:
            if o!=c:
                assert not o.animation_data
                error=max(error,max(abs(o.matrix_world[i][j]-baseline[o.name][i][j]) for i in range(4) for j in range(4)))
    assert error<1e-7 and all(a>b for a,b in zip(heights,heights[1:]))
    assert max(radii)-min(radii)<1e-4
    drift=max(max(abs(a-b) for a,b in zip(uvs[0],p)) for p in uvs);assert drift<1e-4
    row.update(title=title,camera_technique='vertical_arc',camera_prompt=cue,prompt=cue+' Keep the vehicle, wheels, environment and all cabin objects stationary. No digital zoom.',description_ko=title,target=list(target),amount=20,anchor_source='preset-camera-v003',anchor_frame=7,changed=True)
    (OUT/sid/'frames').mkdir(parents=True,exist_ok=True)
    checks.append(dict(id=sid,samples=263,noncamera_max_matrix_error=error,target_screen_drift=drift,height_start=heights[0],height_end=heights[-1],radius=radii[0]))
for row in m['shots']:
    row.setdefault('changed',False)
m.update(version=4,revision='preset-camera-v004',selected_order=ORDER,split_after=10,source_library='preset-camera-v003',changed_shots=['B08','A02'])
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'camera-only-verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'camera-presets.blend'))
result={'file':str(OUT/'camera-presets.blend'),'changed_shots':['B08','A02'],'checks':checks}
