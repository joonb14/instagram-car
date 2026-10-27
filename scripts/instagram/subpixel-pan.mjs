import sharp from 'sharp';import {resolve} from 'node:path';
const prepared=new Map(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export async function subpixelWindow(data,raw,left,top,width,height){
 const x=Math.floor(left),y=Math.floor(top),fx=left-x,fy=top-y;
 if(x<2||y<2||x+width+2>raw.width||y+height+2>raw.height)throw Error('Subpixel window exceeds prepared still');
 const tile=await sharp(data,{raw}).extract({left:x-2,top:y-2,width:width+4,height:height+4}).raw().toBuffer();
 const shifted=await sharp(tile,{raw:{width:width+4,height:height+4,channels:raw.channels}}).affine([[1,0],[0,1]],{idx:-fx,idy:-fy,interpolator:sharp.interpolators.bicubic}).raw().toBuffer({resolveWithObject:true});
 const input=await sharp(shifted.data,{raw:shifted.info}).extract({left:2,top:2,width,height}).raw().toBuffer();return {input,raw:{width,height,channels:raw.channels}};
}
export async function movingStillFrame(file,width,height,center,zoom=1){
 const key=JSON.stringify([resolve(file),width,height,zoom]);if(!prepared.has(key))prepared.set(key,(async()=>{
  const m=await sharp(file).metadata(),scale=Math.max(width/m.width,height/m.height)*zoom,rw=Math.max(width,Math.round(m.width*scale)),rh=Math.max(height,Math.round(m.height*scale));
  const result=await sharp(file).rotate().resize(rw,rh).removeAlpha().extend({top:2,left:2,bottom:2,right:2,background:'#000000'}).raw().toBuffer({resolveWithObject:true});return {...result,rw,rh};
 })());
 const p=await prepared.get(key),left=clamp(center[0]*p.rw-width/2,0,p.rw-width)+2,top=clamp(center[1]*p.rh-height/2,0,p.rh-height)+2;
 return subpixelWindow(p.data,p.info,left,top,width,height);
}
