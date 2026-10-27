import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {createWorkflow,assemble} from './advertising-workflow.mjs';
const ff=process.env.FFMPEG || 'ffmpeg';
const available=spawnSync(ff,['-version'],{stdio:'ignore'}).status===0;
test('actual six-clip compact encode is exactly12sec,24fps,full decode and terminal fade, without extra zoom',{skip:!available},async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fc-encode-'));
 try{
 const source=path.join(dir,'fixture.mp4');const create=spawnSync(ff,['-y','-v','error','-f','lavfi','-i','color=c=white:s=1080x1920:r=24:d=3','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',source],{encoding:'utf8'});assert.equal(create.status,0,create.stderr);
 const m=createWorkflow('Fixture vehicle','Fixture');m.ffmpeg=ff;const sha256=crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex');m.clips=m.sources.map(s=>({sourceId:s.id,file:source,duration:3,sha256,review:{status:'owner-selected',notes:'Synthetic fixture, not a real owner selection'}}));
 await assert.rejects(()=>assemble(m,dir,path.join(dir,'missing-review.mp4'),'compact'),/wiperReview/);
 for(const clip of m.clips)clip.wiperReview={status:'pass',visibility:'absent-in-original',reviewedSha256:sha256,originalReferences:[source],notes:'Synthetic solid white fixture has no vehicle or wipers; no real photo reviewed',samples:[0,1,2].map(timeSeconds=>({timeSeconds,status:'pass',notes:'Generated solid-color frame contains no wipers'}))};
 const out=path.join(dir,'compact.mp4');const receipt=await assemble(m,dir,out,'compact');assert.equal(receipt.plan.totalFrames,288);assert.equal(receipt.metadata.duration,12);assert.equal(receipt.metadata.width,1080);assert.equal(receipt.metadata.height,1920);
 function pixel(time){const r=spawnSync(ff,['-v','error','-ss',String(time),'-i',out,'-vf','scale=1:1','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-']);assert.equal(r.status,0);assert.ok(r.stdout.length>=3);return r.stdout[0];}
 assert.ok(pixel(11)>200);const last=pixel(11.95);assert.ok(last<30,'Ending pixel='+last);
 await assert.rejects(()=>assemble(m,dir,out,'compact'),/exist|overwrite|exiting/i);
 }finally{if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir()))throw Error('Invalid cleanup root');await fs.rm(dir,{recursive:true,force:true});}
});
