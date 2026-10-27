import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
export async function reviewElementWorkflow(m) {
 const errors=[]; const roles=['front-half','front-low','rear-three-quarter','whole-car','hood-emblem','hood-emblem-grille'];
 const sources=Array.isArray(m.sources)?m.sources:[];
 if(m.profile!=='owner-six-source-element') errors.push('Unknown source profile');
 for(const role of roles) if(!sources.some(s=>s.role===role))errors.push('Missing role: '+role);
 if(sources.length!==6)errors.push('This profile requires six sources; clips are counted separately');
 const ids=new Set();
 for(const s of sources){
  if(!s.id||ids.has(s.id))errors.push('Missing or duplicate source id');ids.add(s.id);
  if(!s.selectionEvidence)errors.push(s.id+': missing owner selection evidence');
  if(s.identityReview?.status!=='pass'||!s.identityReview?.evidence)errors.push(s.id+': independent identity pass required');
  try {const actual=crypto.createHash('sha256').update(await fs.readFile(s.path)).digest('hex');if(actual!==s.sha256)errors.push(s.id+': missing or changed input hash');}catch{errors.push(s.id+': source file unavailable');}
 }
 const element=m.element;
 if(!element?.name||!element?.registrationEvidence)errors.push('Actual registered Element evidence required');
 if(!element?.sourceIds?.length)errors.push('Element input source IDs required');
 for(const id of element?.sourceIds??[])if(!ids.has(id))errors.push('Element references unknown source: '+id);
 if(!Array.isArray(m.clips)||!m.clips.length)errors.push('No clips recorded');
 for(const c of m.clips??[]){
  if(!ids.has(c.startSourceId))errors.push('Clip has unknown start source');
  if(c.elementName!==element?.name||!c.bindingEvidence)errors.push('Real Element picker binding evidence required');
  if(c.resolution!=='1080p'||c.aspectRatio!=='9:16'||c.outputs!==1)errors.push('Expected 1080p,9:16,one output');
  if(/kling.*[34]\.0/i.test(c.model??'')&&c.duration!==3)errors.push('Kling3/4 requires three seconds');
  if(c.multiShot!==false||c.nativeAudio!==false)errors.push('Single-shot silent settings required');
  if(!c.prompt?.trim())errors.push('English motion prompt required');
 }
 return {valid:!errors.length,errors,sourceCount:sources.length,clipCount:m.clips?.length??0,note:'Record and hash checks only, not visual certification or spending authorization'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=await reviewElementWorkflow(JSON.parse(await fs.readFile(process.argv[2],'utf8')));
 console.log(JSON.stringify(result,null,2));if(!result.valid)process.exitCode=1;
}
