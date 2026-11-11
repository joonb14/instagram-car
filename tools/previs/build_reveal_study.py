"""Revise only I01/A07/A11: occlusion reveal, rising pullback, decelerating arc."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector,Quaternion
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.local/previs/preset-camera-v006';SOURCE=ROOT/'.local/previs/preset-camera-v005'
assert not (OUT/'camera-presets.blend').exists()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'camera-presets.blend'))
w=bpy.context.window_manager.windows[0];m=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'));checks=[]
def look(pos,target):return (target-pos).to_track_quat('-Z','Y')
for sid in ['I01','A07','A11']:
    s=bpy.data.scenes[sid];w.scene=s;row=next(r for r in m['shots'] if r['id']==sid);n=row['frames'];s.frame_set(1);c=s.camera
    origin=c.location.copy();rot=c.rotation_quaternion.copy();baseline={o.name:o.matrix_world.copy() for o in s.objects if o.type!='CAMERA'}
    poses=[]
    if sid=='I01':
        target=Vector((0,-.65,1));end=origin;start=Vector((-.22,1.18,1.29));control=Vector((.05,1.05,1.72));offset=look(end,target).inverted()@rot
        for f in range(n):
            t=f/(n-1);u=t*t*(3-2*t);pos=(1-u)**2*start+2*(1-u)*u*control+u*u*end;poses.append((pos,look(pos,target)@offset))
        title='실내 전체 · 시트 뒤에서 드러나는 리빌';cue='Begin behind the stationary seat back, which partially occludes the cabin. Move the camera laterally and slightly upward, clearing the seat to reveal the dashboard and steering wheel. The seat stays fixed; only the camera moves. End on the established wide cabin composition.'
    elif sid=='A07':
        target=min((o for o in s.objects if o.name.startswith('Wheel.')),key=lambda o:(o.location-origin).length).location.copy();offset=look(origin,target).inverted()@rot
        for f in range(1,n+1):
            s.frame_set(f);t=(f-1)/(n-1);u=t*t*(3-2*t);pos=c.location.copy()+Vector((0,0,.45*u));poses.append((pos,look(pos,target)@offset))
        title='뒤 휠 · 풀백하며 상승 리빌';cue='Start close to the stationary rear wheel. Pull back while raising the physical camera by about 45 cm, revealing the fender and more bodywork. Keep the wheel in frame; no wheel rotation or digital zoom.'
    else:
        target=next(o.location.copy() for o in s.objects if o.name.startswith('Body.'));target.z=.8
        for f in range(n):
            t=f/(n-1);u=1-(1-t)**3;a=Quaternion(Vector((0,0,1)),math.radians(20)*u);poses.append((target+a@(origin-target),a@rot))
        title='전체차 피날레 · 감속 수평 아크';cue='Make a twenty-degree horizontal camera orbit around the stationary full vehicle. Begin briskly, then continuously decelerate, gently settling into the final rear composition. Preserve the full silhouette, fixed focal length and level horizon.'
    c.animation_data_clear()
    for f,(pos,q) in enumerate(poses,1):
        c.location=pos;c.rotation_quaternion=q;c.keyframe_insert(data_path='location',frame=f);c.keyframe_insert(data_path='rotation_quaternion',frame=f)
    err=0;clearance=999;margin=1
    for h in range(2,2*n+1):
        f=h/2;s.frame_set(int(f),subframe=f-int(f))
        for o in s.objects:
            if o.type!='CAMERA':
                assert not o.animation_data
                err=max(err,max(abs(o.matrix_world[i][j]-baseline[o.name][i][j]) for i in range(4) for j in range(4)))
        if sid=='I01':
            for o in s.objects:
                if o.name.startswith(('Seat_','Plain_door','Dashboard','Blank_center','Floor')):
                    corners=[o.matrix_world@Vector(v) for v in o.bound_box]
                    dist=math.sqrt(sum(max(min(v[i] for v in corners)-c.location[i],0,c.location[i]-max(v[i] for v in corners))**2 for i in range(3)))
                    clearance=min(clearance,dist)
        if sid=='A11':
            pts=[world_to_camera_view(s,c,o.matrix_world@Vector(v)) for o in s.objects if o.type=='MESH' and not o.name.startswith(('Road','Ground','Lane')) for v in o.bound_box]
            margin=min(margin,min(min(p.x,1-p.x,p.y,1-p.y) for p in pts))
    assert err<1e-7
    if sid=='I01':assert clearance>.03,clearance
    if sid=='A11':assert margin>.01,margin
    extra={}
    if sid=='I01':
        seat=next(o for o in s.objects if o.name.startswith('Seat_back') and o.location.x<0)
        steering=next(o for o in s.objects if o.name.startswith('Plain_steering_ring')).location.copy()
        tree=BVHTree.FromPolygons([v.co for v in seat.data.vertices],[list(p.vertices) for p in seat.data.polygons])
        def blocked(pos):
            inv=seat.matrix_world.inverted();a=inv@pos;b=inv@steering;d=b-a
            return tree.ray_cast(a,d.normalized(),d.length)[0] is not None
        extra={'steering_blocked_at_start':blocked(poses[0][0]),'steering_blocked_at_end':blocked(poses[-1][0])}
        assert extra['steering_blocked_at_start'] and not extra['steering_blocked_at_end']
    row.update(title=title,camera_prompt=cue,prompt=cue+' Keep all physical objects, wheels, doors and controls stationary. No hands or gear operation.',description_ko=title)
    checks.append(dict(id=sid,samples=2*n-1,noncamera_error=err,seat_camera_clearance=clearance if sid=='I01' else None,full_car_margin=margin if sid=='A11' else None,**extra))
    (OUT/sid/'frames').mkdir(parents=True,exist_ok=True)
m.update(version=6,revision='preset-camera-v006',changed_shots=['I01','A07','A11'],previous_package='presets/rhythm-study-v5',page_title='리빌·상승·감속을 넣은 30초 시안',page_summary='I01 시트 뒤 리빌 · A07 상승 풀백 · A11 감속 아크. 나머지 13컷과 길이는 v5 그대로입니다. 1080×1920 · 60fps · 30초 / 20초 + 10초.',study_note='v5에서 I01/A07/A11 세 컷만 수정했습니다. 실내는 시트 등받이 뒤에서 카메라가 빠져나오며 드러나고, 휠은 풀백에 상승을 결합했습니다. 마지막 20도 아크는 빠르게 시작해 점차 감속합니다. 가림막은 추가 물체가 아니라 기존 시트입니다. 나머지 13개 MP4와 시작 PNG는 v5 파일을 그대로 복사합니다.',build_tool='build_reveal_study.py')
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8');(OUT/'camera-only-verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'camera-presets.blend'));result={'file':str(OUT/'camera-presets.blend'),'checks':checks}
