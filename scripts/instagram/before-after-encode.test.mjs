import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import {spawn,spawnSync} from 'node:child_process';import {createBeforeAfter,orderedShots,assembleBeforeAfter} from './before-after-workflow.mjs';
const ff=process.env.FFMPEG || 'ffmpeg';
const available=spawnSync(ff,['-version'],{stdio:'ignore'}).status===0;
const run=args=>new Promise((resolve,reject)=>{const p=spawn(ff,args);let err='';p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',code=>code?reject(Error(err)):resolve());});
test('paired assembly encodes alternating clips at equal duration with fade and refuses overwrite',{skip:!available},async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fc-before-after-'));
 try{
  const m=createBeforeAfter('Test fixture',['front-half']);m.ffmpeg=ff;m.edit.secondsPerShot=1;
  for(const [i,s]of orderedShots(m).entries()){
   const file=path.join(dir,s.id+'.mp4');
   await run(['-v','error','-f','lavfi','-i','color=c='+(i?'blue':'red')+':s=1080x1920:r=24:d=3','-c:v','libx264','-preset','ultrafast','-threads','2','-pix_fmt','yuv420p',file]);
   const sha256=crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
   m.clips.push({sourceId:s.id,file,sha256,duration:3,review:{status:'pass',notes:'Synthetic encode test, not vehicle visual approval'},wiperReview:{status:'pass',visibility:'absent-in-original',reviewedSha256:sha256,originalReferences:[file],notes:'Synthetic solid-color fixture has no vehicle or wipers',samples:[0,1,2].map(timeSeconds=>({timeSeconds,status:'pass',notes:'Generated solid-color frame contains no wipers'}))}});
  }
  const out=path.join(dir,'paired.mp4'),r=await assembleBeforeAfter(m,dir,out);
  assert.deepEqual(r.order,['front-half-before','front-half-after']);assert.ok(Math.abs(r.metadata.duration-2)<.042);assert.equal(r.metadata.width,1080);
  await assert.rejects(()=>assembleBeforeAfter(m,dir,out),/exists/);
 }finally{if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir()))throw Error('Invalid cleanup root');await fs.rm(dir,{recursive:true,force:true});}
});
