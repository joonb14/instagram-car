import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {widePhotoFrame} from './wide-frame.mjs';
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
const escape=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const fixedCrops=new Map();
export async function wipeFrames(before,after,progress){
 const {width,height}=await sharp(before).metadata(),m=await sharp(after).metadata();
 if(width!==m.width||height!==m.height)throw Error('Comparison dimensions must match');
 const x=Math.round(width*clamp(progress));
 if(x===0)return before;if(x===width)return after;
 const strip=await sharp(after).extract({left:0,top:0,width:x,height}).png().toBuffer();
 const line=Buffer.from(`<svg width="${width}" height="${height}"><rect x="${x-1}" width="2" height="${height}" fill="white"/></svg>`);
 return sharp(before).composite([{input:strip,left:0,top:0},{input:line}]).png().toBuffer();
}
async function crop(s,width,height,u){
 const key=s.zoomGrowth===0&&s.verticalDrift===0?JSON.stringify([s.file,width,height,s.scale,s.anchor,s.anchorTarget]):null;
 if(key&&fixedCrops.has(key))return fixedCrops.get(key);
 const src=await readFile(s.file),m=await sharp(src).metadata();
 const scale=s.scale*(1+(s.zoomGrowth??.035)*u),rw=Math.round(m.width*scale),rh=Math.round(m.height*scale);
 const target=s.anchorTarget??[.5,.30];
 const left=Math.round(s.anchor[0]*scale-width*target[0]),top=Math.round(s.anchor[1]*scale-height*target[1]+u*(s.verticalDrift??22));
 if(left<0||top<0||left+width>rw||top+height>rh)throw Error('Reviewed crop exceeds source');
 const result=await sharp(src).resize(rw,rh).extract({left,top,width,height}).png().toBuffer();
 if(key)fixedCrops.set(key,result);return result;
}
export async function comparisonFrame(c,t){
 const w=c.width,h=c.height,u=ease(t/c.duration);
 const frame=s=>c.framing==='wide-reveal'?widePhotoFrame(s,w,h,t/c.duration):crop(s,w,h,u);
 const [a,b]=await Promise.all([frame(c.before),frame(c.after)]);
 const wipeStart=c.wipeStart??1.25,wipeDuration=c.wipeDuration??1.6;
 const progress=ease((t-wipeStart)/wipeDuration),photo=await wipeFrames(a,b,progress);
 const title=t<wipeStart+wipeDuration/2?(c.beforeTitle??'STRIPPED BACK'):(c.afterTitle??'BUILT BACK'),opacity=ease(t/.3);
 const area=c.areaLabel?`<text x="${w*.07}" y="${h*.20}" font-size="${w*.027}" letter-spacing="2">${escape(c.areaLabel)}</text>`:'';
 const overlay=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="top" x2="0" y2="1"><stop stop-color="black" stop-opacity=".78"/><stop offset="1" stop-color="black" stop-opacity="0"/></linearGradient><linearGradient id="bottom" x2="0" y2="1"><stop stop-color="black" stop-opacity="0"/><stop offset="1" stop-color="black" stop-opacity=".8"/></linearGradient></defs><rect width="${w}" height="${h*.24}" fill="url(#top)"/><rect y="${h*.76}" width="${w}" height="${h*.24}" fill="url(#bottom)"/><g font-family="Bahnschrift,Arial,sans-serif" fill="white"><g opacity="${opacity}"><text x="${w*.07}" y="${h*.10}" font-size="${w*.023}" letter-spacing="2">${escape(c.vehicleTitle??'1989 BMW E30 325iX')}</text><text x="${w*.07}" y="${h*.15}" font-size="${w*.073}" font-weight="700">${escape(title)}</text></g><text x="${w*.07}" y="${h*.85}" font-size="${w*.027}" letter-spacing="2">${escape(c.resultTitle??'A SECOND LIFE')}</text><text x="${w*.07}" y="${h*.88}" font-size="${w*.019}">${escape(c.credit)}</text></g></svg>`);
 const areaOverlay=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g font-family="Bahnschrift,Arial,sans-serif" fill="white">${area}</g></svg>`);
 return sharp(photo).composite([{input:overlay},{input:areaOverlay}]).jpeg({quality:91}).toBuffer();
}
export async function renderComparison(c){
 if(c.selection?.status!=='selected'||!c.selection.candidateId)throw Error('Actual owner selection required');
 for(const s of [c.before,c.after])if(!s.sourceUrl?.startsWith('https://')||!s.sourceAssetId||!['no-readable-plate','masked-verified'].includes(s.plateReview))throw Error('Source and plate review required');
 if(c.before.sourceAssetId===c.after.sourceAssetId)throw Error('Distinct source photos required');
 const out=resolve(c.output);if([c.before,c.after].some(s=>resolve(s.file)===out))throw Error('Preserve sources');
 await mkdir(dirname(out),{recursive:true});
 const p=spawn(c.ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-r',String(c.fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',out],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let err='';p.stderr.on('data',b=>err+=b);p.stdin.on('error',()=>{});const done=once(p,'close');
 try{for(let i=0;i<c.duration*c.fps;i++){const frame=await comparisonFrame(c,i/c.fps);if(!p.stdin.write(frame))await Promise.race([once(p.stdin,'drain'),done.then(()=>{throw Error(err||'Encoder stopped')})]);}p.stdin.end();const [code]=await done;if(code)throw Error(err);}catch(e){p.kill();throw e;}
 const times=[.7,1.75,2.1,2.5,4.8],layers=[];
 for(let i=0;i<times.length;i++){const frame=await comparisonFrame(c,times[i]);await writeFile(join(dirname(out),`frame-${i+1}.jpg`),frame);layers.push({input:await sharp(frame).resize(216,384).toBuffer(),left:i*220,top:0});}
 await sharp({create:{width:1096,height:384,channels:3,background:'#222'}}).composite(layers).jpeg().toFile(join(dirname(out),'storyboard.jpg'));
 await writeFile(join(dirname(out),'receipt.json'),JSON.stringify({...c,published:false,audio:false,method:'Original stills; manually aligned vent anchors; no morphing or generated work',frames:c.duration*c.fps},null,2));
 return {output:out,frames:c.duration*c.fps};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(await renderComparison(JSON.parse(await readFile(process.argv[2],'utf8'))));
