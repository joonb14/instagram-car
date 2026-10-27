import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {reviewElementWorkflow} from './review-element-workflow.mjs';
test('six selected sources with real binding; seventh clip may reuse wide source',async()=>{
 const d=await fs.mkdtemp(path.join(os.tmpdir(),'fc-element-'));
 try{
 const p=path.join(d,'image');await fs.writeFile(p,'fixture');
 const sha256=crypto.createHash('sha256').update('fixture').digest('hex');
 const sources=['front-half','front-low','rear-three-quarter','whole-car','hood-emblem','hood-emblem-grille'].map(role=>({id:role,role,path:p,sha256,selectionEvidence:'owner selected composition',identityReview:{status:'pass',evidence:'fixture only'}}));
 const c={startSourceId:'whole-car',elementName:'E30_325iX',bindingEvidence:'observed picker chip',model:'Kling3.0',duration:3,resolution:'1080p',aspectRatio:'9:16',outputs:1,multiShot:false,nativeAudio:false,prompt:'The camera slowly arcs. The car remains parked.'};
 const m={profile:'owner-six-source-element',sources,element:{name:'E30_325iX',registrationEvidence:'observed owner-created element',sourceIds:['whole-car','front-low']},clips:Array.from({length:7},()=>({...c}))};
 assert.equal((await reviewElementWorkflow(m)).valid,true);
 m.clips[0].bindingEvidence='';assert.equal((await reviewElementWorkflow(m)).valid,false);m.clips[0].bindingEvidence='observed chip';
 m.sources[0].identityReview.status='hold';assert.equal((await reviewElementWorkflow(m)).valid,false);m.sources[0].identityReview.status='pass';
 await fs.writeFile(p,'changed');assert.ok((await reviewElementWorkflow(m)).errors.some(e=>e.includes('hash')));
 }finally{await fs.rm(d,{recursive:true,force:true});}
});
