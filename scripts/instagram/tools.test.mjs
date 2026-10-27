import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
const sharp=createRequire(resolve(process.cwd(),'package.json'))('sharp');
import {renderCover} from './render-cover.mjs';
import {planScene} from './creative-plan.mjs';
import {packagePost} from './package-post.mjs';
import {applyBrandPlate} from './brand-plate.mjs';
import {renderPhotoSlide} from './render-photo-slide.mjs';

test('portrait slides preserve landscape corners when paired and reject repeated sources',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-pair-')),src=join(dir,'wide.png');
 await sharp({create:{width:640,height:360,channels:3,background:'#eee'}}).composite([{input:Buffer.from('<svg width="640" height="360"><rect width="30" height="360" fill="red"/><rect x="610" width="30" height="360" fill="blue"/></svg>')}]).png().toFile(src);const before=await readFile(src);
 const c={fit:'contain',labels:['BEFORE','AFTER'],selection:{status:'selected',candidateId:'test'},images:[{file:src,sourceAssetId:'a'},{file:src,sourceAssetId:'b'}],output:join(dir,'paired.jpg')};const r=await renderPhotoSlide(c);assert.equal(r.height,1440);assert.equal(r.layout,'paired-landscapes');assert.deepEqual(r.labelBoxes,[]);const left=await sharp(r.output).extract({left:4,top:300,width:1,height:1}).raw().toBuffer(),right=await sharp(r.output).extract({left:1075,top:300,width:1,height:1}).raw().toBuffer();assert.ok(left[0]>200&&left[2]<40);assert.ok(right[2]>200&&right[0]<40);assert.deepEqual(await readFile(src),before);
 await assert.rejects(()=>renderPhotoSlide({...c,images:[c.images[0],c.images[0]]}),/Unique/);await assert.rejects(()=>renderPhotoSlide({...c,images:[c.images[0]]}),/paired/);
 const portrait=join(dir,'portrait.png');await sharp({create:{width:360,height:640,channels:3,background:'#eee'}}).png().toFile(portrait);assert.equal((await renderPhotoSlide({...c,output:join(dir,'portrait.jpg'),images:[{file:portrait,sourceAssetId:'c'}]})).layout,'single-portrait');
});

test('pair labels have measured opaque black backing even over a bright photo',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-label-')),src=join(dir,'white.png');await sharp({create:{width:800,height:600,channels:3,background:'#fff'}}).png().toFile(src);
 const r=await renderPhotoSlide({selection:{status:'selected',candidateId:'test'},images:[{file:src,sourceAssetId:'a'},{file:src,sourceAssetId:'b'}],showLabels:true,labels:['RESTORED','INSTALLED'],output:join(dir,'labels.jpg')});assert.equal(r.labelBoxes.length,2);assert.equal(r.labelBoxes[0].left+r.labelBoxes[0].width,1080);assert.equal(r.labelBoxes[0].top+r.labelBoxes[0].height,708);assert.equal(r.labelBoxes[1].left+r.labelBoxes[1].width,1080);assert.equal(r.labelBoxes[1].top,732);assert.equal(r.fit,'cover');for(const y of [2,700,735,1437]){const edge=await sharp(await readFile(r.output)).extract({left:2,top:y,width:1,height:1}).raw().toBuffer();assert.ok(edge[0]>240);}
 for(const box of r.labelBoxes){const px=await sharp(await readFile(r.output)).extract({left:box.left+3,top:box.top+3,width:1,height:1}).raw().toBuffer();assert.ok([...px].every(x=>x<15));assert.ok(box.width<250);assert.ok(box.height<60);}
});

