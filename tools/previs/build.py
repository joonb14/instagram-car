"""Run through verified Blender MCP. Creates independent scenes, never overwrites source.

exec(compile(Path(...).read_text(), str(path), 'exec'), {'__file__':str(path)})
"""
import bpy, math, json, sys, hashlib, importlib
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(Path(__file__).parent))
import shots as shot_library
importlib.reload(shot_library)
from shots import get_shots, SOURCES
OUT=ROOT/'.local/previs/modular-car-v001'
OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'.local/previs/exterior-30s-v004/exterior-30s.blend'
FPS=60
def material(name,color):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color=(*color,1); return m
BLUE=material('Proxy_car_blue',(.30,.58,.80)); GRAY=material('Set_gray',(.49,.51,.53))
DARK=material('Interior_dark_gray',(.105,.125,.15)); BLACK=material('Rubber_black',(.022,.028,.036))
LIGHT=material('Warm_lens',(.94,.85,.6)); RED=material('Tail_lamp',(.65,.05,.035))
METAL=material('Metal',(.55,.61,.66)); HAND=material('Action_hand_orange',(.96,.40,.13))
PALE=material('Person_shirt',(.75,.76,.78)); WHITE=material('Road_marking',(.78,.79,.80))
def link(o):
    bpy.context.scene.collection.objects.link(o);return o
def empty(name,loc=(0,0,0),parent=None):
    o=link(bpy.data.objects.new(name,None));o.location=loc;o.parent=parent;return o
def cube(name,loc,dim,mat=GRAY,parent=None,bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name
    o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat);o.parent=parent
    if bevel:
        m=o.modifiers.new('Soft_edges','BEVEL');m.width=bevel;m.segments=2
        o.modifiers.new('Normals','WEIGHTED_NORMAL')
    return o
def uv(name,loc,scale,mat=HAND,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat);o.parent=parent
    for p in o.data.polygons:p.use_smooth=True
    return o
def cyl(name,loc,r,depth,mat=METAL,parent=None,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(mat);o.rotation_euler=rot;o.parent=parent
    for p in o.data.polygons:p.use_smooth=True
    return o
def rod(name,a,b,r,mat=GRAY,parent=None):
    a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(b-a).length,mat,parent);o['base_length']=(b-a).length;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
def torus(name,loc,major,minor,mat=METAL,rot=(0,0,0),parent=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=8,location=loc,major_radius=major,minor_radius=minor)
    o=bpy.context.object;o.name=name;o.data.materials.append(mat);o.rotation_euler=rot;o.parent=parent;return o
def key(o,prop,f):o.keyframe_insert(data_path=prop,frame=f)
def linear(o):
    if o.animation_data and o.animation_data.action:
        for layer in o.animation_data.action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for fc in bag.fcurves:
                        for k in fc.keyframe_points:k.interpolation='LINEAR'
def smooth(t):return t*t*(3-2*t)
def mix(a,b,t):return Vector(a).lerp(Vector(b),t)
def interp(t,points):
    for (ta,a),(tb,b) in zip(points,points[1:]):
        if t<=tb:return a+(b-a)*smooth(max(0,min(1,(t-ta)/(tb-ta))))
    return points[-1][1]
def hand(name,loc=(0,0,0),parent=None):
    """Articulated glove proxy, orange marks motion only; not human appearance."""
    root=empty(name,loc,parent)
    uv(name+'_palm',(0,0,0),(.047,.068,.027),HAND,root)
    for i in range(4):
        x=(i-1.5)*.025
        rod(name+'_finger',(x,-.035,0),(x,-.09,-.025),.012,HAND,root)
        rod(name+'_tip',(x,-.09,-.025),(x,-.078,-.055),.011,HAND,root)
    rod(name+'_thumb',(-.041,.015,0),(-.064,-.035,-.025),.017,HAND,root)
    rod(name+'_forearm',(0,.04,0),(0,.42,.02),.038,HAND,root)
    return root
