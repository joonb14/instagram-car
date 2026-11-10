"""Meaningful evaluated-scene checks, run in Blender without modifying the file."""
import bpy,math,json,hashlib
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
P=Path(bpy.data.filepath).parent
m=json.loads((P/'manifest.json').read_text(encoding='utf-8'))
checks=[]
for shot in m['shots']:
    s=bpy.data.scenes[shot['id']];bpy.context.window.scene=s
    assert (s.render.resolution_x,s.render.resolution_y,s.render.resolution_percentage)==(1080,1920,100)
    assert s.render.fps==60 and s.frame_end==shot['frames']
    roots=[o for o in s.objects if o.name.startswith('Car_travel')]
    wheels=[o for o in s.objects if o.name.startswith('Wheel.')]
    row={'id':shot['id'],'frames':s.frame_end,'samples':[]}
    for f in [1,round(s.frame_end*.25),round(s.frame_end*.5),round(s.frame_end*.75),s.frame_end]:
        s.frame_set(max(1,f));dg=bpy.context.evaluated_depsgraph_get();sample={'frame':s.frame_current}
        if roots:
            root=roots[0];sample['car_position']=list(root.location)
            expected_y=-8*(s.frame_current-1)/60 if shot['kind']=='driving' else 0
            assert abs(root.location.y-expected_y)<1e-4
            zmins=[]
            for w in wheels:
                ev=w.evaluated_get(dg);mesh=ev.to_mesh();zmin=min((ev.matrix_world@v.co).z for v in mesh.vertices);ev.to_mesh_clear();zmins.append(zmin)
                assert -.001<zmin<.004,(shot['id'],f,w.name,zmin)
                if shot['kind']=='driving':assert abs(w.rotation_euler.z-(-expected_y/.32))<1e-3
                else:assert abs(w.rotation_euler.z)<1e-6
            sample['tire_ground_min_z']=zmins
            if shot['id'] in ['A01','A03','A11','A12']:
                pts=[world_to_camera_view(s,s.camera,o.matrix_world@Vector(p)) for o in root.children_recursive if o.type=='MESH' for p in o.bound_box]
                bounds=[min(p.x for p in pts),max(p.x for p in pts),min(p.y for p in pts),max(p.y for p in pts)]
                sample['whole_car_bounds']=bounds
                assert bounds[0]>.015 and bounds[1]<.985 and bounds[2]>.02 and bounds[3]<.98,(shot['id'],f,bounds)
        if shot['id'] in ['C01','C09']:
            hand=next(o for o in s.objects if o.name.startswith('Door_hand') and o.type=='EMPTY')
            assert hand.parent.name.startswith('Driver_door_hinge')
        if shot['id']=='C03':assert next(o for o in s.objects if o.name.startswith('Shifter_hand') and o.type=='EMPTY').parent.name.startswith('Gear_pivot')
        if shot['id']=='C04':assert next(o for o in s.objects if o.name.startswith('Brake_hand') and o.type=='EMPTY').parent.name.startswith('Handbrake_pivot')
        row['samples'].append(sample)
    checks.append(row)
report={'blend_sha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),'checks':checks,'pass':True,'limits':'Evaluated geometric checks do not certify anatomy, exact reference match or perceptual wheel direction.'}
(P/'scene-verification.json').write_text(json.dumps(report,indent=2));print('SCENE VERIFIED',len(checks))
