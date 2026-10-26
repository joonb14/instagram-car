import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const [command,ledgerArg,recordArg]=process.argv.slice(2);
if(!['reserve','reconcile','summary'].includes(command)||!ledgerArg)throw Error('Usage: generation-spend-ledger.mjs reserve|reconcile|summary ledger.json [record.json]');
const ledgerPath=path.resolve(ledgerArg);await fs.mkdir(path.dirname(ledgerPath),{recursive:true});
const lock=ledgerPath+'.lock';let locked=false;
try{
 await fs.mkdir(lock);locked=true;
 let ledger;try{ledger=JSON.parse(await fs.readFile(ledgerPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;ledger={version:1,entries:[]};}
 const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 if(command==='reserve'){
  if(!recordArg)throw Error('Reservation record required');
  const r=JSON.parse(await fs.readFile(path.resolve(recordArg),'utf8'));
  for(const k of ['attemptKey','provider','unit','inputFile','prompt','settings','quotedCost','balanceBefore'])if(r[k]===undefined)throw Error('Missing '+k);
  if(r.quotedCost!==null&&(!Number.isFinite(r.quotedCost)||r.quotedCost<0))throw Error('Invalid quoted cost');
  const inputHashes=await Promise.all((r.inputFiles??[r.inputFile]).map(async file=>hash(await fs.readFile(path.resolve(file))))),inputHash=inputHashes[0],promptHash=hash(r.prompt);
  const sorted=x=>Array.isArray(x)?x.map(sorted):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sorted(x[k])])):x;
  if(r.provider==='Kling web'||r.mediaType==='vehicle-video'){
   if(r.provider==='Kling web'){
    if(r.settings?.aspectRatio!=='9:16')throw Error('Kling vehicle workflow requires explicit9:16; source/source crop is not an aspect-ratio approval');
    const start=await fs.readFile(path.resolve(r.inputFile));
    const png=Buffer.from([137,80,78,71,13,10,26,10]);
    if(start.length<33||!start.subarray(0,8).equals(png)||start.toString('ascii',12,16)!=='IHDR')throw Error('Verified1080x1920 portrait PNG Start Frame required before spending');
    const width=start.readUInt32BE(16),height=start.readUInt32BE(20);
    if(width!==1080||height!==1920)throw Error(`Actual Start Frame is ${width}x${height}; requires1080x1920 9:16 before spending`);
    r.startFrameGeometry={width,height,aspectRatio:'9:16',method:'Actual PNG IHDR bytes; geometry only, not visual QA'};
   }
   if(!['motion-test','production'].includes(r.generationStage))throw Error('Video generationStage required: low-resolution motion-test before production');
   for(const key of ['position','startSubject','endSubject','movement','speed'])if(!r.cameraPlan?.[key]?.trim())throw Error('Missing cameraPlan.'+key);
   if(r.generationStage==='motion-test'){
    if(r.settings.outputs!==1)throw Error('Motion test must request exactly one output');
    const qualityOverride=r.ownerQualityOverride?.resolution===r.settings.resolution&&typeof r.ownerQualityOverride?.evidence==='string'&&r.ownerQualityOverride.evidence.trim();
    if(!qualityOverride&&(!r.lowestAvailableResolution||!r.availabilityEvidence||r.settings.resolution!==r.lowestAvailableResolution))throw Error('Motion test must use observed lowest available resolution or explicit owner quality override with evidence');
   }else{
    const test=ledger.entries.find(e=>e.attemptKey===r.productionOfAttemptKey);
    if(!test||test.generationStage!=='motion-test'||test.state!=='completed'||!test.taskId||test.motionReview?.status!=='pass'||!test.motionReview.reviewedAt||!test.motionReview.notes)throw Error('Production requires an actual completed and visually passed motion-test task');
    if(test.inputHash!==inputHash||test.settings.model!==r.settings.model||JSON.stringify(sorted(test.cameraPlan))!==JSON.stringify(sorted(r.cameraPlan)))throw Error('Input, model or camera plan changed: run a new low-resolution motion test first');
   }
  }
  const fingerprint=hash(JSON.stringify({provider:r.provider,inputHashes,promptHash,settings:sorted(r.settings)}));
  if(ledger.entries.some(e=>['reserved','uncertain'].includes(e.state)))throw Error('Unresolved submission; reconcile real provider history before any new request');
  if(ledger.entries.some(e=>e.attemptKey===r.attemptKey))throw Error('Duplicate attempt key blocked');
  if(ledger.entries.some(e=>e.fingerprint===fingerprint)&&!r.retryReason)throw Error('Duplicate request blocked; an intentional retry needs a specific review reason');
  const entry={...r,inputHash,inputHashes,promptHash,fingerprint,state:'reserved',reservedAt:new Date().toISOString(),taskId:null,confirmedDebit:null,tokenUsage:null};
  delete entry.prompt;ledger.entries.push(entry);
 }else if(command==='reconcile'){
  const r=JSON.parse(await fs.readFile(path.resolve(recordArg),'utf8'));const e=ledger.entries.find(x=>x.attemptKey===r.attemptKey);if(!e)throw Error('Unknown attempt');
  if(!['submitted','uncertain','not-submitted','completed','rejected','refunded'].includes(r.state))throw Error('Invalid state');
  if(['submitted','completed','rejected','refunded'].includes(r.state)&&!r.taskId&&!e.taskId)throw Error('Observed provider task ID required');
  if(r.taskId&&ledger.entries.some(x=>x.attemptKey!==r.attemptKey&&x.taskId===r.taskId))throw Error('Provider task already assigned to another intent');
  Object.assign(e,r,{reconciledAt:new Date().toISOString()});
 }
 if(command!=='summary'){const tmp=ledgerPath+'.tmp';await fs.writeFile(tmp,JSON.stringify(ledger,null,2));await fs.rename(tmp,ledgerPath);}
 const totals={};for(const e of ledger.entries){const k=e.provider+'/'+e.unit;totals[k]??={quoted:0,unknownQuoted:0,confirmedDebit:0,unconfirmed:0};if(e.state!=='not-submitted'){if(typeof e.quotedCost==='number')totals[k].quoted+=e.quotedCost;else totals[k].unknownQuoted++;}if(typeof e.confirmedDebit==='number')totals[k].confirmedDebit+=e.confirmedDebit;else if(e.state!=='not-submitted')totals[k].unconfirmed++;}
 console.log(JSON.stringify({entries:ledger.entries.map(e=>({attemptKey:e.attemptKey,state:e.state,taskId:e.taskId})),totals,note:'Local intent/accounting only; unavailable token usage remains null; real provider reconciliation required'},null,2));
}finally{if(locked)await fs.rmdir(lock);}