def camera(scene,loc,aim,lens):
    dat=bpy.data.cameras.new(scene.name+'_Camera');o=link(bpy.data.objects.new(scene.name+'_Camera',dat));dat.lens=lens;dat.clip_start=.02;dat.clip_end=1000
    o.location=loc;o.rotation_euler=(Vector(aim)-o.location).to_track_quat('-Z','Y').to_euler();scene.camera=o;return o
def setup(s):
    s.render.engine='BLENDER_WORKBENCH';s.render.resolution_x=1080;s.render.resolution_y=1920;s.render.resolution_percentage=100;s.render.fps=FPS
    s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.film_transparent=False
    s.display.shading.light='STUDIO';s.display.shading.studiolight_rotate_z=.4;s.display.shading.color_type='MATERIAL'
    s.display.shading.show_shadows=True;s.display.shading.show_cavity=True;s.display.shading.cavity_type='BOTH';s.display.shading.curvature_ridge_factor=1.25;s.display.shading.curvature_valley_factor=1.1
    s.display.shading.show_specular_highlight=True;s.display.shading.background_type='WORLD';s.world=bpy.data.worlds.new(s.name+'_world');s.world.color=(.28,.31,.35)
    s.view_settings.view_transform='Standard';s.display.render_aa='8';s.render.fps_base=1
    s['authorship']='Direct-authored generic car and interaction blocking. Not BMW or Porsche CAD.'
def road():
    cube('Road_right_lane',(2,-50,-.055),(8,240,.1),GRAY,bevel=0)
    cube('Ground',(0,-50,-.12),(100,250,.1),material('Ground_gray',(.31,.33,.34)),bevel=0)
    for y in range(-165,70,12):cube('Lane_boundary',(2,y,.003),(.10,4,.006),WHITE,bevel=0)
    for x in [-2,6]:
        cube('Road_edge',(x,-50,.003),(.09,240,.006),WHITE,bevel=0)
        # Flush road edges keep wheels readable from either side camera.
def parked_set():
    cube('Concrete_ground',(0,0,-.06),(25,25,.1),GRAY,bevel=0)
    cube('Plain_wall',(3,0,2),(.15,20,4),material('Wall_gray',(.54,.54,.53)),bevel=0)
    for y in range(-8,9,2):cube('Ground_joint',(0,y,-.003),(7,.015,.008),DARK,bevel=0)
TEMPLATE=bpy.data.scenes.get('approach_flush')
if TEMPLATE is None:
    with bpy.data.libraries.load(str(SOURCE),link=False) as (src,dst):dst.scenes=['approach_flush']
    TEMPLATE=dst.scenes[0]
TROOT=next(o for o in TEMPLATE.objects if o.name.startswith('Car_travel'))
def car():
    source=[TROOT]+list(TROOT.children_recursive);mapping={}
    for o in source:
        n=o.copy();n.animation_data_clear()
        if o.data:n.data=o.data.copy()
        link(n);mapping[o]=n
    for o,n in mapping.items():
        n.parent=mapping.get(o.parent);n.matrix_parent_inverse=Matrix.Identity(4)
    root=mapping[TROOT];root.location=(0,0,0);root.rotation_euler=(0,0,0);root.name='Car_travel'
    wheels=[n for o,n in mapping.items() if o.name.startswith('Wheel.')]
    for w in wheels:w.rotation_mode='ZYX';w.rotation_euler=(0,math.pi/2,0)
    for n in mapping.values():
        if n.name.startswith(('Body','Roof')):n.data.materials.clear();n.data.materials.append(BLUE)
    # Subtle rear lights and exhaust distinguish front/rear in minimal geometry.
    for x in [-.59,.59]:cube('Tail_lamp',(x,2.132,.80),(.48,.035,.15),RED,root)
    cube('Rear_bumper',(0,2.15,.46),(1.7,.09,.10),BLACK,root)
    cube('Front_grille',(0,-2.14,.67),(.72,.035,.16),BLACK,root)
    cyl('Exhaust',(-.58,2.19,.27),.05,.20,BLACK,root,(math.pi/2,0,0))
    return root,wheels,mapping
