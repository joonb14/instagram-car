import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateReferences} from './validate-image-references.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('new image generation requires the same inspected identity map and mapped actual source/crop evidence',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fc-map-ref-'));
 try {
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yKWoAAAAASUVORK5CYII=','base64');
  await fs.writeFile(path.join(dir,'original.png'),bytes);await fs.writeFile(path.join(dir,'crop.png'),bytes);
  const mark={id:'logo',detail:'Existing mark',sourceFile:'original.png',sourceHash:hash(bytes),referenceFile:'crop.png',referenceHash:hash(bytes),crop:[0,0,1,1],legibility:'unresolved',reviewNotes:'Original and crop actually reviewed',identityPartId:'logo'};
  const r={stage:'prepared',inventoryReviewedAt:'2026-10-24',inventoryNotes:'Source inspected',vehicleSourceFile:'original.png',inputFiles:['original.png','crop.png'],visibleMarks:[mark]};
  assert.equal((await validateReferences(r,dir)).ok,false);
  const spec={schemaVersion:1,vehicle:'Actual car',stage:'finished',reviewedAt:'2026-10-24',gridDivisions:20,coordinateConvention:'image x/y; vehicle side separate',inventoryNotes:'Original inspected',sources:[{id:'raw',file:'original.png',sha256:hash(bytes),width:1,height:1,view:'front',notes:'Observed original'}],parts:[{id:'logo',presence:'present',count:1,surface:'bumper-top',placement:'Original bumper top',observations:[{sourceId:'raw',polygon:[[0,0],[1,0],[1,1],[0,1]],uncertaintyPx:0,notes:'Observed source area'}]}],planes:[],symmetry:{pairs:[],exceptions:[]}};
  let mapBytes=Buffer.from(JSON.stringify(spec));await fs.writeFile(path.join(dir,'map.json'),mapBytes);r.identityMapFile='map.json';r.identityMapHash=hash(mapBytes);
  assert.equal((await validateReferences(r,dir)).ok,true);
  mark.identityPartId='invented';assert.ok((await validateReferences(r,dir)).errors.some(e=>/identity part/.test(e)));mark.identityPartId='logo';
  await fs.appendFile(path.join(dir,'map.json'),' ');assert.ok((await validateReferences(r,dir)).errors.some(e=>/identity map hash/.test(e)));
 }finally{await fs.rm(dir,{force:true,recursive:true});}
});
