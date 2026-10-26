import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {wipeFrames} from './render-comparison.mjs';
test('comparison reveals the true after pixels without blending or changing the before',async()=>{
 const make=color=>sharp({create:{width:360,height:640,channels:3,background:color}}).png().toBuffer();
 const a=await make('#ff0000'),b=await make('#0000ff'),original=Buffer.from(a);
 const pixel=async(buf,x)=>sharp(buf).extract({left:x,top:320,width:1,height:1}).removeAlpha().raw().toBuffer();
 assert.deepEqual(await pixel(await wipeFrames(a,b,0),180),Buffer.from([255,0,0]));
 assert.deepEqual(await pixel(await wipeFrames(a,b,1),180),Buffer.from([0,0,255]));
 const half=await wipeFrames(a,b,.5);
 assert.deepEqual(await pixel(half,40),Buffer.from([0,0,255]));
 assert.deepEqual(await pixel(half,320),Buffer.from([255,0,0]));
 assert.deepEqual(a,original);
});
