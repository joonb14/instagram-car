"""Add an optional camera-motion treatment to the existing ASMR cut library.

Run through a verified Blender MCP session with v001 already open. Vehicle,
wheel and interaction animation remain bit-for-bit unchanged in the scene.
"""
import bpy, math, json, hashlib, shutil
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'.local/previs/modular-car-v001'
OUT=ROOT/'.local/previs/modular-car-v002'
# Offsets are metres in the original camera's right/up/forward basis.
MOVES={
 'C01':dict(start=(-.16,.02,-.05),end=(.16,0,.13),aim=(-.65,.12,.88),target=(0,0,0),note='A short smooth lateral slide across the driver door with a gentle push-in during the opening. Maintain waist-height framing and keep the hand and hinge action readable.'),
 'C02':dict(start=(-.06,.015,-.04),end=(.06,-.015,.10),aim=(.08,0,.77),target=(0,0,0),note='Slide a few centimetres along the door panel and push gently toward the large door pull as the hand draws the door inward. Keep the grip point inside the frame.'),
 'C03':dict(start=(.04,.02,-.04),end=(-.04,-.02,.04),aim=(0,-.23,.74),target=(0,-.01,0),note='A short diagonal push-in over the console toward the gear knob, with restrained handheld texture. Keep the knob and the hand-to-lever contact readable throughout the shift.'),
 'C04':dict(start=(-.04,.02,-.04),end=(.07,-.015,.025),aim=(.06,.04,.65),target=(0,0,0),note='A small sideways slide and gentle downward approach to the handbrake. Preserve a clear view of the lever length and its pivot while the hand operates it.'),
 'C05':dict(start=(-.025,.01,-.03),end=(.03,-.01,.05),aim=(.11,-.04,1.0),target=(0,-.025,0),note='Slowly push from the steering-wheel and cluster context toward the ignition key. Let the framing settle slightly lower on the key turn; keep the inserted key and fingers visible.'),
 'C06':dict(start=(-.32,.025,-.20),end=(.32,-.015,.12),aim=(0,1.1,.82),target=(0,0,0),note='A visible but restrained low lateral dolly across the rear three-quarter view, with a gentle forward move toward the rear bumper and exhaust. The car remains parked and every wheel remains still.'),
 'C07':dict(start=(.025,-.01,.03),end=(-.025,.015,-.08),aim=(.11,-.04,1.0),target=(0,.015,0),note='Ease back slightly from the ignition as the hand turns the key off and removes it. Maintain the same side of the steering wheel and let a little more cockpit context enter the frame.'),
 'C08':dict(start=(-.035,.01,-.025),end=(.03,-.01,.045),aim=(-.28,0,.81),target=(0,0,0),note='A brief close push and slight lateral drift toward the interior release latch. Follow the pull without losing the fingers or latch and without adding another camera cut.'),
 'C09':dict(start=(.16,0,.12),end=(-.14,.02,-.05),aim=(-.65,.12,.88),target=(0,0,0),note='Slide gently back along the driver door and ease outward as the hand closes it. Keep the closing seam and hand contact visible until the door is shut.'),
}
def curve_signature(scene,exclude_camera=False):
    records=[]
    for o in sorted(scene.objects,key=lambda x:x.name):
        if exclude_camera and o==scene.camera:continue
        curves=[]
        if o.animation_data and o.animation_data.action:
            for layer in o.animation_data.action.layers:
                for strip in layer.strips:
                    for bag in strip.channelbags:
                        for fc in bag.fcurves:curves.append((fc.data_path,fc.array_index,[(list(k.co),k.interpolation) for k in fc.keyframe_points]))
        records.append((o.name,curves))
    return hashlib.sha256(json.dumps(records,sort_keys=True).encode()).hexdigest()

