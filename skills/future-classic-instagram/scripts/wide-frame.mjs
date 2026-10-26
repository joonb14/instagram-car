import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const cache=new Map(),backs=new Map();
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
export async function widePhotoFrame(s,width,height,u){
 const key=resolve(s.file)+JSON.stringify(s.sourceCrop??null);
 if(!cache.has(key)){
  let img=sharp(await readFile(s.file)).rotate();if(s.sourceCrop)img=img.extract(s.sourceCrop);
  const buffer=await img.png().toBuffer(),m=await sharp(buffer).metadata();cache.set(key,{buffer,width:m.width,height:m.height});
 }
 const src=cache.get(key),backKey=key+width+'x'+height;
 if(!backs.has(backKey))backs.set(backKey,await sharp(src.buffer).resize(Math.round(width/3),Math.round(height/3),{fit:'cover'}).blur(18).resize(width,height).linear(.55).png().toBuffer());
 // The mid-shot wide hold reveals the whole reviewed source. No generated extension.
 const z=s.wideZoom??[1.4,1,1.4];
 const zoom=u<.40?z[0]+(z[1]-z[0])*ease(u/.40):u>.62?z[1]+(z[2]-z[1])*ease((u-.62)/.38):z[1];
 if(Math.min(...z)<1||Math.max(...z)>1.8)throw Error('Wide zoom must stay between 1 and 1.8');
 const rw=Math.round(width*zoom),rh=Math.round(rw*src.height/src.width);
 if(rh>height)throw Error('Wide framing requires a landscape source');
 const from=s.pan?.from??[0,.5],to=s.pan?.to??[1,.5],p=from[0]+(to[0]-from[0])*ease(u);
 const left=Math.round((rw-width)*clamp(p));
 const photo=await sharp(src.buffer).resize(rw,rh).extract({left,top:0,width,height:rh}).png().toBuffer();
 return sharp(backs.get(backKey)).composite([{input:photo,left:0,top:Math.round(height*.54-rh/2)}]).png().toBuffer();
}
