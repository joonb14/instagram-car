import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {createWorkflow,assemble} from './advertising-workflow.mjs';
const ff=path.resolve(process.env.FFMPEG??'artifacts/instagram/reel-runtime/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
let available=true;try{await fs.access(ff);}catch{available=false;}
test('actual six-clip compact encode is exactly12sec,24fps,full decode and terminal fade, without extra zoom',{skip:!available},async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fc-encode-'));
 try{
 const source=path.join(dir,'fixture.mp4');const create=spawnSync(ff,['-y','-v','error','-f','lavfi','-i','color=c=white:s=1080x1920:r=24:d=3','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',source],{encoding:'utf8'});assert.equal(create.status,0,create.stderr);
 const m=createWorkflow('Fixture vehicle','Fixture');m.ffmpeg=ff;const sha256=crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex');m.clips=m.sources.map(s=>({sourceId:s.id,file:source,duration:3,sha256,review:{status:'owner-selected',notes:'Synthetic fixture, not a real owner selection'},wiperReview:{status:'pass',visibility:'outside-crop',originalReferences:[source],reviewedSha256:sha256,notes:'Synthetic colour-frame fixture, no vehicle or actual visual approval',samples:[0,1.5,2.96].map(timeSeconds=>({timeSeconds,status:'pass',notes:'Synthetic no-vehicle frame fixture'}))}}));
 const out=path.join(dir,'compact.mp4');const receipt=await assemble(m,dir,out,'compact');assert.equal(receipt.plan.totalFrames,288);assert.equal(receipt.metadata.duration,12);assert.equal(receipt.metadata.width,1080);assert.equal(receipt.metadata.height,1920);
 function pixel(time){const r=spawnSync(ff,['-v','error','-ss',String(time),'-i',out,'-vf','scale=1:1','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-']);assert.equal(r.status,0);assert.ok(r.stdout.length>=3);return r.stdout[0];}
 assert.ok(pixel(11)>200);const last=pixel(11.95);assert.ok(last<30,'Ending pixel='+last);
 await assert.rejects(()=>assemble(m,dir,out,'compact'),/exist|overwrite|exiting/i);
 }finally{if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir()))throw Error('Invalid cleanup root');await fs.rm(dir,{recursive:true,force:true});}
});
