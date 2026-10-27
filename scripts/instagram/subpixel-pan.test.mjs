import test from 'node:test';import assert from 'node:assert/strict';
import {subpixelWindow} from './subpixel-pan.mjs';
test('fractional camera translation changes pixels continuously within one integer crop step',async()=>{
 const width=16,height=12,data=Buffer.alloc(width*height*3);for(let y=0;y<height;y++)for(let x=0;x<width;x++){data[(y*width+x)*3]=x*15;data[(y*width+x)*3+1]=y*20;}
 const meta={width,height,channels:3};const a=await subpixelWindow(data,meta,3.25,2.5,4,4),b=await subpixelWindow(data,meta,3.75,2.5,4,4);
 assert.equal(a.input.length,4*4*3);assert.ok(a.input[0]>=47&&a.input[0]<=51,'red must sample x=3.25 rather than snap to x=3');assert.ok(a.input[1]>=48&&a.input[1]<=52,'green must sample y=2.5');assert.ok(b.input[0]-a.input[0]>=5,'subpixel move must change actual pixels');assert.equal(a.raw.width,4);assert.equal(a.raw.height,4);
});
