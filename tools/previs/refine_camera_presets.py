"""MCP entry: preserve existing geometry/framing, author varied camera paths."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector, Quaternion

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'.local/previs/preset-camera-v002'
SOURCE=ROOT/'.local/previs/preset-camera-v001'
assert not (OUT/'camera-presets.blend').exists()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'camera-presets.blend'))
window=bpy.context.window_manager.windows[0]
m=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
# Distances are total travel; rotations are total angular change, centered on
# the accepted composition. No lens animation, geometry change or subject motion.
MOVES={
 'A01':('dolly_in',.55,'전체차 · 돌리 인'),
 'A02':('pedestal_down',.16,'전면 사선 · 하강'),
 'A03':('arc',math.radians(6),'후면 사선 · 짧은 아크'),
 'A06':('slide_right',.18,'전면 디테일 · 우측 슬라이드'),
 'A07':('dolly_out',.16,'휠 · 돌리 아웃'),
 'A08':('tilt',math.radians(5),'상부 · 틸트'),
 'A09':('pedestal_up',.14,'휠 · 상승'),
 'A10':('slide_left',.32,'측면 · 좌측 슬라이드'),
 'A11':('dolly_out',.45,'후면 전체 · 돌리 아웃'),
 'B08':('pan',math.radians(4),'후면 상부 · 팬'),
 'I01':('dolly_in',.10,'실내 전체 · 돌리 인'),
 'I02':('slide_right',.09,'센터콘솔 · 우측 슬라이드'),
 'I03':('pan',math.radians(4),'도어패널 · 팬'),
 'I04':('pedestal_down',.10,'시트 · 하강'),
 'I05':('dolly_out',.10,'스티어링 · 돌리 아웃'),
 'I06':('tilt',math.radians(4),'대시보드 · 틸트'),
}
EN={
 'dolly_in':'Slow physical dolly in along the existing optical axis, fixed focal length.',
 'dolly_out':'Slow physical dolly out along the existing optical axis, fixed focal length.',
 'slide_right':'Short camera truck right with fixed orientation; gentle parallax.',
 'slide_left':'Short camera truck left with fixed orientation; gentle parallax.',
 'pedestal_up':'Gentle vertical camera pedestal up, preserving the viewing direction.',
 'pedestal_down':'Gentle vertical camera pedestal down, preserving the viewing direction.',
 'arc':'A restrained six-degree arc around the existing rear three-quarter composition.',
 'pan':'Small horizontal camera pan from a fixed camera position.',
 'tilt':'Small vertical camera tilt from a fixed camera position.',
}
checks=[]
for row in m['shots']:
    sid=row['id'];s=bpy.data.scenes[sid];window.scene=s;s.frame_set(60)
    c=s.camera;origin=c.location.copy();rot=c.rotation_euler.to_quaternion()
    baseline={o.name:o.matrix_world.copy() for o in s.objects if o!=c}
    mode,amount,title=MOVES[sid]
    c.animation_data_clear();c.rotation_mode='QUATERNION'
    right=rot@Vector((1,0,0));up=Vector((0,0,1));forward=rot@Vector((0,0,-1))
    pivot=origin+forward*max(1,(origin-Vector((0,0,.8))).length)
    s.frame_end=132
    for f in range(1,133):
        # Mild ease-in/out without the stop-start feel of a full smoothstep.
        t=(f-1)/131;u=(.7*t+.3*(3*t*t-2*t*t*t))-.5
        pos=origin.copy();q=rot.copy()
        if mode.startswith('dolly'):pos+=forward*amount*u*(1 if mode=='dolly_in' else -1)
        elif mode.startswith('slide'):pos+=right*amount*u*(1 if mode=='slide_right' else -1)
        elif mode.startswith('pedestal'):pos+=up*amount*u*(1 if mode=='pedestal_up' else -1)
        elif mode=='arc':
            a=Quaternion(up,amount*u);pos=pivot+a@(origin-pivot);q=a@rot
        elif mode=='pan':q=Quaternion(up,amount*u)@rot
        elif mode=='tilt':q=Quaternion(right,amount*u)@rot
        c.location=pos;c.rotation_quaternion=q
        c.keyframe_insert(data_path='location',frame=f);c.keyframe_insert(data_path='rotation_quaternion',frame=f)
    maxerr=0
    for f in range(1,133):
        s.frame_set(f)
        for o in s.objects:
            if o!=c:
                assert not o.animation_data
                maxerr=max(maxerr,max(abs(o.matrix_world[i][j]-baseline[o.name][i][j]) for i in range(4) for j in range(4)))
    assert maxerr<1e-7
    row.update(title=title,frames=132,duration=2.2,core_duration=2.0,camera_technique=mode,camera_prompt=EN[mode],prompt=EN[mode]+' Keep the vehicle, wheels, doors, controls and environment completely stationary.',description_ko=title+' — 기존 구도를 중심으로 작은 범위에서 카메라만 움직입니다.',anchor_frame=60,anchor_source='preset-camera-v001',travel_or_angle=amount)
    (OUT/sid/'frames').mkdir(parents=True,exist_ok=True)
    checks.append({'id':sid,'samples':132,'noncamera_max_matrix_error':maxerr,'technique':mode})
m['revision']='preset-camera-v002';m['handles_seconds']=.1
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'camera-only-verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'camera-presets.blend'))
result={'file':str(OUT/'camera-presets.blend'),'shots':len(checks),'techniques':sorted(set(v[0] for v in MOVES.values()))}
