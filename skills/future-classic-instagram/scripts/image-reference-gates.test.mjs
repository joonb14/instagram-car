import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateReferences } from './validate-image-references.mjs';
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc-gates-'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
await fs.writeFile(path.join(root, 'source.bin'), 'fixture-source-not-visual-evidence');
await fs.writeFile(path.join(root, 'crop.bin'), 'fixture-crop-not-visual-evidence');
const record = () => ({identityMapRequired:false,stage:'prepared', vehicleSourceFile:'source.bin', inventoryReviewedAt:'test-only',inventoryNotes:'Synthetic integrity fixture, no actual visual pass.',inputFiles:['source.bin','crop.bin'],visibleMarks:[{id:'badge',detail:'test badge',sourceFile:'source.bin',sourceHash:hash('fixture-source-not-visual-evidence'),referenceFile:'crop.bin',referenceHash:hash('fixture-crop-not-visual-evidence'),crop:[1,1,5,5],legibility:'unresolved',reviewNotes:'No guessed lettering.'}]});
test('references must be real declared inputs; prompt-only reference is rejected', async () => {
  assert.equal((await validateReferences(record(),root)).ok,true);
  const r=record();r.inputFiles.pop();assert.equal((await validateReferences(r,root)).ok,false);
});
test('changed crops and guessed readable details are blocked', async () => {
  const r=record();r.visibleMarks[0].referenceHash='old';assert.equal((await validateReferences(r,root)).ok,false);
  const r2=record();r2.visibleMarks[0].legibility='readable';assert.equal((await validateReferences(r2,root)).ok,false);
});
test('submitted input audit requires observed submission evidence', async () => {
  const r=record();r.stage='submitted';assert.equal((await validateReferences(r,root)).ok,false);
  r.submissionId='TEST-NOT-A-REAL-JOB';r.submissionEvidence='Synthetic test call evidence';assert.equal((await validateReferences(r,root)).ok,true);
});
test('lamps OFF alone cannot pass; each surface and known reflection defect gate separately', async () => {
  const shot={id:'test',selectedForVideo:true,method:'generated',status:'pass',file:'source.bin',reviewedFileHash:hash('fixture-source-not-visual-evidence'),source:{file:'source.bin',postUrl:'https://example.invalid/test'},visualReview:{reviewedAt:'test',notes:'Fixture only'},identityChecks:[{detail:'fixture',status:'pass',note:'synthetic'}],lightingChecks:[{detail:'lights off',status:'pass',note:'synthetic'}]};
  const file=path.join(root,'review.json');
  const script=fileURLToPath(new URL('./validate-video-inputs.mjs',import.meta.url));
  async function run(){await fs.writeFile(file,JSON.stringify({shots:[shot]}));return spawnSync(process.execPath,[script,file],{encoding:'utf8'});}
  assert.equal((await run()).status,1);
  shot.lightingReview={treatment:'dry soft light',reviewedAt:'test',sourceComparison:'synthetic fixture comparison',evidenceFiles:['source.bin'],surfaces:['body','glazing','lamp-lenses','ground','background'].map(surface=>({surface,status:'pass',observation:'Synthetic fixture, not visual certification'}))};
  assert.equal((await run()).status,0);
  shot.lightingReview.surfaces[3].status='hold';assert.equal((await run()).status,1);
  shot.lightingReview.surfaces[3].status='pass';shot.status='hold';assert.equal((await run()).status,1);
});
test.after(async()=>{await fs.rm(root,{recursive:true,force:true});});
