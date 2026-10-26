import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { gridLocation, rectifyPoint, reviewSymmetry, validateIdentityMap, buildIdentityBrief } from './vehicle-identity-map.mjs';

const source = { id:'front', file:'front.png', sha256:'a'.repeat(64), width:2000, height:1000, view:'oblique-front', notes:'Viewed original pixels' };
const part = { id:'plate', surface:'bumper-face', presence:'present', count:1, placement:'Offset on original front bracket', text:{ legibility:'unresolved', notes:'Cannot read this sample' }, observations:[{sourceId:'front', polygon:[[200,600],[600,600],[600,800],[200,800]], uncertaintyPx:10, notes:'Manually bounded original plate' }] };
const spec = () => ({schemaVersion:1,vehicle:'Actual car',stage:'finished',reviewedAt:'2026-10-24',gridDivisions:20,coordinateConvention:'image-left-to-right; vehicle-left is separately named',sources:[structuredClone(source)],parts:[structuredClone(part)],planes:[],symmetry:{pairs:[],exceptions:[{partId:'plate',reason:'Original offset mount',evidenceSourceIds:['front']}]},inventoryNotes:'Actual front inspected, other views still require their own inventory'});

test('image position ranges and N cells are resolution-independent and use zero-based half-open cells',()=>{
 const a=gridLocation(part.observations[0].polygon,source,20);
 assert.deepEqual(a.range1000,{x:[100,300],y:[600,800]});
 assert.deepEqual(a.cells,{x:[2,5],y:[12,15]});
 assert.deepEqual(gridLocation(part.observations[0].polygon.map(p=>p.map(v=>v/2)),{width:1000,height:500},20).range1000,a.range1000);
 assert.throws(()=>gridLocation([[0,0],[2100,1],[1,2]],source,20),/bounds/);
});
test('rectification inverts perspective for points on one specified plane',()=>{
 const quad=[[20,40],[220,20],[200,140],[40,160]];
 for(const [i,p]of quad.entries())assert.ok(Math.hypot(...rectifyPoint(quad,p).map((v,k)=>v-[[0,0],[1000,0],[1000,1000],[0,1000]][i][k]))<1e-6);
 assert.throws(()=>rectifyPoint([[0,0],[1,1],[2,2],[3,3]],[1,1]),/degenerate/);
});
test('symmetry detects displaced paired landmarks but excludes a documented offset plate',()=>{
 const s=spec();s.planes=[{id:'fascia',sourceId:'front',status:'verified',quad:[[0,0],[2000,0],[2000,1000],[0,1000]],evidence:'All four corners on same flat fascia',centerlineEvidence:'Physical symmetry axis is u=500'}];
 s.parts.push(...['left-lamp','right-lamp'].map((id,i)=>({id,surface:'fascia',presence:'present',count:1,placement:'paired original lamps',observations:[{sourceId:'front',polygon:[[i?1400:400,200],[i?1600:600,200],[i?1600:600,400],[i?1400:400,400]],landmark:[i?1500:500,300],uncertaintyPx:2,notes:'Lamp center'}]})));
 s.symmetry.pairs=[{id:'lamp-pair',partIds:['left-lamp','right-lamp'],planeId:'fascia',tolerance1000:10,toleranceNotes:'Reviewed annotation tolerance'}];
 assert.equal(reviewSymmetry(s).results[0].status,'within-recorded-tolerance');
 s.parts[2].observations[0].landmark[0]=1300;
 assert.equal(reviewSymmetry(s).results[0].status,'hold');
 assert.equal(reviewSymmetry(s).exceptions[0].partId,'plate');
 s.parts[2].surface='hood';
 assert.ok(reviewSymmetry(s).errors.some(x=>/same surface/.test(x)));
});
test('unverified physical positions and unsupported symmetry passes cannot masquerade as measured',async()=>{
 const s=spec();s.parts[0].physicalRange1000={x:[200,400],y:[800,950]};
 assert.ok((await validateIdentityMap(s,{checkFiles:false})).errors.some(x=>/physicalRange1000/.test(x)));
 delete s.parts[0].physicalRange1000;s.parts[0].observations[0].polygon[0][0]=-1;
 assert.equal((await validateIdentityMap(s,{checkFiles:false})).valid,false);
});
test('a known failed numeric symmetry pair holds the generation reference specification',async()=>{
 const s=spec();s.planes=[{id:'fascia',sourceId:'front',status:'verified',quad:[[0,0],[2000,0],[2000,1000],[0,1000]],evidence:'Source-backed flat symmetric fascia corners',centerlineEvidence:'u=500 verified'}];
 s.parts.push(...[300,1300].map((x,i)=>({id:'lamp-'+i,surface:'fascia',presence:'present',count:1,placement:'Paired lamp',observations:[{sourceId:'front',polygon:[[x-40,100],[x+40,100],[x+40,200],[x-40,200]],landmark:[x,150],uncertaintyPx:2,notes:'Lamp center observed'}]})));
 s.symmetry.pairs=[{id:'lamps',partIds:['lamp-0','lamp-1'],planeId:'fascia',tolerance1000:10,toleranceNotes:'Manual marking tolerance'}];
 assert.equal((await validateIdentityMap(s,{checkFiles:false})).valid,false);
});
test('generation brief names source-specific numerical evidence without inventing unreadable text or relocating exceptions',()=>{
 const b=buildIdentityBrief(spec());
 assert.match(b,/front.*x=100.*300/s);assert.match(b,/bumper-face/);assert.match(b,/Offset on original front bracket/);
 assert.match(b,/unresolved/);assert.match(b,/not transferable/);assert.doesNotMatch(b,/42|BMW|centered plate/);
});
test('a front-region N-grid stays separate from whole-image coordinates and approved edit overrides',async()=>{
 const s=spec();s.sourceRegions=[{id:'front-envelope',sourceId:'front',rect:[100,500,1000,400],basis:'projected-image-region',notes:'Visible front envelope in this oblique photograph only'}];s.parts[0].observations[0].regionId='front-envelope';
 s.parts[0].text={legibility:'readable',value:'private-original-plate',usage:'source-only',notes:'Source registration, replace print only'};
 s.ownerEditOverrides=[{detail:'plate print',sourceObservation:'Original has registration',requestedEdit:'Use approved Future Classic artwork on same mount'}];
 const b=buildIdentityBrief(s);assert.match(b,/front-envelope.*x=100.*500/s);assert.match(b,/Future Classic/);assert.doesNotMatch(b,/private-original-plate/);
 assert.equal((await validateIdentityMap(s,{checkFiles:false})).valid,true);
 s.sourceRegions[0].basis='physical-front';assert.ok((await validateIdentityMap(s,{checkFiles:false})).errors.some(e=>/projected-image-region/.test(e)));
});
test('stale source bytes invalidate the map despite a previously recorded review',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fc-identity-map-'));
 try {const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yKWoAAAAASUVORK5CYII=','base64');await fs.writeFile(path.join(dir,'front.png'),bytes);const s=spec();s.sources[0].width=1;s.sources[0].height=1;s.sources[0].sha256=crypto.createHash('sha256').update(bytes).digest('hex');s.parts[0].observations[0].polygon=[[0,0],[1,0],[1,1],[0,1]];
 assert.equal((await validateIdentityMap(s,{base:dir})).valid,true);
 await fs.appendFile(path.join(dir,'front.png'),'changed');assert.ok((await validateIdentityMap(s,{base:dir})).errors.some(x=>/hash/.test(x)));
 }finally{await fs.rm(dir,{force:true,recursive:true});}
});
