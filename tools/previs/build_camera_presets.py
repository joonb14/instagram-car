"""Run in a freshly verified Blender MCP instance; create camera-only scenes."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'.local/previs/preset-camera-v001'
SOURCE=ROOT/'.local/previs/modular-car-v003/modular-car.blend'
assert not (OUT/'camera-presets.blend').exists(), 'Refusing to overwrite existing scene'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
WINDOW=bpy.context.window_manager.windows[0]
EXTERIOR=['A01','A02','A03','A06','A07','A08','A09','A10','A11','B08']
records=[]
def setup(s):
    s.render.resolution_x=1080;s.render.resolution_y=1920;s.render.resolution_percentage=100
    s.render.fps=60;s.frame_start=1;s.frame_end=120
    s.render.engine='BLENDER_WORKBENCH';s.render.image_settings.file_format='PNG'
    s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL'
    s.display.shading.show_shadows=False;s.display.shading.show_cavity=True

def animate(s,start,end,aim):
    c=s.camera;c.animation_data_clear()
    for f,pos in [(1,start),(120,end)]:
        c.location=pos;c.rotation_euler=(Vector(aim)-Vector(pos)).to_track_quat('-Z','Y').to_euler()
        c.keyframe_insert(data_path='location',frame=f);c.keyframe_insert(data_path='rotation_euler',frame=f)

for sid in EXTERIOR:
    s=bpy.data.scenes[sid];WINDOW.scene=s
    # Preserve the original midpoint framing and place the photographed subject in a parked world.
    s.frame_set((s.frame_end+1)//2)
    matrices={o.name:o.matrix_world.copy() for o in s.objects}
    for o in s.objects:o.animation_data_clear()
    for o in s.objects:
        o.parent=None
        o.matrix_world=matrices[o.name]
    c=s.camera;mid=c.location.copy();q=c.rotation_euler.to_quaternion()
    right=q@Vector((1,0,0));forward=q@Vector((0,0,-1))
    aim=mid+forward*max(.7,(mid-Vector((0,0,.8))).length)
    # Only the camera gets keys; the entire physical set including car and wheels is frozen.
    setup(s);animate(s,mid-right*.13-forward*.025,mid+right*.13+forward*.025,aim)
    records.append(dict(id=sid,title='외관 '+sid,classification='exterior',frames=120,clip=sid+'/preview.mp4',start_frame=sid+'/start.png',mid_frame=sid+'/mid.png',end_frame=sid+'/end.png',camera_prompt='A restrained lateral camera slide. The car, tires and environment remain fixed in world space.'))

def mat(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);return m
GRAY=mat('Neutral_gray',(.48,.50,.52));DARK=mat('Neutral_dark',(.17,.19,.21));LIGHT=mat('Neutral_light',(.65,.67,.69))
def cube(name,loc,scale,material=GRAY):
    with bpy.context.temp_override(window=WINDOW,scene=WINDOW.scene,view_layer=WINDOW.view_layer):
        bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
        o=WINDOW.view_layer.objects.active;o.name=name;o.dimensions=scale
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    mod=o.modifiers.new('Soft block edges','BEVEL');mod.width=.035;mod.segments=2
    o.modifiers.new('Normals','WEIGHTED_NORMAL');return o
VIEWS=[
 ('I01','실내 전체 덩어리',(.35,.55,1.65),(.22,.45,1.62),(0,-.65,1.0),18),
 ('I02','빈 센터콘솔',(.40,.55,1.25),(.30,.47,1.22),(0,-.05,.58),42),
 ('I03','단순 도어패널',(.28,.50,1.22),(.20,.40,1.19),(-.83,.0,.95),40),
 ('I04','시트와 콘솔',(.65,.35,1.55),(.55,.25,1.51),(-.35,.35,.65),32),
 ('I05','단순 스티어링·대시',(.25,.65,1.30),(.15,.55,1.30),(-.40,-.50,1.02),42),
 ('I06','조수석 대시보드',(.10,.80,1.42),(.23,.72,1.40),(.47,-.65,1.10),38),
]
for sid,title,start,end,aim,lens in VIEWS:
    s=bpy.data.scenes.new(sid);WINDOW.scene=s;setup(s)
    s.world=bpy.data.worlds.new(sid+'_World');s.world.color=(.35,.35,.35)
    cube('Floor',(0,0,.13),(1.9,2.6,.16),DARK)
    cube('Dashboard_volume',(0,-.85,.97),(1.65,.50,.30))
    cube('Blank_center_console',(0,.0,.48),(.30,1.35,.26),DARK)
    for x in (-.48,.48):
        cube('Seat_base',(x,.45,.47),(.60,.68,.20))
        cube('Seat_back',(x,.81,.93),(.60,.18,.80))
        cube('Plain_door_volume',(x/abs(x)*.91,.0,.83),(.12,1.9,.65),LIGHT)
    # No vents, displays, radio, key cylinder, door pull, buttons, gaiter or gear lever.
    with bpy.context.temp_override(window=WINDOW,scene=s,view_layer=WINDOW.view_layer):
        bpy.ops.mesh.primitive_torus_add(major_radius=.20,minor_radius=.025,major_segments=32,minor_segments=8,location=(-.43,-.42,1.04),rotation=(math.radians(72),0,0))
        ring=WINDOW.view_layer.objects.active
    ring.name='Plain_steering_ring';ring.data.materials.append(DARK)
    dat=bpy.data.cameras.new(sid+'_Camera');dat.lens=lens;dat.clip_start=.02
    c=bpy.data.objects.new(sid+'_Camera',dat);s.collection.objects.link(c);s.camera=c
    animate(s,start,end,aim)
    records.append(dict(id=sid,title=title,classification='interior',frames=120,clip=sid+'/preview.mp4',start_frame=sid+'/start.png',mid_frame=sid+'/mid.png',end_frame=sid+'/end.png',camera_prompt='A small smooth camera slide across neutral cabin volumes. Every interior object is stationary. Use target-car interior photographs for every real control and trim detail.'))

for s in list(bpy.data.scenes):
    if s.name not in EXTERIOR+[v[0] for v in VIEWS]:bpy.data.scenes.remove(s)
for row in records:
    s=bpy.data.scenes[row['id']];WINDOW.scene=s
    for f in (1,60,120):
        s.frame_set(f)
        for o in s.objects:
            if o!=s.camera:assert not o.animation_data, o.name
    row.update(duration=2.0,motion_mode='camera_only',photos='target_exterior' if row['classification']=='exterior' else 'target_interior',prompt=row['camera_prompt'],description_ko='카메라만 천천히 이동합니다. 차량·바퀴·배경·실내 덩어리는 정지합니다.')
    (OUT/row['id']/'frames').mkdir(parents=True,exist_ok=True)
m=dict(revision='preset-camera-v001',width=1080,height=1920,fps=60,shots=records,geometry='Generic neutral cabin volumes; no target car mechanism is asserted.')
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'camera-presets.blend'))
result={'scene_count':len(records),'file':str(OUT/'camera-presets.blend'),'non_camera_animation':False}

