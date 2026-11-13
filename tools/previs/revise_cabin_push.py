"""MCP: replace I01 pullback with a small fixed-lens forward dolly."""
import bpy, json, sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'.local/previs/interior-lhd-v001'
OUT=ROOT/'.local/previs/interior-lhd-v002-push'
assert not (OUT/'camera-presets.blend').exists(), 'Keep earlier output'
sys.path.insert(0,str(ROOT/'tools/previs'))
from verify_interior_lhd import verify
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'camera-presets.blend'))
window=bpy.context.window_manager.windows[0]
s=bpy.data.scenes['I01'];window.scene=s;s.frame_set(1)
c=s.camera;origin=c.location.copy();rotation=c.rotation_quaternion.copy();lens=c.data.lens
forward=rotation@Vector((0,0,-1))
physical={o.name:o.matrix_world.copy() for o in s.objects if o!=c}
s.frame_set(120)
old_progress=(c.location-origin).dot(forward)
assert old_progress < -.05, ('Expected old pullback',old_progress)
c.animation_data_clear();c.rotation_mode='QUATERNION'
for f in range(1,121):
    u=(f-1)/119;ease=u*u*(3-2*u)
    c.location=origin+forward*(.04*ease);c.rotation_quaternion=rotation
    c.keyframe_insert(data_path='location',frame=f)
    c.keyframe_insert(data_path='rotation_quaternion',frame=f)
for layer in c.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:key.interpolation='LINEAR'
s['camera_direction']='forward_dolly_only';s['camera_travel_m']=.04

def check_push():
    values=[];max_rotation_error=0
    for h in range(2,241):
        f=h/2;s.frame_set(int(f),subframe=f%1)
        progress=(c.location-origin).dot(forward);values.append(progress)
        lateral=c.location-origin-forward*progress
        assert lateral.length<1e-6
        max_rotation_error=max(max_rotation_error,max(abs(a-b) for a,b in zip(c.rotation_quaternion,rotation)))
        assert c.data.lens==lens
        for o in s.objects:
            if o!=c:
                assert not o.animation_data
                assert max(abs(o.matrix_world[i][j]-physical[o.name][i][j]) for i in range(4) for j in range(4))<1e-7
    assert all(b>=a-1e-7 for a,b in zip(values,values[1:]))
    assert .0399<values[-1]<.0401 and abs(values[0])<1e-7
    assert max_rotation_error<1e-7
    return dict(old_forward_progress_m=old_progress,new_forward_progress_m=values[-1],
                samples=len(values),monotonic_inward=True,fixed_lens_mm=lens,
                fixed_rotation=True,non_camera_motion=False,lhd=verify(s))

checks=check_push()
m=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
cue=('Begin with the established wide left-hand-drive cabin composition. Make a very short, slow physical dolly in toward the visible dashboard. '
     'Use a fixed lens and fixed orientation; retain the visible steering, dashboard and console. No pullback, zoom out, widening field of view, '
     'newly revealed rear seats, additional roof structure or newly invented interior parts.')
row=next(r for r in m['shots'] if r['id']=='I01')
row.update(title='실내 전체 · 짧은 돌리 인',description_ko='실내 전체 구도에서 4cm만 전진합니다. 뒤로 빠지거나 새로운 실내 영역을 드러내지 않습니다.',
           camera_technique='cabin_push',camera_prompt=cue,amount=.04,
           prompt=cue+' All vehicle parts remain stationary. Camera movement only. Preserve the left-hand-drive layout.')
m.update(revision='interior-lhd-v002-push',source_revision='interior-lhd-v001',changed_ids=['I01'],
         reuse_package='presets/interior-lhd-v1',build_tool='revise_cabin_push.py')
(OUT/'I01/frames').mkdir(parents=True,exist_ok=True)
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'camera-presets.blend'))
(OUT/'verification-before-reopen.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
bpy.ops.wm.open_mainfile(filepath=str(OUT/'camera-presets.blend'))
window=bpy.context.window_manager.windows[0]
s=bpy.data.scenes['I01'];window.scene=s;c=s.camera
reopened=check_push()
(OUT/'verification.json').write_text(json.dumps(dict(before_and_after=checks,reopened=reopened),indent=2),encoding='utf-8')
result=dict(file=str(OUT/'camera-presets.blend'),check=checks,reopened_verified=True)