test('cover overlay has real alpha and preserves its input',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-cover-'));const src=join(dir,'src.png');await sharp({create:{width:1080,height:810,channels:3,background:'#aaa'}}).png().toFile(src);const before=await readFile(src);
 const r=await renderCover({selection:{status:'selected',candidateId:'test'},image:src,output:join(dir,'cover.jpg'),overlay:join(dir,'overlay.png'),title:'A SECOND SUMMER.',subtitle:'E30 M-TECH II',opacity:0.12});const {data,info}=await sharp(r.overlay).raw().toBuffer({resolveWithObject:true});assert.equal(info.width,1080);assert.equal(info.height,1080);assert.equal(info.channels,4);assert.ok(Math.abs(data[(1079*1080+1079)*4+3]-31)<=1);assert.deepEqual(await readFile(src),before);
});
test('scene planner avoids recent settings and defaults to parked without people',()=>{
 const history=[{sceneId:'architecture'},{sceneId:'forest'},{sceneId:'mountain'}];const p=planScene({postKey:'new-case',selection:{status:'selected',candidateId:'test'}},history);assert.ok(!history.some(x=>x.sceneId===p.sceneId));assert.equal(p.people,'none');assert.equal(p.motion,'parked');assert.equal(p.vehicleMode,'reference-scene');assert.ok(p.constraints.some(x=>x.includes('Do not paste')));assert.ok(!p.constraints.some(x=>x.includes('prefer background-only')));
});
test('top-header covers confine the text layer to the header and keep a square photo export',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-header-')),src=join(dir,'source.png');await sharp({create:{width:320,height:240,channels:3,background:'#888'}}).png().toFile(src);const original=await readFile(src);
 const r=await renderCover({selection:{status:'selected',candidateId:'test'},image:src,output:join(dir,'cover.jpg'),overlay:join(dir,'type.png'),title:'RESTORED',width:320,height:320,headerHeight:80,opacity:.12});
 const {data,info}=await sharp(r.overlay).raw().toBuffer({resolveWithObject:true});assert.equal(info.height,320);assert.equal(data[(319*320+319)*4+3],0);assert.ok(data[(79*320+319)*4+3]>0);assert.equal((await sharp(r.output).metadata()).height,320);assert.deepEqual(await readFile(src),original);
});
test('full-bleed cover darkens only its upper text area without padding',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-top-overlay-')),src=join(dir,'source.png');await sharp({create:{width:640,height:320,channels:3,background:'#888'}}).png().toFile(src);const original=await readFile(src);
 const r=await renderCover({selection:{status:'selected',candidateId:'test'},image:src,output:join(dir,'cover.jpg'),overlay:join(dir,'type.png'),title:'RESTORED',width:320,height:320,textAreaHeight:80});
 const {data}=await sharp(r.overlay).raw().toBuffer({resolveWithObject:true});assert.equal(data[(80*320+319)*4+3],0);assert.equal(data[(319*320+319)*4+3],0);assert.ok(Math.abs(data[(79*320+319)*4+3]-122)<=1);
 const bottom=await sharp(r.output).extract({left:160,top:319,width:1,height:1}).removeAlpha().raw().toBuffer();assert.ok(bottom[0]>125);assert.deepEqual(await readFile(src),original);
 await assert.rejects(()=>renderCover({selection:{status:'selected',candidateId:'test'},title:'X',textAreaHeight:320,width:320,height:320}),/text area/i);
});

test('package rejects missing plate review and accepts one paste with no URL or From',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-package-'));const image=join(dir,'photo.jpg');await sharp({create:{width:1080,height:810,channels:3,background:'#aaa'}}).jpeg().toFile(image);
 const p={postKey:'case',selection:{status:'selected',candidateId:'test'},community:'Test Forum',author:'Writer',caption:'A car restored.\n\n#CarRestoration\n\n🚗 Test Forum · 🧑‍🔧 Writer',slides:[{file:image,stage:'hero',sourceUrl:'https://example.com/1'},{file:image,stage:'before',sourceUrl:'https://example.com/2'},{file:image,stage:'after',sourceUrl:'https://example.com/3'}]};
 p.slides.forEach((s,i)=>s.sourceAssetId='photo-'+i);await assert.rejects(()=>packagePost(p,join(dir,'out')),/plate/i);p.slides.forEach((s,i)=>{s.plateReview='no-readable-plate';s.sourceAssetId='photo-'+i;});const r=await packagePost(p,join(dir,'out'));assert.equal(r.count,3);await assert.rejects(()=>packagePost({...p,slides:p.slides.map((s,i)=>({...s,sourceAssetId:i===2?'photo-0':s.sourceAssetId}))},join(dir,'duplicate')),/Duplicate original/);await assert.rejects(()=>packagePost({...p,slides:p.slides.map(s=>({...s,framing:'whole-vehicle',vehicleComplete:false}))},join(dir,'clipped')),/Whole vehicle/);assert.equal((await readFile(r.photosZip)).readUInt32LE(0),0x04034b50);assert.equal(await readFile(r.captionFile,'utf8'),p.caption);await assert.rejects(()=>packagePost({...p,caption:p.caption+'\nhttps://example.com'},join(dir,'bad')),/URL|footer/i);
});

test('production tools require an actual curation selection',async()=>{assert.throws(()=>planScene({postKey:'unselected'},[]),/curation/);await assert.rejects(()=>renderCover({title:'Unselected'}),/curation/);await assert.rejects(()=>packagePost({},'unused'),/curation/);});

test('plate branding preserves source and pixels outside the plate',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-plate-'));const image=join(dir,'car.png'),logo=join(dir,'logo.png'),output=join(dir,'branded.png');
 await sharp({create:{width:200,height:150,channels:3,background:'#aaa'}}).png().toFile(image);
 await sharp({create:{width:40,height:10,channels:4,background:'#111'}}).png().toFile(logo);const original=await readFile(image);
 await assert.rejects(()=>applyBrandPlate({selection:{status:'selected'},image,output,logo}),/Selected case/);
 await applyBrandPlate({selection:{status:'selected',candidateId:'test'},image,output,logo,quad:[[60,80],[140,80],[140,110],[60,110]]});
 assert.deepEqual(await readFile(image),original);
 const crop=path=>sharp(path).extract({left:0,top:0,width:50,height:50}).removeAlpha().raw().toBuffer();assert.deepEqual(await crop(image),await crop(output));
 const pixel=await sharp(output).extract({left:100,top:95,width:1,height:1}).removeAlpha().raw().toBuffer();assert.ok(pixel[0]<50);
});
