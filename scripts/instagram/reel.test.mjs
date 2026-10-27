import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
const sharp=createRequire(resolve(process.cwd(),'package.json'))('sharp');
import {revealText,shotAt,renderReelFrame,reviewedReelSources} from './render-reel.mjs';

test('covers are separate assets and cannot be inserted as opening video shots',async()=>{
 const photo=id=>({file:id+'.png',sourceAssetId:id,sourceUrl:'https://example.com/build',plateReview:'no-readable-plate'});
 const cover={file:'cover.png',thumbnailOnly:true,duration:.5,thumbnailSources:[photo('front'),photo('rear')]};
 assert.throws(()=>reviewedReelSources([cover,photo('front')]),/thumbnail.*separate/i);
 assert.throws(()=>reviewedReelSources([photo('ordinary'),cover]),/thumbnail/i);
 assert.throws(()=>reviewedReelSources([photo('front'),{...photo('front'),allowThumbnailReuse:true}]),/repeat/i);
 await assert.rejects(()=>renderReelFrame({selection:{status:'selected',candidateId:'test'},shots:[{...cover,duration:1}]},0,0),/thumbnail.*separate/i);
});

test('three reviewed cabin parts may reuse the same pair but accidental photo repetition is rejected',()=>{
 const photo=id=>({file:id+'.png',sourceAssetId:id,sourceUrl:'https://example.com/build',plateReview:'no-readable-plate'});
 const part=name=>({comparisonGroup:'same-cabin-pair',comparisonPart:name,comparison:{before:photo('before'),after:photo('after')}});
 assert.equal(reviewedReelSources([part('steering'),part('center'),part('right')]).length,2);
 assert.throws(()=>reviewedReelSources([part('center'),part('center')]),/repeat/i);
 assert.throws(()=>reviewedReelSources([photo('a'),photo('a')]),/repeat/i);
});

test('supersampled motion returns target dimensions and rejects unsupported scales',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-smooth-')),file=join(dir,'photo.png');
 await sharp({create:{width:800,height:600,channels:3,background:'#b98'}}).png().toFile(file);
 const c={selection:{status:'selected',candidateId:'test'},width:360,height:640,renderScale:1.5,shots:[{file,duration:3,fit:'cover',title:'',fade:false}]};
 const m=await sharp(await renderReelFrame(c,0,1)).metadata();assert.equal(m.width,360);assert.equal(m.height,640);
 await assert.rejects(()=>renderReelFrame({...c,renderScale:0},0,1),/render scale/i);
});

test('detail Reel overlay leaves real photo visible at the top and bottom without black mats',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-detail-')),file=join(dir,'photo.png');
 await sharp({create:{width:800,height:600,channels:3,background:'#ff6633'}}).png().toFile(file);
 const c={selection:{status:'selected',candidateId:'test'},width:360,height:640,shots:[{file,duration:3,fit:'cover',textLayout:'overlay',fade:false,title:'',kicker:'',footer:''}]};
 for(const t of [0,2.95]){
  const b=await renderReelFrame(c,0,t);
  const top=await sharp(b).extract({left:340,top:20,width:1,height:1}).removeAlpha().raw().toBuffer();
  assert.ok(top[0]>20&&top[0]>top[2]*2,'photo must remain visible behind gradient');
 }
});

test('typing waits for its cue and stops at the complete title',()=>{
 assert.equal(revealText('RUST REPAIRED',0,{delay:.3,effect:'type'}),'');
 assert.equal(revealText('RUST REPAIRED',.6,{delay:.3,effect:'type',charactersPerSecond:10}),'RUS');
 assert.equal(revealText('RUST REPAIRED',10,{effect:'type'}),'RUST REPAIRED');
});
test('timeline boundaries advance once and never seek beyond the last photo',()=>{
 const shots=[{duration:3},{duration:2}];assert.equal(shotAt(shots,2.9).index,0);assert.equal(shotAt(shots,3).index,1);assert.equal(shotAt(shots,5).index,1);assert.throws(()=>shotAt(shots,-1),/time/i);
});
test('whole-car framing keeps both source edges while detail framing fills the frame',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-reel-')),file=join(dir,'photo.png');
 await sharp({create:{width:800,height:400,channels:3,background:'#ccc'}}).composite([{input:Buffer.from('<svg width="800" height="400"><rect width="50" height="400" fill="red"/><rect x="750" width="50" height="400" fill="blue"/></svg>')}]).png().toFile(file);const before=await readFile(file);
 const c={selection:{status:'selected',candidateId:'test'},width:360,height:640,shots:[{file,duration:3,fit:'contain',title:'A SECOND LIFE'}]};const frame=await renderReelFrame(c,0,2);const m=await sharp(frame).metadata();assert.equal(m.width,360);assert.equal(m.height,640);const px=async x=>sharp(frame).extract({left:x,top:350,width:1,height:1}).removeAlpha().raw().toBuffer();const left=await px(12),right=await px(347);assert.ok(left[0]>200&&left[2]<60);assert.ok(right[2]>200&&right[0]<60);assert.deepEqual(await readFile(file),before);
 const later=await renderReelFrame(c,0,2.5);const area=b=>sharp(b).extract({left:0,top:200,width:360,height:300}).raw().toBuffer();assert.notDeepEqual(await area(frame),await area(later));
 await assert.rejects(()=>renderReelFrame({...c,selection:null},0,0),/curation/i);
});