assert Path(bpy.data.filepath).resolve()==(SOURCE/'modular-car.blend').resolve(),'Load the unchanged v001 first'
assert not OUT.exists(),'Create a fresh output revision instead of overwriting one'
m=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
before={s.name:curve_signature(s,True) for s in bpy.data.scenes}
original_sha=hashlib.sha256((SOURCE/'modular-car.blend').read_bytes()).hexdigest()
OUT.mkdir(parents=True)
for row in m['shots']:
    sid=row['id'];s=bpy.data.scenes[sid];bpy.context.window.scene=s;s.frame_set(1)
    target=OUT/sid;target.mkdir()
    if sid not in MOVES:
        for name in ['preview.mp4','start.png','mid.png','end.png','prompt.txt','render-source.json']:shutil.copy2(SOURCE/sid/name,target/name)
        continue
    (target/'frames').mkdir();spec=MOVES[sid];cam=s.camera
    if sid=='C06':s.display.shading.show_shadows=False  # Workbench wheel-shadow artifacts appeared on the ground during the slide.
    base=cam.location.copy();q=cam.rotation_euler.to_quaternion();right=q@Vector((1,0,0));up=q@Vector((0,1,0));forward=q@Vector((0,0,-1))
    aim=Vector(spec['aim']);cam.animation_data_clear();positions=[];startquat=None;endquat=None
    for f in range(1,s.frame_end+1):
        t=(f-1)/max(1,s.frame_end-1);u=.15*t+.85*t*t*(3-2*t);sec=(f-1)/60
        delta=Vector(spec['start']).lerp(Vector(spec['end']),u)
        jitter=right*(math.sin(sec*2.3)*.0015)+up*(math.sin(sec*2.9)*.0015)
        cam.location=base+right*delta.x+up*delta.y+forward*delta.z+jitter
        a=aim+right*spec['target'][0]*u+up*spec['target'][1]*u+forward*spec['target'][2]*u
        cam.rotation_euler=(a-cam.location).to_track_quat('-Z','Y').to_euler()
        for prop in ['location','rotation_euler']:cam.keyframe_insert(data_path=prop,frame=f)
        positions.append(list(cam.location))
        if f==1:startquat=cam.rotation_euler.to_quaternion()
        endquat=cam.rotation_euler.to_quaternion()
    for layer in cam.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:k.interpolation='LINEAR'
    row['source_camera_prompt']=row['camera_prompt']
    row['camera_prompt']=spec['note']
    row['camera_motion']=dict(spec,travel_m=sum((Vector(b)-Vector(a)).length for a,b in zip(positions,positions[1:])),orientation_change_degrees=math.degrees(startquat.rotation_difference(endquat).angle),lens_mm=cam.data.lens)
    s['camera_instruction']=row['camera_prompt'];s.frame_set(1)
for s in bpy.data.scenes:
    assert before[s.name]==curve_signature(s,True),('Non-camera animation changed',s.name)
    s.render.filepath=str(OUT/s.name/'frames')+'/'
bpy.context.window.scene=bpy.data.scenes['C01']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'modular-car.blend'))
m.update(revision='modular-car-v002',base_revision='modular-car-v001',base_blend_sha256=original_sha,blend_sha256=hashlib.sha256((OUT/'modular-car.blend').read_bytes()).hexdigest(),camera_treatment='Added visible short camera slides and push/pull moves to C01-C09. A/B, wheels and all subject action unchanged.',user_visual_approval=False)
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
receipt={'new_pid':__import__('os').getpid(),'source_sha256':original_sha,'output_sha256':m['blend_sha256'],'changed_cameras':list(MOVES),'preview_shadow_fix':['C06'],'all_non_camera_animation_unchanged':True,'non_camera_animation_signatures':before,'moves':{s['id']:s['camera_motion'] for s in m['shots'] if s['id'] in MOVES}}
(OUT/'camera-motion-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8')
result={'blend':str(OUT/'modular-car.blend'),'changed_cameras':list(MOVES),'non_camera_animation_unchanged':True,'travel_m':{k:round(v['travel_m'],3) for k,v in receipt['moves'].items()}}
