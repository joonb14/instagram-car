"""A 30s subject-led edit with unequal shot durations and three new views."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.local/previs/preset-camera-v005'
SOURCE=ROOT/'.local/previs/preset-camera-v004'
assert not (OUT/'camera-presets.blend').exists()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'camera-presets.blend'))
w=bpy.context.window_manager.windows[0]
old=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'));rows={r['id']:r for r in old['shots']}
archive=json.loads((ROOT/'.local/previs/preset-camera-v003/manifest.json').read_text(encoding='utf-8'))
for r in archive['shots']:rows.setdefault(r['id'],r)
PLAN=[('A06',1.2),('W01',1),('A07',2.8),('I01',2.4),('I05',1.2),('I07',1.8),('I02',1),('I03',1),('I04',1.2),('I06',1.4),('T01',1),('A08',2),('B08',2),('A02',2.8),('A03',3.2),('A11',4)]
assert sum(round(t*60) for _,t in PLAN)==1800
records=[];checks=[]
for sid,seconds in PLAN:
    new=sid in ['W01','I07','T01'];source={'W01':'A09','I07':'I04','T01':'B08'}.get(sid,sid)
    if new:
        s=bpy.data.scenes[source].copy();s.name=sid;s.use_fake_user=True
        original=s.camera;cam=original.copy();cam.data=original.data.copy();s.collection.objects.link(cam);s.camera=cam
        # Shared static meshes stay untouched; only this camera is single-user.
    else:s=bpy.data.scenes[sid]
    w.scene=s;s.frame_set(7);c=s.camera
    baseline={o.name:o.matrix_world.copy() for o in s.objects if o.type!='CAMERA'}
    n=round(seconds*60);poses=[];row=dict(rows[source]);row.update(id=sid,duration=seconds,core_duration=seconds,frames=n,source_shot=source,new_view=new)
    if new:
        origin=c.location.copy();rot=c.rotation_quaternion.copy();forward=rot@Vector((0,0,-1));right=rot@Vector((1,0,0))
        if sid=='W01':
            target=min((o for o in s.objects if o.name.startswith('Wheel.')),key=lambda o:(o.location-origin).length).location.copy()
            start=origin+(origin-target).normalized()*.14;end=origin
            title='앞 휠 · 짧은 접근';cue='A short physical push toward the stationary front wheel, followed by a shape-matched cut to the rear-wheel pullback reveal.'
        elif sid=='I07':
            target=Vector((-.35,.35,.65));start=target+(origin-target)*1.28;end=start+right*.09
            title='실내 중간 거리 · 시트와 콘솔';cue='A medium cabin view showing the seat and console together. Slide a few centimeters to reveal their spatial separation before returning to close details.'
        else:
            lamp=next(o for o in s.objects if o.name.startswith('Tail_lamp.') and o.location.x>.0);target=lamp.location.copy()
            start=target+Vector((.85,1.65,.35));end=start+Vector((-.16,0,0));c.data.lens=42
            rot=(target-start).to_track_quat('-Z','Y')
            title='테일램프 · 후면 디테일';cue='A short close rear-corner camera slide along the stationary taillamp and bumper, introducing the rear bodywork before the wider rear-deck view.'
        offset=(target-origin).to_track_quat('-Z','Y').inverted()@rot if sid!='T01' else rot.inverted()@rot
        for f in range(n):
            t=f/(n-1);u=.7*t+.3*(3*t*t-2*t*t*t);pos=start.lerp(end,u)
            q=(target-pos).to_track_quat('-Z','Y')@offset;poses.append((pos,q))
        row.update(title=title,camera_prompt=cue,prompt=cue+' Keep the vehicle, wheels, cabin and environment stationary; camera movement only. Fixed focal length.',description_ko=title)
    else:
        # Evaluate the original continuous camera curve at new subframe times.
        # This renders true 60fps motion, without stretching encoded frames.
        for f in range(n):
            oldf=7+119*f/(n-1);s.frame_set(int(oldf),subframe=oldf-int(oldf))
            poses.append((c.location.copy(),c.rotation_quaternion.copy()))
    c.animation_data_clear();c.rotation_mode='QUATERNION'
    for f,(pos,q) in enumerate(poses,1):
        c.location=pos;c.rotation_quaternion=q
        c.keyframe_insert(data_path='location',frame=f);c.keyframe_insert(data_path='rotation_quaternion',frame=f)
    s.frame_start=1;s.frame_end=n;s.render.fps=60
    error=0
    for h in range(2,2*n+1):
        f=h/2;s.frame_set(int(f),subframe=f-int(f))
        for o in s.objects:
            if o.type!='CAMERA':
                assert not o.animation_data
                error=max(error,max(abs(o.matrix_world[i][j]-baseline[o.name][i][j]) for i in range(4) for j in range(4)))
    assert error<1e-7
    row.update(clip=sid+'/preview.mp4',start_frame=sid+'/start.png',mid_frame=sid+'/mid.png',end_frame=sid+'/end.png')
    records.append(row);checks.append(dict(id=sid,frames=n,samples=2*n-1,noncamera_max_matrix_error=error,new_view=new))
    (OUT/sid/'frames').mkdir(parents=True,exist_ok=True)
m=dict(version=5,revision='preset-camera-v005',width=1080,height=1920,fps=60,handles_seconds=0,shots=records,selected_order=[s for s,_ in PLAN],split_after=13,total_seconds=30)
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'camera-only-verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'camera-presets.blend'))
result={'file':str(OUT/'camera-presets.blend'),'frames':1800,'shots':16,'new_views':['W01','I07','T01']}
