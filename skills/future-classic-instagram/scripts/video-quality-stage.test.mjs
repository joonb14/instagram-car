import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs/promises';import path from'node:path';import os from'node:os';import{spawnSync}from'node:child_process';import{fileURLToPath}from'node:url';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fc-motion-'));const file=path.join(dir,'input.png');const header=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(header);header.writeUInt32BE(13,8);header.write('IHDR',12);header.writeUInt32BE(1080,16);header.writeUInt32BE(1920,20);await fs.writeFile(file,header); // Metadata-only test fixture, not vehicle art
const tool=fileURLToPath(new URL('./generation-spend-ledger.mjs',import.meta.url)),ledger=path.join(dir,'ledger.json');let n=0;
const base={attemptKey:'test-low',provider:'Kling web',mediaType:'vehicle-video',generationStage:'motion-test',unit:'credits',inputFile:file,prompt:'Inside camera gently pans right from steering wheel to glovebox; parked car.',settings:{model:'fixture-model',resolution:'720p',aspectRatio:'9:16',seconds:5,outputs:1},cameraPlan:{position:'inside',startSubject:'steering',endSubject:'glovebox',movement:'right yaw',speed:'calm'},lowestAvailableResolution:'720p',availabilityEvidence:'Synthetic fixture:720p lowest, not an actual provider price claim',quotedCost:15,balanceBefore:{value:100,exact:true}};
async function run(command,record){const f=path.join(dir,`record-${n++}.json`);await fs.writeFile(f,JSON.stringify(record));return spawnSync(process.execPath,[tool,command,ledger,f],{encoding:'utf8'});}
test('new high-resolution camera tests, multi-output tests and missing phase are blocked',async()=>{
 assert.notEqual((await run('reserve',{...base,settings:{...base.settings,resolution:'1080p'}})).status,0);
 assert.notEqual((await run('reserve',{...base,settings:{...base.settings,outputs:2}})).status,0);
 assert.notEqual((await run('reserve',{...base,generationStage:undefined})).status,0);
});
test('production requires actual passed cheap test; changed camera must retest',async()=>{
 const prod={...base,attemptKey:'prod',generationStage:'production',productionOfAttemptKey:'test-low',settings:{...base.settings,resolution:'1080p'},quotedCost:25};
 assert.notEqual((await run('reserve',prod)).status,0);
 assert.equal((await run('reserve',base)).status,0);
 await run('reconcile',{attemptKey:'test-low',state:'completed',taskId:'TEST-NOT-A-REAL-JOB',confirmedDebit:15,motionReview:{status:'hold',reviewedAt:'fixture',notes:'Wrong movement'}});
 assert.notEqual((await run('reserve',prod)).status,0);
 await run('reconcile',{attemptKey:'test-low',state:'completed',motionReview:{status:'pass',reviewedAt:'fixture',notes:'Synthetic fixture assertion only; not real film review'}});
 assert.notEqual((await run('reserve',{...prod,cameraPlan:{...prod.cameraPlan,movement:'pullback'}})).status,0);
 assert.equal((await run('reserve',prod)).status,0);
});
test('explicit owner1080p override is preserved without false lowest-resolution evidence',async()=>{
 const record={...base,attemptKey:'owner-1080',settings:{...base.settings,model:'Kling3.0',resolution:'1080p',seconds:3},ownerQualityOverride:{resolution:'1080p',evidence:'Fixture owner request always1080p9:16, not actual provider evidence'}};
 const f=path.join(dir,'override.json');await fs.writeFile(f,JSON.stringify(record));
 const separateLedger=path.join(dir,'override-ledger.json');
 const result=spawnSync(process.execPath,[tool,'reserve',separateLedger,f],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const saved=JSON.parse(await fs.readFile(separateLedger,'utf8')).entries[0];
 assert.equal(saved.lowestAvailableResolution,'720p');assert.equal(saved.settings.resolution,'1080p');assert.equal(saved.ownerQualityOverride.resolution,'1080p');
});
test.after(async()=>{const absolute=path.resolve(dir),parent=path.resolve(os.tmpdir());if(path.dirname(absolute)!==parent||!path.basename(absolute).startsWith('fc-motion-'))throw Error('Unexpected fixture cleanup target');await fs.rm(absolute,{recursive:true,force:true});});
