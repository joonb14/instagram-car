import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL('./generation-spend-ledger.mjs',import.meta.url));
// Metadata-only fixtures: not generated vehicle art or visual-QA evidence.
function pngHeader(w,h){const b=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.writeUInt32BE(13,8);b.write('IHDR',12);b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return b;}
async function reserve(w,h,aspect){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fc-portrait-'));try{const input=path.join(dir,'start.png');await fs.writeFile(input,pngHeader(w,h));const intent={attemptKey:'test',provider:'Kling web',unit:'credits',mediaType:'vehicle-video',generationStage:'motion-test',inputFile:input,prompt:'TEST ONLY',settings:{resolution:'1080p',aspectRatio:aspect,outputs:1},quotedCost:24,balanceBefore:{exact:null},ownerQualityOverride:{resolution:'1080p',evidence:'test fixture'},cameraPlan:{position:'test',startSubject:'test',endSubject:'test',movement:'test',speed:'test'}};const config=path.join(dir,'intent.json');await fs.writeFile(config,JSON.stringify(intent));return spawnSync(process.execPath,[cli,'reserve',path.join(dir,'ledger.json'),config],{encoding:'utf8'});}finally{await fs.rm(dir,{recursive:true,force:true});}}
test('source/source-crop aspect labels cannot silently authorize landscape',async()=>{for(const aspect of ['source','source crop','4:3']){const r=await reserve(1448,1086,aspect);assert.notEqual(r.status,0,'landscape setting must be blocked');assert.match(r.stderr,/9:16/);}});
test('a declared9:16 setting cannot hide actual landscape pixels',async()=>{const r=await reserve(1448,1086,'9:16');assert.notEqual(r.status,0);assert.match(r.stderr,/1080.*1920|portrait|9:16/);});
test('a near-portrait generated native image must be exported correctly first',async()=>{const r=await reserve(941,1672,'9:16');assert.notEqual(r.status,0);});
test('actual1080x1920 PNG with explicit9:16 remains accepted',async()=>{const r=await reserve(1080,1920,'9:16');assert.equal(r.status,0,r.stderr);});