def driving(s,shot):
    s.display.shading.show_shadows=False
    if shot['id'] in ['A09','B04']:shot['lens']*=.75
    if shot['id'] in ['A01','A03','A11','A12']:
        for suffix in ['0','1']:
            aim=Vector(shot['aim'+suffix]);shot['cam'+suffix]=list(aim+(Vector(shot['cam'+suffix])-aim)*1.25)
    road();root,wheels,_=car();cam=camera(s,shot['cam0'],shot['aim0'],shot['lens']);n=shot['frames']
    speed=8.0;s['speed_m_s']=speed;s['tire_radius_m']=.32
    for f in range(1,n+1):
        t=(f-1)/max(1,n-1);d=speed*(f-1)/FPS;root.location=(0,-d,0);key(root,'location',f)
        for w in wheels:w.rotation_euler.z=d/.32;key(w,'rotation_euler',f)
        offset=Vector((0,-d,0));cam.location=mix(shot['cam0'],shot['cam1'],t)+offset
        cam.rotation_euler=(mix(shot['aim0'],shot['aim1'],t)+offset-cam.location).to_track_quat('-Z','Y').to_euler()
        key(cam,'location',f);key(cam,'rotation_euler',f)
    for o in [root,cam]+wheels:linear(o)
    shot['wheel_physics']={'speed_m_s':speed,'radius_m':.32,'angle_per_frame_rad':speed/FPS/.32,'rotation_mode':'ZYX','wheel_axis':'local Z after Y=90 degrees','lane_center_x':0,'divider_x':2}
def interior_console():
    cube('Console',(0,0,.40),(.40,1.15,.36),DARK)
    for x in [-.54,.54]:
        cube('Seat_base',(x,.15,.38),(.53,.8,.2),BLACK,bevel=.08)
        cube('Seat_back',(x,.56,.77),(.53,.20,.75),DARK,bevel=.07)
    cube('Dashboard',(0,-.75,.92),(1.55,.24,.5),DARK)
    cube('Radio_slot',(0,-.617,1.0),(.33,.025,.11),BLACK)
    cube('Gear_boot',(0,-.27,.62),(.25,.30,.09),BLACK,bevel=.035)
    gear=empty('Gear_pivot',(0,-.27,.64));rod('Gear_shaft',(0,0,0),(0,0,.20),.022,METAL,gear)
    uv('Gear_knob',(0,0,.22),(.048,.048,.06),BLACK,gear)
    brake=empty('Handbrake_pivot',(.14,.35,.60));rod('Handbrake_lever',(0,0,0),(0,-.36,.10),.025,BLACK,brake)
    cyl('Handbrake_button',(.0,-.37,.103),.017,.028,METAL,brake,(math.pi/2,0,0))
    return gear,brake
def panel_set():
    panel=empty('Door_panel_hinge',(-.72,.12,.7))
    cube('Door_panel',(.72,0,-.02),(1.45,.08,.76),DARK,panel,.035)
    cube('Window_opening',(.72,.03,.58),(1.45,.018,.43),material('Outside_gray',(.68,.72,.75)),panel,0)
    cube('Door_top_rail',(.72,-.01,.37),(1.45,.09,.055),BLUE,panel)
    for z in [-.25,-.11,.03]:cube('Panel_seam',(.65,-.049,z),(1.23,.006,.009),BLACK,panel,.002)
    rod('Large_door_pull',(.97,-.14,-.2),(1.06,-.14,.21),.035,METAL,panel)
    rod('Pull_mount_low',(.97,0,-.2),(.97,-.14,-.2),.025,DARK,panel)
    rod('Pull_mount_high',(1.06,0,.21),(1.06,-.14,.21),.025,DARK,panel)
    cube('Latch_recess',(.40,-.06,.12),(.25,.035,.15),BLACK,panel)
    latch=empty('Latch_pivot',(.31,-.09,.13),panel)
    cube('Release_lever',(.09,0,0),(.18,.026,.055),METAL,latch)
    return panel,latch
