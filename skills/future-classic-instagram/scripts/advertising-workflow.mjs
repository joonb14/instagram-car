import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {preparePrompt} from './kling-prompt-workflow.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const text=x=>typeof x==='string'&&x.trim().length>0;
const roleSpecs=[
 ['front-half','exterior','Tight front half, naturally clipped plate/emblem allowed','The camera slowly arcs a few degrees around the visible front corner.'],
 ['front-low','exterior','Low front three-quarter partial, visible front wheel and side decal','The camera slowly arcs toward the visible front wheel, revealing slightly more of the side.'],
 ['rear-three-quarter','exterior','Low rear three-quarter showing rear wheel and side; exhaust on original vehicle side','The camera slowly arcs around the visible rear corner toward the rear wheel.'],
 ['hood-emblem','detail','Original hood emblem macro; source-verified lettering and quadrants','The camera slowly moves along a tiny sideways arc around the existing hood emblem.'],
 ['whole-car','exterior','Whole-car front three-quarter with generous bumper and wheel margins','The camera slowly arcs a few degrees toward the visible side.'],
 ['closing-side','exterior','Low side-dominant whole car, different background perspective, all lights off','The camera gently changes its viewing angle along a small arc, keeping the whole car visible.']
];
const optionalSpecs=[
 ['c-pillar','detail','C-pillar, rear quarter window and roof edge close-up, preserve original pillar geometry','The camera slowly arcs a few degrees along the C-pillar toward the rear quarter window.'],
 ['a-pillar','detail','A-pillar, windshield corner and hood edge close-up','The camera slowly glides sideways past the windshield corner.'],
 ['roofline','detail','Roof-to-rear-window transition with subtle natural paint reflections','The camera slowly glides along the roof edge toward the rear glass.'],
 ['wheel-detail','detail','Stationary wheel, correct center cap, tire and fender close-up','The camera slowly arcs a few degrees around the stationary wheel.'],
 ['headlamp-detail','detail','Headlamp glass, mounting ring and adjacent fender close-up','The camera slowly changes angle around the existing headlamp.'],
 ['rear-half','detail','Oblique rear half with taillight, deck and a portion of rear wheel','The camera slowly glides sideways around the visible rear corner.'],
 ['side-decal','detail','Original side decal and door surface close-up; preserve source lettering','The camera slowly glides along the existing side decal.'],
 ['mirror-detail','detail','Mirror, side glass and adjacent door close-up','The camera slowly arcs around the existing mirror toward the side window.'],
 ['rear-badge','detail','Original rear badge and adjacent body panel close-up','The camera slowly glides sideways across the original rear badge.'],
 ['rear-wide','exterior','Whole-car rear three-quarter with complete wheels and bumpers, actual exhaust side','The camera slowly arcs a few degrees around the visible rear corner.'],
 ['side-wide','exterior','Source-supported whole-car side view with generous margins','The camera slowly glides laterally alongside the parked car.']
];
export function compositionOptions(){return [...roleSpecs,...optionalSpecs].map(([id,kind,composition,movement])=>({id,kind,composition,movement,status:'candidate',requiresOriginalCoverage:true}));}
export function createWorkflow(vehicle='REPLACE WITH VERIFIED VEHICLE',elementName='Vehicle_Element',options={}){
 const catalog=compositionOptions();
 const chosen=(options.sourceIds??roleSpecs.map(r=>r[0])).map(id=>{const s=catalog.find(s=>s.id===id);if(!s)throw Error('Unknown composition: '+id);return s;});
 const elementIds=options.elementSourceIds??['front-low','whole-car','front-half','rear-three-quarter'];
 return {version:2,mode:'vehicle-advertising',vehicle,sourceArticle:'',sourceCredit:'',platePolicy:options.platePolicy??{mode:'absent',evidence:'Owner-selected plate-free default for generated video assets, 2026-10-25'},background:{setting:'source-suited shared location',weather:'dry',lighting:'muted natural overcast',color:'natural color; all lamps off'},generation:{provider:'Kling web',submissionOwner:'user-manual',model:'Kling3.0',seconds:3,resolution:'1080p',aspectRatio:'9:16',outputs:1,multiShot:false,nativeAudio:false},element:{name:elementName,description:'',tag:'Items',sourceIds:elementIds,registrationEvidence:'',bindingEvidence:''},sources:chosen.map(({id,kind,composition,movement})=>({id,kind,composition,movement,file:'',sha256:'',originalReferences:[],review:{status:'hold',notes:''}})),clips:[],edit:{fps:24,variant:'compact',fadeSeconds:.8,zoom:false,speed:1},ffmpeg:'',publication:{instagram:'not-published',youtube:'not-published'}};
}
export function reviewStructure(m){
 const errors=[];
 if(m.mode!=='vehicle-advertising'||!text(m.vehicle))errors.push('Vehicle advertising mode and verified vehicle required');
 const ids=new Set();
 for(const s of m.sources??[]){if(!text(s.id)||ids.has(s.id))errors.push('Duplicate or missing source ID');ids.add(s.id);}
 const selected=m.element?.sourceIds??[];
 if(selected.length!==4||new Set(selected).size!==4)errors.push('Select exactly four distinct exterior images for Element');
 for(const id of selected)if(!m.sources?.some(s=>s.id===id&&s.kind==='exterior'))errors.push('Element source must be an existing exterior image: '+id);
 for(const [k,v]of Object.entries({model:'Kling3.0',seconds:3,resolution:'1080p',aspectRatio:'9:16',outputs:1,multiShot:false,nativeAudio:false}))
  if(m.generation?.[k]!==v)errors.push('Expected generation.'+k+'='+v);
 if(m.platePolicy&&!['absent','promotional','source'].includes(m.platePolicy.mode))errors.push('Unknown platePolicy.mode');
 if(!text(m.element?.name)||m.element.name.length>20||/[\r\n]/.test(m.element.name))errors.push('Actual Element name required, at most20characters');
 if((m.element?.description??'').length>100)errors.push('Keep Element description under100characters unless observed UI allows more');
 for(const c of m.clips??[])if(!ids.has(c.sourceId))errors.push('Unknown clip source: '+c.sourceId);
 return {valid:!errors.length,errors};
}
export function buildPrompt(m,s){
 if(s.promptPlan){if(s.promptPlan.elementName!==m.element.name)throw Error('Prompt plan Element differs from selected Element');const r=preparePrompt(s.promptPlan);if(!r.ready)throw Error(r.errors.join('\n'));return r.prompt;}
 if(text(s.videoPrompt))return s.videoPrompt.trim();
 const move=text(s.cameraPlan?.direction)?'The camera slowly moves '+s.cameraPlan.direction+' from its starting viewpoint. End view: '+s.cameraPlan.endView+'.':s.movement;
 const hidden=s.cameraPlan?.keepHidden?.length?' Keep '+s.cameraPlan.keepHidden.join(', ')+' hidden throughout the shot.':'';
 return move+' Keep the same camera height and focal length over three seconds. Use @'+m.element.name+' as the same single parked car shown in the starting frame. Preserve the original body, grille, lamp arrangement, emblems, wheel details, side lettering'+(m.platePolicy?.mode==='absent'?'':' and Future Classic plate')+', following perspective and occlusion naturally.'+hidden+' '+parkedWiperInstruction+' All lamps remain off. Maintain natural colors and exposure. Only the camera moves; the car and wheels remain stationary. One continuous shot, no cuts, no zoom, no fading or added graphics.';
}
export const parkedWiperInstruction='Keep both windshield wipers switched off at their source-documented resting positions and angles, preserving the actual pivots and arm geometry. No sweeping, detached or floating blades.';
export function reviewWipers(items,{video=false}={}){
 const errors=[];
 for(const s of items??[]){const r=s.wiperReview,p=(s.id??s.sourceId)+': ';
  if(r?.status!=='pass'||!['visible','outside-crop','absent-in-original'].includes(r?.visibility)||!r?.originalReferences?.length||!text(r?.notes)||!s.sha256||r?.reviewedSha256!==s.sha256){errors.push(p+'current original-backed wiperReview required');continue;}
  if(r.visibility==='visible'&&r.posture!=='parked')errors.push(p+'visible wipers must be in documented parked position');
  if(video&&(!Array.isArray(r.samples)||r.samples.length<3||new Set(r.samples.map(f=>f.timeSeconds)).size<3||r.samples.some(f=>!Number.isFinite(f.timeSeconds)||f.timeSeconds<0||f.status!=='pass'||!text(f.notes))))errors.push(p+'wiper video review needs distinct start/middle/end sample evidence');
 }
 return {valid:!errors.length,errors,note:'Evidence/hash gate only; inspect actual blade pixels and playback. Parked follows original vehicle geometry, not screen horizontal.'};
}
export function reviewCameraPlans(m){const errors=[];for(const s of m.sources??[]){const p=s.cameraPlan;for(const key of ['referenceFrame','direction','startView','endView'])if(!text(p?.[key]))errors.push(s.id+': explicit cameraPlan.'+key+' required');if(!Array.isArray(p?.keepHidden))errors.push(s.id+': cameraPlan.keepHidden must record parts excluded throughout movement');}return {valid:!errors.length,errors};}
export function reviewMarkLayouts(m){const errors=[];for(const s of m.sources??[]){const l=s.markLayout,p=s.id+': ';if(!l){errors.push(p+'markLayout required');continue;}if(l.status!=='pass'||!l.originalReferences?.length)errors.push(p+'original-backed placement review required');for(const key of ['centerlineEvidence','perspectiveNotes','reviewNotes'])if(!text(l[key]))errors.push(p+'markLayout.'+key+' required');if(!text(l.plate?.sourceMount)||!['visible','partial','outside-crop','absent-in-original',...(m.platePolicy?.mode==='absent'?['removed-by-owner']:[])].includes(l.plate?.visibility)||!text(l.plate?.cropEvidence))errors.push(p+'original plate mounting and crop accounting required');if(l.plate?.visibility==='removed-by-owner'&&!text(l.plate.ownerEditEvidence))errors.push(p+'plate removal needs owner-edit evidence');for(const key of ['hoodEmblem','grilleLogo'])if(!['present','outside-crop','absent-in-original','unresolved'].includes(l[key]?.presence)||l[key]?.presence==='unresolved'||!text(l[key]?.placementEvidence))errors.push(p+'source-supported '+key+' presence and location required');}return {valid:!errors.length,errors,note:'Recorded evidence only; compare original/render pixels. Equal screen-x is not a geometry test.'};}
export function buildImagePrompt(m,s){
 const plate=m.platePolicy?.mode==='absent'?'Remove all front/rear license plates and removable plate brackets. Preserve the real bumper surfaces, end caps, loops and tow hardware; leave no blank rectangular plate, ghost lettering or extra branding. This approved staging edit applies to all Start Frames and every Element reference.':'White Future Classic plate at original scale and perspective; natural cropping and occlusion are allowed. Keep the plate at its actual original mount. Account for lateral crop margins: show the physically expected partial plate rather than deleting or relocating it to force full lettering into frame.';
 return parkedWiperInstruction+' Create one1080x1920 portrait photographic input of '+m.vehicle+'. Composition: '+s.composition+'. Use the supplied original vehicle photos and original mark crops as actual image references. Preserve actual wheelbase, doors, grille geometry, lamp mounts, single emblems, wheel-center assembly and readable original lettering. Do not invent unseen parts or unreadable text. Keep a shared '+m.background.setting+' setting, '+m.background.weather+' weather and '+m.background.lighting+' light. Natural color, all lamps off. '+plate+' Verify the physical vehicle centerline from original grille/lamp/hood landmarks, not image center. Any original centerline hood emblem stays at its original surface position. Other badges remain wherever the actual source places them; do not invent an absent hood emblem. Account for lateral crop margins: retain the naturally expected part of an original badge without relocating it to force full lettering into frame. Perspective may project hood and bumper centers to different screen x positions. No mirrored lettering, duplicate parts, glow or artificial road reflections. Whole-car views retain both bumpers and all visible wheels with margins. Detail views may naturally crop physical parts. Review against originals before use.';
}
function run(ff,args){return new Promise((resolve,reject)=>{let stderr='';const p=spawn(ff,args);p.on('error',reject);p.stderr.on('data',d=>stderr+=d);p.on('close',code=>resolve({code,stderr}));});}
export async function probeMedia(file,ff){
 const r=await run(ff,['-hide_banner','-i',file]);
 const dims=r.stderr.match(/(?:Video:.*?)(\d{2,5})x(\d{2,5})(?:[ ,])/);
 if(!dims)throw Error('No readable media dimensions: '+file);
 const time=r.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
 return {width:Number(dims[1]),height:Number(dims[2]),duration:time?Number(time[1])*3600+Number(time[2])*60+Number(time[3]):null};
}
export async function validateAssets(m,base,stage,{probe}={}){
 const errors=[];const list=stage==='videos'?m.clips:m.sources;
 errors.push(...reviewWipers(list,{video:stage==='videos'}).errors);
 if(!list?.length)errors.push('No '+stage+' recorded');
 for(const item of list??[]){
  const id=item.id??item.sourceId;
  if(!text(item.file)){errors.push(id+': missing file');continue;}
  try{
   const file=path.resolve(base,item.file),actual=hash(await fs.readFile(file));
   if(item.sha256!==actual)errors.push(id+': missing or changed SHA256');
   const allowed=stage==='videos'?['pass','owner-selected']:['pass'];
   if(!allowed.includes(item.review?.status)||!text(item.review?.notes))errors.push(id+': review evidence required; selection is not image QA');
   const media=await (probe??(f=>probeMedia(f,m.ffmpeg)))(file);
   if(stage==='images'&&(media.width!==1080||media.height!==1920))errors.push(id+': image must be1080x1920');
   if(stage==='videos'&&(Math.abs(media.width/media.height-9/16)>.003||media.height<1900||!media.duration||media.duration<2.99||Math.abs(media.duration-item.duration)>.08))errors.push(id+': video metadata differs from native1080p9:16three-second record');
  }catch(e){errors.push(id+': '+e.message);}
 }
 return {valid:!errors.length,errors};
}
export function buildEditPlan(m,variant=m.edit?.variant??'compact'){
 if(!['native','balanced','compact'].includes(variant))throw Error('Unknown variant');
 if(!m.clips?.length)throw Error('No clips recorded');
 const fps=m.edit?.fps??24;if(fps!==24)throw Error('Current workflow requires24fps');
 if(m.edit?.zoom!==false||m.edit?.speed!==1)throw Error('Default assembly requires no added zoom and1x speed');
 const wanted=m.clips.map((c,i)=>{if(!(c.duration>=2.99&&c.duration<=3.1))throw Error('Clip duration too short or not native three seconds');return i===m.clips.length-1||variant==='native'?3:variant==='balanced'?2.5:1.8;});
 let accumulated=0,last=0;
 const clips=m.clips.map((c,i)=>{accumulated+=wanted[i]*fps;const next=Math.round(accumulated),frames=next-last;last=next;return {...c,frames,start:i===m.clips.length-1?0:Math.max(0,(3-frames/fps)/2)};});
 const fadeSeconds=m.edit?.fadeSeconds??.8;if(!(fadeSeconds>0&&fadeSeconds<3))throw Error('Invalid fade duration');
 return {clips,totalFrames:last,duration:last/fps,fps,speed:1,zoom:false,fadeSeconds,variant};
}
export async function assemble(m,base,output,variant){
 try{await fs.access(output);throw Error('Output already exists; choose a new versioned filename');}catch(e){if(e.code!=='ENOENT')throw e;}
 const structure=reviewStructure(m);const assets=await validateAssets(m,base,'videos');
 const errors=[...structure.errors,...assets.errors];if(errors.length)throw Error(errors.join('\n'));
 const plan=buildEditPlan(m,variant),args=[],filters=[];
 plan.clips.forEach((c,i)=>{args.push('-i',path.resolve(base,c.file));const startFrame=Math.round(c.start*24);const f='['+i+':v]fps=24,trim=start_frame='+startFrame+':end_frame='+(startFrame+c.frames)+',setpts=PTS-STARTPTS,scale=1080:1920,setsar=1,format=yuv420p';filters.push(f+'[v'+i+']');});
 filters.push(plan.clips.map((_,i)=>'[v'+i+']').join('')+'concat=n='+plan.clips.length+':v=1:a=0,fps=24,tpad=stop_mode=clone:stop_duration=0.083334,trim=end_frame='+plan.totalFrames+',setpts=N/(24*TB),fade=t=out:st='+(plan.duration-plan.fadeSeconds)+':d='+(plan.fadeSeconds-1/24)+'[out]');
 await fs.mkdir(path.dirname(output),{recursive:true});
 const result=await run(m.ffmpeg,['-n','-hide_banner','-loglevel','error',...args,'-filter_complex_threads','1','-filter_complex',filters.join(';'),'-map','[out]','-an','-r','24','-fps_mode','cfr','-frames:v',String(plan.totalFrames),'-c:v','libx264','-preset','fast','-crf','18','-threads','4','-pix_fmt','yuv420p','-movflags','+faststart',output]);
 if(result.code)throw Error(result.stderr);
 const decode=await run(m.ffmpeg,['-hide_banner','-loglevel','error','-i',output,'-f','null','-']);if(decode.code)throw Error(decode.stderr);
 const metadata=await probeMedia(output,m.ffmpeg);
 if(Math.abs(metadata.duration-plan.duration)>1/24)throw Error('Encoded duration differs from planned frame count');
 const receipt={plan,metadata,output,sha256:hash(await fs.readFile(output)),generationCalls:0,audio:'silent',verification:'full decode passed; inspect actual timeline before delivery',publication:'not-published'};
 await fs.writeFile(output+'.receipt.json',JSON.stringify(receipt,null,2));return receipt;
}
export async function main(args=process.argv.slice(2)){
 const [command,file,extra,variant]=args;if(!file)throw Error('Usage: advertising-workflow.mjs init|prompts|check-images|check-element|check-videos|assemble manifest.json [output] [native|balanced|compact]');
 if(command==='compositions'){await fs.writeFile(file,JSON.stringify(compositionOptions(),null,2),{flag:'wx'});return {file,status:'candidate vocabulary only; no images generated'};}
 if(command==='init'){const options=extra?JSON.parse(await fs.readFile(extra,'utf8')):{};await fs.mkdir(path.dirname(path.resolve(file)),{recursive:true});await fs.writeFile(file,JSON.stringify(createWorkflow(options.vehicle,options.elementName,options),null,2),{flag:'wx'});return {file,status:'example template; adapt composition selection; no remote operations'};}
 const m=JSON.parse(await fs.readFile(file,'utf8')),base=path.dirname(path.resolve(file)),structure=reviewStructure(m);
 if(command==='check-camera')return reviewCameraPlans(m);
 if(command==='check-layout')return reviewMarkLayouts(m);
 if(command==='check-wipers')return reviewWipers(m.sources);
 if(command==='prompts'){if(!structure.valid)throw Error(structure.errors.join('\n'));const out=extra??path.join(base,'kling-prompts.txt');await fs.writeFile(out,m.sources.map(s=>s.id+'\nStart Frame: '+s.file+'\nIMAGE PREPARATION:\n'+buildImagePrompt(m,s)+'\nVIDEO PROMPT:\n'+buildPrompt(m,s)).join('\n\n')+'\n\nElement name: '+m.element.name+'\nElement description: '+m.element.description+'\nFour exterior inputs: '+m.element.sourceIds.join(', ')+'\nSelect actual @Element using picker. Generation: Kling3.0,3s,1080p,9:16,one output,MultiShotOFF,audioOFF. Fade is local.\n',{flag:'wx'});return {out};}
 if(command==='check-element'){
  const selected={...m,sources:m.sources.filter(s=>m.element.sourceIds.includes(s.id))};
  const result=await validateAssets(selected,base,'images');const errors=[...structure.errors,...result.errors];
  if(!text(m.element.registrationEvidence)||!text(m.element.bindingEvidence))errors.push('Observed Element registration and actual picker binding evidence required');
  return {valid:!errors.length,errors,note:'Record/hash checks only. Verify live price and reserve spend ledger separately; this command never generates.'};
 }
 if(command==='check-images'||command==='check-videos'){const result=await validateAssets(m,base,command==='check-images'?'images':'videos');return {valid:structure.valid&&result.valid,errors:[...structure.errors,...result.errors],note:'Metadata/hash checks do not inspect pixels; no remote generation or publication.'};}
 if(command==='assemble'){if(!extra)throw Error('Output MP4 path required');return await assemble(m,base,path.resolve(extra),variant);}
 throw Error('Unknown command');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{const r=await main();console.log(JSON.stringify(r,null,2));if(r.valid===false)process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=1;}}
