import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {comparisonFrame} from './render-comparison.mjs';
import {widePhotoFrame} from './wide-frame.mjs';
import {movingStillFrame} from './subpixel-pan.mjs';
import {orderRestorationShots} from './restoration-sequence.mjs';
const sharp=createRequire(resolve(process.cwd(),'package.json'))('sharp');
const cache=new Map();
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
export function revealText(text,t,o={}){
 const at=t-(o.delay??.25);if(at<0)return '';
 return o.effect==='type'?String(text).slice(0,Math.floor((at+1e-8)*(o.charactersPerSecond??18))):String(text);
}
export function shotAt(shots,t){
 if(!Number.isFinite(t)||t<0||!shots?.length)throw Error('Invalid timeline time');
 let start=0;for(let i=0;i<shots.length;i++){if(!(shots[i].duration>0))throw Error('Invalid shot duration');if(t<start+shots[i].duration||i===shots.length-1)return {index:i,local:clamp(t-start,0,shots[i].duration)};start+=shots[i].duration;}
}
export function reviewedReelSources(shots){
 const seen=new Map(),result=[];
 for(const [shotIndex,shot] of shots.entries()){
  if(shot.thumbnailOnly||shot.storyStage==='thumbnail'||shot.thumbnailSources)throw Error('Thumbnail assets must remain separate from the video timeline');
  const sources=shot.comparison?[shot.comparison.before,shot.comparison.after]:[shot];
  for(const source of sources){
   if(!source.sourceAssetId||!/^https:\/\//.test(source.sourceUrl??'')||!['masked-verified','no-readable-plate'].includes(source.plateReview))throw Error('Source identities, URLs and plate review required');
   const old=seen.get(source.sourceAssetId),group=shot.comparison&&shot.comparisonGroup,part=shot.comparisonPart;
   if(old){
    if(!group||!part||group!==old.group||old.parts.has(part)||old.file!==resolve(source.file))throw Error('Unreviewed repeated original photo');
    old.parts.add(part);
   }else{seen.set(source.sourceAssetId,{group,parts:new Set([part]),file:resolve(source.file)});result.push(source);}
  }
 }
 return result;
}
function validate(c){
 if(c.selection?.status!=='selected'||!c.selection.candidateId)throw Error('User curation selection required');
 if(!c.shots?.length||c.shots.length>20)throw Error('One to twenty shots required');
 if(c.narrative==='restoration-area-sequence'){
  const ordered=orderRestorationShots(c.shots,{missingStages:c.missingStages});
  if(ordered.some((s,i)=>s!==c.shots[i]))throw Error('Restoration shots must follow exterior, engine, cabin before/work/after order');
 }
 const w=c.width??1080,h=c.height??1920;
 if(![w,h].every(x=>Number.isInteger(x)&&x>=320&&x<=3840&&x%2===0))throw Error('Even video dimensions required');
 for(const s of c.shots){if(s.thumbnailOnly||s.storyStage==='thumbnail'||s.thumbnailSources)throw Error('Thumbnail assets must remain separate from the video timeline');if(!s.file||!(s.duration>=.5&&s.duration<=15)||!['contain','cover'].includes(s.fit??'cover'))throw Error('Invalid shot');if((s.title??'').length>65)throw Error('Short shot titles required');}
}
async function source(file){const p=resolve(file);if(!cache.has(p)){const b=await sharp(await readFile(p)).rotate().png().toBuffer();const m=await sharp(b).metadata();cache.set(p,{buffer:b,width:m.width,height:m.height});}return cache.get(p);}
export async function renderReelFrame(c,index,t){
 validate(c);const s=c.shots[index];if(!s)throw Error('Unknown shot');
 const renderScale=c.renderScale??1;if(![1,1.5,2].includes(renderScale))throw Error('Unsupported render scale');
 if(renderScale>1){
  const width=c.width??1080,height=c.height??1920;
  const shots=c.shots.map(shot=>shot.comparison?{...shot,comparison:{...shot.comparison,before:{...shot.comparison.before,scale:shot.comparison.before.scale*renderScale},after:{...shot.comparison.after,scale:shot.comparison.after.scale*renderScale}}}:shot);
  const frame=await renderReelFrame({...c,width:width*renderScale,height:height*renderScale,renderScale:1,shots},index,t);
  return sharp(frame).resize(width,height,{kernel:'lanczos3'}).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toBuffer();
 }
 if(s.comparison)return comparisonFrame({...s.comparison,width:c.width??1080,height:c.height??1920,duration:s.duration},t);
 const width=c.width??1080,height=c.height??1920,src=await source(s.file);
 const raw=clamp(t/s.duration),u=raw*raw*(3-2*raw),contain=s.fit==='contain';
 const z0=s.zoom?.[0]??1,z1=s.zoom?.[1]??(contain?1.035:1.12),zoom=z0+(z1-z0)*u;
 if(z0<1||z1<1||z0>1.4||z1>1.4)throw Error('Zoom must stay between 1 and 1.4');
 if(s.subpixelMotion===true&&z0!==z1)throw Error('Subpixel motion requires fixed zoom');
 const layers=[];
 if(s.framing==='wide-reveal'){
  layers.push({input:await widePhotoFrame(s,width,height,raw),left:0,top:0});
 }else if(contain){
  // Full source remains visible. Movement occurs within the black stage.
  const scale=Math.min(width*.92/src.width,height*.54/src.height)*(1+.035*u);
  const rw=Math.round(src.width*scale),rh=Math.round(src.height*scale);
  layers.push({input:await sharp(src.buffer).resize(rw,rh).toBuffer(),left:Math.round((width-rw)/2),top:Math.round(height*.55-rh/2)});
 }else if(s.subpixelMotion===true){
  const from=s.pan?.from??[.5,.5],to=s.pan?.to??[.53,.48];
  layers.push({...await movingStillFrame(s.file,width,height,[from[0]+(to[0]-from[0])*u,from[1]+(to[1]-from[1])*u],zoom),left:0,top:0});
 }else{
  const scale=Math.max(width/src.width,height/src.height)*zoom,rw=Math.max(width,Math.round(src.width*scale)),rh=Math.max(height,Math.round(src.height*scale));
  const from=s.pan?.from??[.5,.5],to=s.pan?.to??[.53,.48];
  const cx=from[0]+(to[0]-from[0])*u,cy=from[1]+(to[1]-from[1])*u;
  const left=Math.round(clamp(cx*rw-width/2,0,rw-width)),top=Math.round(clamp(cy*rh-height/2,0,rh-height));
  const b=await sharp(src.buffer).resize(rw,rh).extract({left,top,width,height}).toBuffer();layers.push({input:b,left:0,top:0});
 }
 const opts={effect:s.effect??'type',delay:s.textDelay??.25,charactersPerSecond:s.charactersPerSecond??18},title=revealText(s.title??'',t,opts),alpha=clamp((t-opts.delay)/.35);
 const font=contain?width*.095:width*.067,x=width*.075;
 const words=title.split(' '),lines=[''];for(const word of words){const last=lines.length-1;if((lines[last]+' '+word).trim().length>21&&lines[last])lines.push(word);else lines[last]=(lines[last]+' '+word).trim();}
 const subtitle=revealText(s.subtitle??'',t,{effect:'appear',delay:s.subtitleDelay??1.45});
 const panel=s.textLayout==='overlay'?`<defs><linearGradient id="shade" x2="0" y2="1"><stop stop-color="black" stop-opacity=".65"/><stop offset="1" stop-color="black" stop-opacity="0"/></linearGradient></defs><rect width="${width}" height="${height*.28}" fill="url(#shade)"/>`:contain?'':`<rect width="${width}" height="${Math.round(height*.255)}" fill="black"/>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${panel}<g fill="white" font-family="Bahnschrift,Arial,sans-serif"><text x="${x}" y="${height*.105}" font-size="${width*.021}" letter-spacing="2">${esc(s.kicker??'FUTURE CLASSIC / RESTORATION')}</text><g opacity="${alpha}">${lines.map((line,i)=>`<text x="${x}" y="${height*.16+i*font*1.05}" font-size="${font}" font-weight="700">${esc(line)}</text>`).join('')}</g><text x="${x}" y="${contain?height*.265:height*.225}" font-size="${width*.029}">${esc(subtitle)}</text><text x="${x}" y="${height*.825}" font-size="${width*.023}" letter-spacing="1">${esc(s.footer??'FUTURE CLASSIC CLUB')}</text>${s.credit?`<text x="${x}" y="${height*.878}" font-size="${width*.021}" stroke="black" stroke-width="2" paint-order="stroke">${esc(s.credit)}</text>`:''}</g></svg>`;
 layers.push({input:Buffer.from(svg),left:0,top:0});
 let frame=sharp({create:{width,height,channels:3,background:'#000000'}}).composite(layers);
 // Short fade at each boundary; all motion and type have enough steady reading time.
 const fade=s.fade===false?1:Math.min(clamp(t/.12),clamp((s.duration-t)/.18));
 const b=await frame.jpeg({quality:92,chromaSubsampling:'4:4:4'}).toBuffer();
 return fade<1?sharp(b).linear(fade).jpeg({quality:92}).toBuffer():b;
}
export async function renderReel(c){
 validate(c);const sources=reviewedReelSources(c.shots);
 const fps=c.fps??24;if(!Number.isInteger(fps)||fps<12||fps>60)throw Error('Invalid frame rate');
 const output=resolve(c.output);if(c.shots.some(s=>resolve(s.file)===output))throw Error('Output must differ from sources');
 if(!c.ffmpeg)throw Error('Supply an installed FFmpeg executable path');
 await mkdir(dirname(output),{recursive:true});
 const duration=c.shots.reduce((n,s)=>n+s.duration,0),frames=Math.round(duration*fps);
 const proc=spawn(resolve(c.ffmpeg),['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-r',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',output],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let error='';proc.stderr.on('data',b=>error+=b);const closed=once(proc,'close');closed.catch(()=>{});proc.stdin.on('error',()=>{});
 try{for(let i=0;i<frames;i++){const at=shotAt(c.shots,i/fps),b=await renderReelFrame(c,at.index,at.local);if(!proc.stdin.write(b))await Promise.race([once(proc.stdin,'drain'),closed.then(()=>{throw Error(error||'Encoder exited');})]);if(i%fps===0)c.onProgress?.({seconds:i/fps,total:duration});}proc.stdin.end();const [code]=await closed;if(code!==0)throw Error(error||'FFmpeg failed');}catch(e){proc.kill();throw e;}
 const storyboard=[];for(let i=0;i<c.shots.length;i++){const b=await renderReelFrame(c,i,Math.min(c.shots[i].duration-.3,2));storyboard.push({input:await sharp(b).resize(240,Math.round(240*(c.height??1920)/(c.width??1080))).toBuffer(),left:i*252,top:0});}
 const sh=Math.round(240*(c.height??1920)/(c.width??1080)),board=join(dirname(output),'storyboard.jpg');await sharp({create:{width:c.shots.length*252-12,height:sh,channels:3,background:'#333'}}).composite(storyboard).jpeg({quality:94}).toFile(board);
 const poster=join(dirname(output),'poster.jpg');await writeFile(poster,await renderReelFrame(c,0,Math.max(0,Math.min(2,c.shots[0].duration-.3))));
 const receipt={output,storyboard:board,poster,width:c.width??1080,height:c.height??1920,fps,duration,frames,audio:false,published:false,sourcePhotos:sources.map(s=>({file:resolve(s.file),sourceAssetId:s.sourceAssetId,sourceUrl:s.sourceUrl,plateReview:s.plateReview})),selection:c.selection};
 await writeFile(join(dirname(output),'reel-receipt.json'),JSON.stringify(receipt,null,2));return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const c=JSON.parse(await readFile(process.argv[2],'utf8'));c.onProgress=p=>process.stderr.write(`${p.seconds}/${p.total}s\n`);console.log(JSON.stringify(await renderReel(c)));}
