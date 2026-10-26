import test from 'node:test';import assert from 'node:assert/strict';
import {createBeforeAfter,checkPlan,orderedShots,videoPrompt,checkImages} from './before-after-workflow.mjs';
test('arbitrary angle pairs alternate before after and use two independent Elements',()=>{
 const m=createBeforeAfter('Porsche',['front-half','c-pillar','rear-three-quarter','wheel-detail']);
 assert.equal(checkPlan(m).valid,true);
 const shots=orderedShots(m);assert.equal(shots.length,8);assert.deepEqual(shots.map(s=>s.stage),['before','after','before','after','before','after','before','after']);
 assert.ok(videoPrompt(m,shots[0]).includes('@Vehicle_Before'));assert.ok(!videoPrompt(m,shots[0]).includes('@Vehicle_After'));
 assert.ok(videoPrompt(m,shots[1]).includes('@Vehicle_After'));assert.ok(videoPrompt(m,shots[0]).includes('Do not repair'));
 m.elements.after.name=m.elements.before.name;assert.equal(checkPlan(m).valid,false);
});
test('mismatched stages, duplicated angles, missing selected pairs and absent readiness evidence fail',()=>{
 let m=createBeforeAfter('Car',['front-half']);m.pairs[0].before.stage='after';assert.equal(checkPlan(m).valid,false);
 m=createBeforeAfter('Car',['front-half','front-half']);assert.equal(checkPlan(m).valid,false);
 m=createBeforeAfter('Car',['front-half']);m.pairs[0].selected=false;assert.equal(checkPlan(m).valid,false);
 m=createBeforeAfter('Car',['front-half']);assert.equal(checkPlan(m,{ready:true}).valid,false);
});
test('direction and hidden wheel constraints reach prompts; duplicate state images cannot pass package checks',async()=>{const m=createBeforeAfter('Car',['front-half']);m.pairs[0].before.cameraPlan={referenceFrame:'camera viewpoint',direction:'LEFT toward frontal centerline',startView:'front corner',endView:'frontal half',keepHidden:['wheel crest']};const prompt=videoPrompt(m,orderedShots(m)[0]);assert.ok(prompt.startsWith('The camera slowly moves LEFT'));assert.ok(prompt.includes('Keep wheel crest hidden'));for(const stage of ['before','after'])m.elements[stage].references=[{id:stage,stage,kind:'exterior',sha256:'same'}];const r=await checkImages(m,'.');assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.includes('both Element states')));assert.ok(r.errors.some(e=>e.includes('description required')));});
