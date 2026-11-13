"""MCP entry: subject-motivated orbits/reveals on the existing static set."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector, Quaternion
from bpy_extras.object_utils import world_to_camera_view

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'.local/previs/preset-camera-v001'
OUT=ROOT/'.local/previs/preset-camera-v003'
assert not (OUT/'camera-presets.blend').exists(), 'Preserve existing revisions'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'camera-presets.blend'))
window=bpy.context.window_manager.windows[0]
m=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
PLAN={
 'A01':('orbit',12,'전면 전체 · 수평 아크','Orbit horizontally around the parked vehicle by twelve degrees, keeping its complete silhouette visible.'),
 'A03':('orbit',12,'후면 전체 · 수평 아크','Orbit twelve degrees toward the rear, retaining the full vehicle and revealing the rear-quarter depth.'),
 'A11':('orbit',8,'로우 후면 · 수평 아크','Make an eight-degree low horizontal orbit around the rear, keeping the full silhouette within the frame.'),
 'A02':('front_push',.16,'전면 사선 · 보닛·라이트 접근','Make a short physical push toward the hood and front lamps, keeping the selected front-quarter composition.'),
 'A06':('lamp_slide',.18,'헤드라이트 · 라인 따라 슬라이드','Slide gently along the lamp and bumper line while maintaining the selected headlight at its original screen position.'),
 'A07':('wheel_reveal',.85,'뒤 휠 · 펜더 풀백 리빌','Start on the stationary rear wheel. Pull the camera back diagonally to reveal more fender and rear-quarter bodywork while retaining the wheel in frame.'),
 'A09':('wheel_reveal',.90,'앞 휠 · 차체 풀백 리빌','Start on the stationary front wheel. Physically pull back with slight sideways parallax to reveal the fender and adjoining bodywork. Do not rotate the wheel.'),
 'A08':('vertical_arc',24,'상부 · 위에서 아래로 수직 아크','Descend on a twenty-four-degree curved camera orbit from the accepted overhead view, revealing hood, glass and side depth. The camera position moves, not just its tilt.'),
 'A10':('vertical_arrival',18,'측면 · 내려오는 수직 아크','Begin above the accepted front-half side view and descend on an eighteen-degree curved orbit, arriving at the accepted side composition. Keep the nose and front wheel visible.'),
 'B08':('vertical_arc',20,'뒤 데크 · 하강 수직 아크','Descend on a twenty-degree curved camera orbit around the rear deck, revealing its depth below the rear window without panning off the selected body section.'),
 'I01':('cabin_reveal',.065,'실내 전체 · 짧은 풀백','Gently pull back from the accepted cabin composition to reveal its spatial depth. Keep the dashboard, steering ring and console composition readable.'),
 'I02':('console_slide',.065,'센터콘솔 · 형태 따라 슬라이드','Make a short slide along the blank console, maintaining it in frame. No gear lever movement or invented control action.'),
 'I03':('door_slide',.07,'도어패널 · 깊이를 보여주는 슬라이드','Move the camera a few centimeters along the static door panel while maintaining the selected panel area. Do not sweep into empty space or operate the door.'),
 'I04':('seat_slide',.07,'시트 · 시트와 콘솔 사이 슬라이드','Make a small lateral camera move to reveal the separation between seat and console while keeping both in the accepted composition.'),
 'I05':('steering_push',.065,'스티어링 · 짧은 접근','Push gently toward the stationary steering ring, maintaining its original screen position and surrounding dashboard.'),
 'I06':('dash_slide',.075,'대시보드 · 라인 따라 슬라이드','Slide gently along the dashboard line, tracking the selected passenger-side volume rather than tilting away from it.'),
}

def find(s,prefix):
    return next(o for o in s.objects if o.name.startswith(prefix))

def look(pos,target):
    return (target-pos).to_track_quat('-Z','Y')

checks=[]
for row in m['shots']:
    sid=row['id'];s=bpy.data.scenes[sid];window.scene=s;s.frame_set(60)
    c=s.camera;origin=c.location.copy();rot=c.rotation_euler.to_quaternion()
    baseline={o.name:o.matrix_world.copy() for o in s.objects if o!=c}
    mode,amount,title,cue=PLAN[sid]
    forward=rot@Vector((0,0,-1));right=rot@Vector((1,0,0));up=Vector((0,0,1))
    body=find(s,'Body.') if row['classification']=='exterior' else None
    target=origin+forward*max(.5,(origin-(body.location if body else Vector((0,-.5,.8)))).length)
    if mode=='orbit':target=body.location.copy();target.z=.8
    if mode in ['vertical_arc','vertical_arrival']:
        target=origin+forward*((.9-origin.z)/forward.z)
    if mode=='vertical_arrival':
        target=min((o for o in s.objects if o.name.startswith('Wheel.')),key=lambda o:(o.location-origin).length).location.copy()+Vector((0,0,.38))
    if mode=='wheel_reveal':
        wheel=min((o for o in s.objects if o.name.startswith('Wheel.')),key=lambda o:(o.location-origin).length)
        target=wheel.location.copy()
    if mode=='lamp_slide':target=min((o for o in s.objects if o.name.startswith('Flush_rectangular_light.')),key=lambda o:(o.location-origin).length).location.copy()
    driver_sign=1 if s.get('driving_side')=='left_hand_drive' else -1
    if mode=='door_slide':target=next(o.location.copy() for o in s.objects if o.name.startswith('Plain_door_volume') and o.location.x*driver_sign>0)
    if mode=='steering_push':target=find(s,'Plain_steering_ring').location.copy()
    correction=look(origin,target).inverted()@rot
    c.animation_data_clear();c.rotation_mode='QUATERNION';s.frame_end=132
    start_uv=world_to_camera_view(s,c,target)
    for f in range(1,133):
        t=(f-7)/119;u=.7*t+.3*(3*t*t-2*t*t*t)
        pos=origin.copy();q=rot.copy()
        if mode=='orbit':
            a=Quaternion(up,math.radians(amount)*u);pos=target+a@(origin-target);q=a@rot
        elif mode in ['vertical_arc','vertical_arrival']:
            a=Quaternion(right,math.radians(amount)*(u-(1 if mode=='vertical_arrival' else 0)))
            pos=target+a@(origin-target);q=a@rot
        elif mode=='wheel_reveal':
            away=(origin-target).normalized();pos=origin+away*(amount*u)+right*(.10*u)
            q=look(pos,target)@correction
        else:
            delta={'front_push':forward,'lamp_slide':Vector((1,0,0)),
                   'cabin_reveal':-forward,'console_slide':Vector((0,-1,0)),
                   'door_slide':Vector((0,-1,0)),'seat_slide':right,
                   'steering_push':forward,'dash_slide':Vector((-driver_sign,0,0))}[mode]
            pos+=delta*amount*u;q=look(pos,target)@correction
        c.location=pos;c.rotation_quaternion=q
        c.keyframe_insert(data_path='location',frame=f);c.keyframe_insert(data_path='rotation_quaternion',frame=f)
    # Inspect every output frame and half-frame for world immobility and target retention.
    error=0;drift=0;heights=[];radii=[];coverage=1
    for h in range(2,265):
        f=h/2;s.frame_set(int(f),subframe=f-int(f))
        for o in s.objects:
            if o!=c:
                assert not o.animation_data
                error=max(error,max(abs(o.matrix_world[i][j]-baseline[o.name][i][j]) for i in range(4) for j in range(4)))
        uv=world_to_camera_view(s,c,target);drift=max(drift,abs(uv.x-start_uv.x),abs(uv.y-start_uv.y))
        heights.append(c.location.z);radii.append((c.location-target).length)
        if mode=='orbit':
            pts=[world_to_camera_view(s,c,o.matrix_world@Vector(v)) for o in s.objects if o.type=='MESH' and not o.name.startswith(('Road','Ground','Lane')) for v in o.bound_box]
            coverage=min(coverage,min(min(p.x,1-p.x,p.y,1-p.y) for p in pts))
    assert error<1e-7,(sid,error)
    assert drift<.015,(sid,drift)
    if mode=='orbit':assert coverage>.01,(sid,coverage)
    if mode in ['vertical_arc','vertical_arrival']:assert all(a>=b-1e-5 for a,b in zip(heights,heights[1:])),sid
    if mode=='wheel_reveal':assert radii[-1]-radii[0]>.7,sid
    row.update(title=title,frames=132,duration=2.2,core_duration=2,camera_technique=mode,camera_prompt=cue,prompt=cue+' Keep the vehicle, wheels, environment and every interior object stationary. Use fixed focal length; no digital zoom.',description_ko=title,anchor_frame=60,anchor_source='preset-camera-v001',anchor_at='end' if mode=='vertical_arrival' else 'start',target=list(target),amount=amount)
    (OUT/sid/'frames').mkdir(parents=True,exist_ok=True)
    checks.append(dict(id=sid,samples=263,noncamera_max_matrix_error=error,target_screen_drift=drift,full_car_margin=coverage if mode=='orbit' else None,camera_height_start=heights[0],camera_height_end=heights[-1],radius_start=radii[0],radius_end=radii[-1]))
m.update(revision='preset-camera-v003',version=3,handles_seconds=.1,readme_camera='전체차는 실제 차체 중심 수평 아크, 상부는 위에서 아래로 수직 아크, 측면은 위에서 내려와 기존 측면 구도에 도착합니다. 휠은 고정한 채 뒤로 빠져 펜더와 차체를 드러냅니다. 전면과 실내는 선택한 대상을 유지하는 짧은 이동입니다. 기존 v1의 60프레임 구도를 시작점으로 사용하며 A10은 도착점으로 사용합니다.',build_tool='direct_camera_presets.py')
m['preferred_edition']='clean'
m['edits']={
 'E01':['cut']*9,'E02':['cut']*8+['fade'],
 'E03':['fade']+['cut']*8,'E04':['cut']*9,
 'I01':['cut','cut','fadeblack','cut','cut','cut','cut','fadeblack','fade'],
 'I02':['cut','cut','cut','cut','fadeblack','cut','cut','cut','fade'],
 'I03':['cut']*9,
 'I04':['fadeblack','cut','cut','cut','cut','cut','fadeblack','cut','fade'],
}
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'camera-only-verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'camera-presets.blend'))
result={'file':str(OUT/'camera-presets.blend'),'checks':checks}
