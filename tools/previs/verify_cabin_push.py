"""Verify a persisted I01 forward-only dolly after independently opening it."""
import bpy, json, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from verify_interior_lhd import verify
s=bpy.data.scenes['I01'];bpy.context.window_manager.windows[0].scene=s
s.frame_set(1);c=s.camera;origin=c.location.copy();q=c.rotation_quaternion.copy()
forward=q@Vector((0,0,-1));lens=c.data.lens
progress=[]
for h in range(2,241):
    f=h/2;s.frame_set(int(f),subframe=f%1)
    distance=(c.location-origin).dot(forward);progress.append(distance)
    assert (c.location-origin-forward*distance).length<1e-6
    assert max(abs(a-b) for a,b in zip(c.rotation_quaternion,q))<1e-7
    assert c.data.lens==lens
assert all(b>=a-1e-7 for a,b in zip(progress,progress[1:]))
assert .0399<progress[-1]<.0401 and abs(progress[0])<1e-7
result=dict(file=bpy.data.filepath,samples=len(progress),forward_travel_m=progress[-1],
            fixed_lens=lens,fixed_orientation=True,monotonic_inward=True,lhd=verify(s))
Path(bpy.data.filepath).with_name('persisted-push-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print('PASS: persisted I01 has a 4 cm forward-only fixed-lens dolly')