def ignition_set():
    cube('Dashboard',(0,.10,1.03),(1.5,.25,.55),DARK)
    cube('Cluster_face',(-.10,-.04,1.15),(.82,.04,.24),BLACK)
    for x in [-.34,-.08,.17]:
        cyl('Gauge',(x,-.065,1.16),.09,.012,METAL,rot=(math.pi/2,0,0))
        cyl('Dial',(x,-.075,1.16),.079,.012,BLACK,rot=(math.pi/2,0,0))
        rod('Gauge_needle',(x,-.087,1.16),(x-.035,-.087,1.21),.003,LIGHT)
    torus('Steering_rim',(-.24,-.28,.91),.25,.025,BLACK,(math.pi/2,0,0))
    cube('Steering_hub',(-.24,-.28,.91),(.15,.08,.10),DARK)
    for a in [0,2.1,4.2]:rod('Steering_spoke',(-.24,-.28,.91),(-.24+math.sin(a)*.23,-.28,.91+math.cos(a)*.23),.014,BLACK)
    cyl('Ignition_cylinder',(.16,-.055,.90),.045,.045,METAL,rot=(math.pi/2,0,0))
    cube('Key_slot',(.16,-.082,.90),(.028,.01,.006),BLACK)
    k=empty('Ignition_key',(.16,-.10,.90))
    cube('Key_blade',(0,.035,0),(.012,.07,.006),METAL,k,.001)
    cube('Key_bow',(0,-.025,0),(.053,.065,.018),BLACK,k,.013)
    torus('Key_ring',(0,-.07,-.025),.022,.003,METAL,(math.pi/2,0,0),k)
    return k
