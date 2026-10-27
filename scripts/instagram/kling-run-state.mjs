import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const required={model:'Kling3.0',seconds:3,resolution:'1080p',aspectRatio:'9:16',outputs:1,nativeAudio:false,multiShot:false};
const nonempty=x=>typeof x==='string'&&x.trim();
const last=r=>r.jobs.at(-1);
export function createRun(authorization){
 if(!nonempty(authorization))throw Error('Explicit owner generation authorization required');
 return {version:1,authorization,maxAttempts:4,expectedCredits:24,pollMs:300000,jobs:[]};
}
export function reserveJob(r,p,now=Date.now()){
 if(r.jobs.length>=r.maxAttempts)throw Error('Four attempts reached; wait for owner feedback');
 if(last(r)&&!last(r).review)throw Error('Previous job requires actual completion and video review');
 if(r.jobs.some(j=>j.inputHash===p.inputHash||j.shotId===p.shotId))throw Error('Use a different photo; immediate same-photo retry is not authorized');
 if(p.quotedCredits!==r.expectedCredits)throw Error('Expected exactly 24 credits; correct options first');
 for(const [k,v]of Object.entries(required))if(p.settings?.[k]!==v)throw Error('Wrong setting '+k);
 for(const k of ['shotId','inputHash','prompt','elementName','bindingEvidence'])if(!nonempty(p[k]))throw Error('Missing '+k);
 if(!p.inputReviewed||!p.elementReviewed)throw Error('Reviewed input and four-reference Element required');
 r.jobs.push({...p,state:'reserved',reservedAt:now,nextCheckAt:null,taskId:null});return last(r);
}
export function acknowledgeJob(r,taskId,now=Date.now(),evidence=''){
 const j=last(r);if(!j||j.state!=='reserved'||(!nonempty(taskId)&&!nonempty(evidence)))throw Error('Reserved intent and observed provider ID or actual queue acknowledgement required');
 j.taskId=taskId??null;j.acknowledgement=evidence;j.state='submitted';j.submittedAt=now;j.nextCheckAt=now+r.pollMs;return j;
}
export function due(r,now=Date.now()){
 const j=last(r);
 if(j&&!j.review){
  if(j.state==='reserved')return {allowed:false,reason:'reconcile-submission-do-not-duplicate'};
  if(j.state==='completed')return {allowed:false,reason:'download-and-review-required'};
  return {allowed:now>=j.nextCheckAt,reason:now>=j.nextCheckAt?'check-this-job-once':'wait',waitMs:Math.max(0,j.nextCheckAt-now),taskId:j.taskId};
 }
 return {allowed:false,reason:r.jobs.length>=r.maxAttempts?'owner-feedback-required':'prepare-next-different-photo'};
}
export function checkJob(r,status,evidence,now=Date.now()){
 if(!due(r,now).allowed)throw Error('Five-minute poll is not due');
 if(!['queued','generating','completed','failed'].includes(status)||!nonempty(evidence))throw Error('Actual observed status evidence required');
 const j=last(r);j.checks??=[];j.checks.push({at:now,status,evidence});j.state=status;j.nextCheckAt=status==='completed'||status==='failed'?null:now+r.pollMs;
 if(status==='failed')j.review={status:'provider-failed',notes:evidence};return j;
}
export function reviewJob(r,q){
 const j=last(r);if(j?.state!=='completed')throw Error('Actual completed video required before review');
 if(!['pass','fail'].includes(q.status)||!nonempty(q.file)||!nonempty(q.sha256)||!nonempty(q.notes)||new Set(q.samples??[]).size<3)throw Error('Video file/hash, start-middle-end samples and actual findings required');
 j.review=q;return j;
}
export async function main(args=process.argv.slice(2)){
 const [cmd,file,recordFile]=args;if(!file)throw Error('Usage: kling-run-state.mjs init|reserve|ack|check|review|due state.json [record.json]');
 const p=recordFile?JSON.parse(await fs.readFile(recordFile,'utf8')):null;
 const r=cmd==='init'?createRun(p?.authorization):JSON.parse(await fs.readFile(file,'utf8'));
 let result;
 if(cmd==='init')result=r;
 else if(cmd==='reserve')result=reserveJob(r,p);
 else if(cmd==='ack')result=acknowledgeJob(r,p?.taskId,p?.submittedAt?Date.parse(p.submittedAt):Date.now(),p?.evidence);
 else if(cmd==='check')result=checkJob(r,p?.status,p?.evidence,p?.checkedAt?Date.parse(p.checkedAt):Date.now());
 else if(cmd==='review')result=reviewJob(r,p);
 else if(cmd==='due')return due(r);
 else throw Error('Unknown command');
 if(cmd==='init')await fs.writeFile(file,JSON.stringify(r,null,2),{flag:'wx'});
 else {const temp=file+'.tmp';await fs.writeFile(temp,JSON.stringify(r,null,2));await fs.rename(temp,file);}
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(JSON.stringify(await main(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
