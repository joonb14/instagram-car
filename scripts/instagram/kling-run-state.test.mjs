import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,reserveJob,acknowledgeJob,checkJob,reviewJob,due} from './kling-run-state.mjs';
const settings={model:'Kling3.0',seconds:3,resolution:'1080p',aspectRatio:'9:16',outputs:1,nativeAudio:false,multiShot:false};
const input=id=>({shotId:id,inputHash:'hash-'+id,prompt:'one reviewed camera move',elementName:'YJ',bindingEvidence:'Actual picker chip inspected',inputReviewed:true,elementReviewed:true,quotedCredits:24,settings});
const qa={status:'fail',file:'result.mp4',sha256:'actual-file-hash',notes:'Camera moved but vehicle slipped relative to nearby asphalt',samples:[0,1.5,2.99]};
test('preflight rejects wrong price, audio, missing tag and duplicate pending jobs',()=>{
 for(const changed of [{quotedCredits:36},{settings:{...settings,nativeAudio:true}},{bindingEvidence:''}])assert.throws(()=>reserveJob(createRun('explicit owner four-shot test'),{...input('a'),...changed},0));
 const r=createRun('authorized');reserveJob(r,input('a'),0);assert.throws(()=>reserveJob(r,input('b'),1));
});
test('polling is gated at five minutes and repeated generating checks reschedule',()=>{
 const r=createRun('authorized');reserveJob(r,input('a'),0);acknowledgeJob(r,'observed-job-id',0);
 assert.equal(due(r,299999).allowed,false);assert.equal(due(r,300000).allowed,true);
 assert.throws(()=>checkJob(r,'generating','seen in UI',299999));checkJob(r,'generating','seen in UI',300000);
 assert.equal(due(r,599999).allowed,false);assert.equal(due(r,600000).allowed,true);
});
test('acknowledged queue without a visible provider ID still blocks duplicates and schedules polling',()=>{
 const r=createRun('authorized');reserveJob(r,input('a'),0);
 acknowledgeJob(r,null,0,'New matching card visibly says In the queue; composer cleared');
 assert.equal(due(r,300000).allowed,true);assert.equal(r.jobs[0].taskId,null);
 assert.throws(()=>reserveJob(r,input('b'),10));
});
test('review precedes next photo; failed photo is not retried; four-attempt stop persists',()=>{
 const r=createRun('authorized');
 for(let i=0;i<4;i++){
  const now=i*400000;reserveJob(r,input('shot'+i),now);acknowledgeJob(r,'job'+i,now);checkJob(r,'completed','Actual completed card',now+300000);
  assert.throws(()=>reserveJob(r,input('next'),now+300001));reviewJob(r,qa);
  assert.throws(()=>reserveJob(r,input('shot'+i),now+300002));
 }
 assert.throws(()=>reserveJob(r,input('fifth'),2000000));assert.equal(due(r,2000000).reason,'owner-feedback-required');
});
