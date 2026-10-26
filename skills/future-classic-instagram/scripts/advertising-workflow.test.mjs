import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkflow,reviewStructure,buildPrompt,buildImagePrompt,buildEditPlan,validateAssets,main,reviewCameraPlans,reviewMarkLayouts} from './advertising-workflow.mjs';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
test('front mark layout requires original mounting evidence and explicit crop accounting',()=>{const m={sources:[{id:'front-half',markLayout:{status:'pass'}}]};assert.equal(reviewMarkLayouts(m).valid,false);m.sources[0].markLayout={status:'pass',originalReferences:['original-front.png'],centerlineEvidence:'Grille midpoint and paired lamp centers compared with original',perspectiveNotes:'Oblique projection, not equal screen x',plate:{sourceMount:'original centered front bumper bracket',visibility:'partial',cropEvidence:'right portion enters left frame edge; no relocation'},hoodEmblem:{presence:'absent-in-original',placementEvidence:'Original Jeep hood has no hood crest'},grilleLogo:{presence:'absent-in-original',placementEvidence:'Do not invent a grille badge'},reviewNotes:'Checked source and rendered crop manually'};assert.equal(reviewMarkLayouts(m).valid,true);m.sources[0].markLayout.plate.visibility='outside-crop';m.sources[0].markLayout.plate.cropEvidence='';assert.equal(reviewMarkLayouts(m).valid,false);assert.ok(buildImagePrompt(createWorkflow('Car','Car'),{composition:'front half'}).includes('physical vehicle centerline'));});
test('camera direction includes a reference frame, endpoint and excluded parts; custom prompt survives',()=>{const m=createWorkflow('Car','Car');assert.equal(reviewCameraPlans(m).valid,false);for(const s of m.sources)s.cameraPlan={referenceFrame:'starting camera viewpoint',direction:'left toward frontal centerline',startView:'front corner',endView:'frontal half',keepHidden:['wheel cap']};assert.equal(reviewCameraPlans(m).valid,true);m.sources[0].videoPrompt='The camera moves LEFT toward the frontal centerline.';assert.equal(buildPrompt(m,m.sources[0]),m.sources[0].videoPrompt);});
test('general profile supports optional pillar details and a non-side closing without fixed six roles',()=>{
 const ids=['front-half','front-low','rear-three-quarter','whole-car','wheel-detail','c-pillar','roofline'];
 const m=createWorkflow('Source verified car','Car',{sourceIds:ids});
 assert.deepEqual(m.sources.map(s=>s.id),ids);assert.equal(m.sources.at(-1).id,'roofline');
 assert.equal(reviewStructure(m).valid,true);assert.equal(m.sources.find(s=>s.id==='c-pillar').kind,'detail');
 assert.throws(()=>createWorkflow('Car','Car',{sourceIds:['invented']}),/Unknown/);
});
test('six source template selects four complementary exteriors without logo macro',()=>{
 const m=createWorkflow('1989 BMW E30 325iX','E30_325i');assert.equal(m.sources.length,6);assert.equal(m.element.sourceIds.length,4);
 assert.ok(m.element.sourceIds.every(id=>m.sources.find(s=>s.id===id).kind==='exterior'));
 assert.equal(m.vehicle,'1989 BMW E30 325iX');assert.equal(m.element.name,'E30_325i');
 assert.equal(m.generation.model,'Kling3.0');assert.equal(m.generation.seconds,3);
 assert.equal(m.generation.submissionOwner,'user-manual');
});
test('bad Element membership, duplicate IDs and unexpected generation settings fail',()=>{
 let m=createWorkflow('Vehicle','Vehicle');assert.equal(reviewStructure(m).valid,true);
 m.element.sourceIds[3]=m.element.sourceIds[0];assert.equal(reviewStructure(m).valid,false);
 m=createWorkflow('Vehicle','Vehicle');m.element.sourceIds[0]='hood-emblem';assert.equal(reviewStructure(m).valid,false);
 m=createWorkflow('Vehicle','Vehicle');m.sources[1].id=m.sources[0].id;assert.equal(reviewStructure(m).valid,false);
 m=createWorkflow('Vehicle','Vehicle');m.generation.seconds=5;assert.equal(reviewStructure(m).valid,false);
});
test('camera motion comes first; actual Element name is separate; no fade or light ignition default',()=>{
 const m=createWorkflow('BMW325iX','E30_325i');const p=buildPrompt(m,m.sources.at(-1));
 assert.ok(p.startsWith('The camera'));assert.ok(p.includes('@E30_325i'));assert.ok(p.includes('remain off'));
 assert.ok(p.includes('car and wheels remain stationary'));assert.ok(p.includes('no fading'));
 assert.ok(!p.includes('fixed camera'));
 const image=buildImagePrompt(m,m.sources[0]);assert.ok(image.includes('original mark crops'));assert.ok(image.includes('1080x1920'));assert.ok(image.includes('Do not invent'));
});
test('Element readiness cannot be inferred from typed name or selected images',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fc-element-ready-'));
 try{const file=path.join(dir,'manifest.json');await fs.writeFile(file,JSON.stringify(createWorkflow('Vehicle','Typed_Name')));const r=await main(['check-element',file]);assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.includes('picker binding')));}finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('all trim options retain1x speed and three second closing, no zoom, fade only at end',()=>{
 const m=createWorkflow('Vehicle','Vehicle');m.clips=m.sources.map(s=>({sourceId:s.id,file:s.id+'.mp4',duration:3,review:{status:'owner-selected',notes:'supplied by owner'}}));
 for(const [v,total]of [['native',18],['balanced',15.5],['compact',12]]){
 const p=buildEditPlan(m,v);assert.equal(p.totalFrames,total*24);assert.equal(p.clips.at(-1).frames,72);assert.equal(p.zoom,false);assert.equal(p.speed,1);assert.equal(p.fadeSeconds,.8);
 assert.ok(p.clips.every(c=>c.start>=0&&c.start+c.frames/24<=3));
 }
});
test('short clips, unknown sequence and implicit speed change are rejected',()=>{
 const m=createWorkflow('Vehicle','Vehicle');m.clips=[{sourceId:'front-half',duration:1}];
 assert.throws(()=>buildEditPlan(m,'compact'),/short|duration|clip/i);
 assert.throws(()=>buildEditPlan(m,'unknown'),/variant/i);
});
test('asset validation checks actual hashes and review evidence; selection is not image QA',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fc-workflow-'));
 try{
 const f=path.join(dir,'fixture.png');await fs.writeFile(f,'image bytes');
 const m=createWorkflow('Vehicle','Vehicle');m.sources=[{id:'a',file:f,sha256:crypto.createHash('sha256').update('image bytes').digest('hex'),review:{status:'hold',notes:'not reviewed'}}];
 assert.equal((await validateAssets(m,dir,'images',{probe:async()=>({width:1080,height:1920})})).valid,false);
 m.sources[0].review={status:'pass',notes:'visual source comparison fixture'};
 m.sources[0].wiperReview={status:'pass',visibility:'outside-crop',originalReferences:[f],notes:'Synthetic validator fixture only; no actual vehicle image reviewed',reviewedSha256:m.sources[0].sha256};
 assert.equal((await validateAssets(m,dir,'images',{probe:async()=>({width:1080,height:1920})})).valid,true);
 await fs.writeFile(f,'changed');assert.equal((await validateAssets(m,dir,'images',{probe:async()=>({width:1080,height:1920})})).valid,false);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