def hollow_car(mapping,root):
    body=next(n for o,n in mapping.items() if o.name.startswith('Body'))
    cabin=next(n for o,n in mapping.items() if o.name.startswith('Cabin'))
    cabin.hide_render=True
    # Remove cabin volume from the block body; preserve original wheel arches.
    cutter=cube('Cabin_cut',(0,.12,1.0),(1.9,1.72,1.22),GRAY,bevel=0)
    bpy.context.view_layer.objects.active=body
    mod=body.modifiers.new('Open_cockpit','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
    cube('Cabin_floor',(0,.12,.42),(1.65,1.7,.10),BLACK,root)
    for x in [-.40,.4]:
        cube('Seat_base',(x,.15,.61),(.56,.62,.16),DARK,root,.06)
        cube('Seat_back',(x,.48,.91),(.56,.18,.59),DARK,root,.06)
    cube('Dash',(0,-.56,.96),(1.65,.25,.23),DARK,root)
    torus('Steering',(-.43,-.35,1.05),.18,.023,BLACK,(math.pi/2+.25,0,0),root)
    for x in [-.73,.73]:
        rod('A_pillar',(x,-.79,.96),(x*.83,-.395,1.5),.035,BLUE,root)
        rod('B_pillar',(x,.91,.95),(x*.83,.855,1.5),.04,BLUE,root)
    cube('Far_door',(.88,.1,.71),(.07,1.65,.48),BLUE,root)
    door=empty('Driver_door_hinge',(-.88,-.73,.72),root)
    cube('Driver_door',(0,.81,0),(.07,1.62,.49),BLUE,door)
    cube('Inner_door',(.042,.81,0),(.015,1.55,.42),DARK,door)
    rod('Window_top',(0,.32,.73),(0,1.57,.73),.024,BLUE,door)
    rod('Door_window_front',(0,0,.24),(0,.32,.73),.022,BLUE,door)
    rod('Door_window_back',(0,1.6,.24),(0,1.57,.73),.022,BLUE,door)
    cube('Exterior_handle',(-.052,1.31,.17),(.03,.18,.045),BLACK,door)
    cube('Interior_pull',(.1,.95,.12),(.06,.3,.035),METAL,door)
    return door
def actor_at_door(door):
    person=empty('Adult_proxy',(-1.85,.70,0))
    cube('Torso',(0,0,1.18),(.32,.4,.56),PALE,person,.09)
    uv('Head',(0,0,1.71),(.13,.12,.16),HAND,person)
    cube('Shorts',(0,0,.81),(.32,.37,.23),DARK,person,.045)
    for y in [-.12,.12]:
        rod('Leg',(0,y,.77),(0,y,.16),.065,HAND,person)
        cube('Shoe',(.06,y,.08),(.28,.12,.12),BLACK,person,.04)
    palm=hand('Door_hand',(-.11,1.31,.17),door);palm.rotation_euler=(0,math.pi/2,math.pi/2)
    for o in list(palm.children):
        if o.name.startswith('Door_hand_forearm'):bpy.data.objects.remove(o,do_unlink=True)
    # Main arm is an evaluated link between fixed shoulder and handle contact.
    arm=rod('Upper_arm',(-1.85,.50,1.37),(-1.2,.7,1),.055,PALE)
    lower=rod('Forearm',(-1.2,.7,1),(-1,.7,.9),.04,HAND)
    return person,palm,arm,lower
def interactions(s,shot):
    sid=shot['id'];n=shot['frames'];objs=[];action=None
    if sid in ['C01','C09']:
        parked_set();root,_,mp=car();door=hollow_car(mp,root);person,palm,arm,lower=actor_at_door(door)
        cam=camera(s,(-3.6,-.15,1.65),(-.65,.12,.88),30);base=cam.location.copy();aim=Vector((-.65,.12,.88))
        action='door'
    elif sid in ['C02','C08']:
        panel,latch=panel_set();aim=Vector((.08,0,.77)) if sid=='C02' else Vector((-.28,0,.81))
        cam=camera(s,(aim.x,-1.55,.96),aim,38 if sid=='C02' else 44);base=cam.location.copy()
        if sid=='C02':palm=hand('Door_pull_hand',(1.02,-.19,.02),panel)
        else:palm=hand('Latch_hand',(.12,-.05,0),latch)
        palm.rotation_euler=Vector((-.8,-.3,-.5)).to_track_quat('Y','Z').to_euler()
        action='panel'
    elif sid in ['C03','C04']:
        gear,brake=interior_console()
        if sid=='C03':
            cam=camera(s,(.38,.20,1.40),(0,-.23,.74),45);aim=Vector((0,-.23,.74));palm=hand('Shifter_hand',(.025,.015,.25),gear);palm.rotation_euler=(.55,-.25,-.4)
        else:
            cam=camera(s,(.12,.50,1.28),(.06,.04,.65),33);aim=Vector((.06,.04,.65));palm=hand('Brake_hand',(.045,-.28,.13),brake);palm.rotation_euler=(.1,0,-.95)
        base=cam.location.copy();action='console'
    elif sid in ['C05','C07']:
        k=ignition_set();cam=camera(s,(.25,-.85,1.04),(.11,-.04,1.0),35);base=cam.location.copy();aim=Vector((.11,-.04,1.0))
        palm=hand('Key_hand',(.025,-.05,.015),k);palm.rotation_euler=Vector((.7,-.3,-.6)).to_track_quat('Y','Z').to_euler();action='key'
    else:
        parked_set();car();cam=camera(s,(-3.5,5.0,1.05),(0,1.1,.82),45);base=cam.location.copy();aim=Vector((0,1.1,.82));action='idle'
    for f in range(1,n+1):
        t=(f-1)/max(1,n-1);sec=(f-1)/FPS
        if action=='door':
            a=interp(t,[(0,0),(.18,0),(.8,1.12),(1,1.12)])
            if sid=='C09':a=1.12-a
            door.rotation_euler.z=a;key(door,'rotation_euler',f)
            person.location=(-1.85-.20*a,.70-.42*a,0);key(person,'location',f)
            bpy.context.view_layer.update();p=palm.matrix_world.translation
            shoulder=person.location+Vector((0,-.2,1.38));elbow=(shoulder+p)/2+Vector((-.16,.05,-.08))
            for bone,start,end in [(arm,shoulder,elbow),(lower,elbow,p)]:
                delta=end-start;bone.location=(end+start)/2;bone.rotation_euler=delta.to_track_quat('Z','Y').to_euler();bone.scale.z=delta.length/bone['base_length']
                for prop in ['location','rotation_euler','scale']:key(bone,prop,f)
        elif action=='panel':
            if sid=='C02':panel.rotation_euler.z=interp(t,[(0,-.22),(.2,-.22),(.85,0),(1,0)])
            else:
                latch.rotation_euler.z=interp(t,[(0,0),(.25,0),(.65,-.35),(1,-.35)]);key(latch,'rotation_euler',f)
                panel.rotation_euler.z=interp(t,[(0,0),(.6,0),(1,-.16)])
            key(panel,'rotation_euler',f)
        elif action=='console':
            if sid=='C03':
                gear.rotation_euler.x=interp(t,[(0,0),(.2,.22),(.4,0),(.65,-.20),(.85,0),(1,0)])
                gear.rotation_euler.y=interp(t,[(0,0),(.15,-.16),(.35,-.16),(.52,.13),(.7,.13),(.85,0),(1,0)]);key(gear,'rotation_euler',f)
            else:brake.rotation_euler.x=interp(t,[(0,-.24),(.2,-.24),(.5,-.34),(.85,0),(1,0)]);key(brake,'rotation_euler',f)
        elif action=='key':
            if sid=='C05':
                k.location.y=interp(t,[(0,-.27),(.24,-.10),(1,-.10)])
                k.rotation_euler.y=interp(t,[(0,0),(.3,0),(.6,1.0),(.76,1.0),(.87,.5),(1,.5)])
            else:
                k.location.y=interp(t,[(0,-.10),(.65,-.10),(1,-.38)])
                k.rotation_euler.y=interp(t,[(0,.5),(.3,.5),(.55,0),(1,0)])
            key(k,'location',f);key(k,'rotation_euler',f)
        jitter=Vector((math.sin(sec*2.3)*.0025,math.sin(sec*1.7+.8)*.002,math.sin(sec*2.9)*.002))
        cam.location=base+jitter;cam.rotation_euler=(aim+jitter*.3-cam.location).to_track_quat('-Z','Y').to_euler();key(cam,'location',f);key(cam,'rotation_euler',f)
    shot['photo_adaptation_pending']=shot['classification']!='exterior'
    shot['contact_method']='Parented hand contact proxy on moving control; orange is action marker.'
    s['vehicle_speed_m_s']=0;s['interaction_proxy_only']=True
    for o in s.objects:linear(o)

shots=get_shots()
for shot in shots:
    name=shot['id']
    if name in bpy.data.scenes:bpy.data.scenes.remove(bpy.data.scenes[name])
    s=bpy.data.scenes.new(name);bpy.context.window.scene=s;setup(s)
    s.frame_start=1;s.frame_end=shot['frames'];s['source_in']=shot['source_in'];s['source_out']=shot['source_out'];s['camera_instruction']=shot['camera_prompt']
    folder=OUT/name;(folder/'frames').mkdir(parents=True,exist_ok=True);s.render.filepath=str(folder/'frames')+'/'
    if shot['kind']=='driving':driving(s,shot)
    else:interactions(s,shot)
    s.frame_set(1);shot.update(scene=name,clip=f'{name}/preview.mp4',start_frame=f'{name}/start.png',mid_frame=f'{name}/mid.png',end_frame=f'{name}/end.png',fps=FPS,width=1080,height=1920)
    print('BUILT',name,flush=True)
bpy.context.window.scene=bpy.data.scenes['C01']
for s in list(bpy.data.scenes):
    if s.name not in [a['id'] for a in shots]:bpy.data.scenes.remove(s)
blend=OUT/'modular-car.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend))
manifest={'revision':'modular-car-v001','fps':FPS,'width':1080,'height':1920,'silent':True,'authorship':'Existing directly authored generic car proxy adapted; new camera paths and simplified interior/hand geometry directly authored. No exact vehicle-identity claim.','source_model_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'blend_sha256':hashlib.sha256(blend.read_bytes()).hexdigest(),'sources':SOURCES,'source_rights':'Not established. Private reference analysis only. Source footage not included in generated clips.','user_visual_approval':False,'shots':shots}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
result={'path':str(blend),'scenes':len(shots),'frames':sum(s['frames'] for s in shots),'manifest':str(OUT/'manifest.json')}
