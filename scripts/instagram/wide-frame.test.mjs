import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {widePhotoFrame} from './wide-frame.mjs';
test('wide reveal preserves both source edges at the midpoint and pans in opposite directions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fc-wide-')),file=join(dir,'source.png');
 await sharp({create:{width:800,height:450,channels:3,background:'#888'}}).composite([{input:Buffer.from('<svg width="800" height="450"><rect width="100" height="450" fill="red"/><rect x="700" width="100" height="450" fill="blue"/></svg>')}]).png().toFile(file);
 const before=await readFile(file),s={file,wideZoom:[1.45,1,1.45],pan:{from:[0,0.5],to:[1,0.5]}};
 const mid=await widePhotoFrame(s,360,640,.5);
 const px=async(b,x)=>sharp(b).extract({left:x,top:340,width:1,height:1}).removeAlpha().raw().toBuffer();
 assert.ok((await px(mid,10))[0]>200);assert.ok((await px(mid,349))[2]>200);
 const left=await widePhotoFrame(s,360,640,0),right=await widePhotoFrame({...s,pan:{from:[1,.5],to:[0,.5]}},360,640,0);
 assert.notDeepEqual(await px(left,10),await px(right,10));assert.deepEqual(await readFile(file),before);
});
