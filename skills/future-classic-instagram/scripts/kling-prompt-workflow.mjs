import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
const text=x=>typeof x==='string'&&x.trim().length>0;
export function lintPrompt(prompt){
 const errors=[],warnings=[],orbit=/\borbit\w*\b|circular (?:arc|path)|\barc around\b/i.test(prompt);
 if(orbit&&/fixed camera position|camera (?:remains|stays) (?:fixed|static|locked)|locked[- ]off camera/i.test(prompt))errors.push('Orbit conflicts with a fixed camera position');
 if(orbit&&/(?:background pixels|background at identical pixels).{0,40}(?:unchanged|fixed|locked)|(?:unchanged|fixed).{0,30}background pixels/i.test(prompt))errors.push('Orbit requires scene parallax, not fixed background pixels');
 if(orbit&&/\bzoom (?:in|out)\b|\bdolly (?:in|out|forward|backward)\b/i.test(prompt))errors.push('Competing orbit and zoom/dolly instructions');
 if(new Set(prompt.match(/@[A-Za-z0-9_]+/g)??[]).size>1)errors.push('This profile uses one vehicle Element per clip; prepare Before and After separately');
 if((prompt.match(/\bno\b|do not|never/gi)??[]).length>=3)warnings.push('Negative-heavy text: prefer visible desired states; keep failure inventory in QA');
 const wordCount=prompt.trim().split(/\s+/).filter(Boolean).length;if(wordCount>140)warnings.push('Long prompt: review repeated identity inventory and conflicting movement clauses; this is an editorial guideline, not a provider limit');
 return {valid:!errors.length,errors,warnings,wordCount};
}
export function preparePrompt(p){
 const errors=[],warnings=[],c=p.camera??{};
 for(const key of ['subject','elementName','scene'])if(!text(p[key]))errors.push(key+' required');
 if(!['before','after','finished'].includes(p.stage))errors.push('Explicit restoration stage required');
 if(c.kind!=='orbit')errors.push('This parked-car profile supports one orbit; other moves require a deliberately different plan');
 for(const key of ['referenceFrame','direction','anchor','reveal','framing'])if(!text(c[key]))errors.push('camera.'+key+' required');
 if(/^(?:left|right|clockwise|counterclockwise)$/i.test((c.direction??'').trim()))errors.push('Direction needs a physical destination, not LEFT/RIGHT alone');
 if(!['subtle','small'].includes(c.extent))errors.push('Choose a restrained extent, not a broad rotation');
 if(/tight|macro|close|half/i.test(c.framing??'')&&c.extent!=='subtle')errors.push('Tight/detail crops require a subtle orbit; wide-shot range is not inherited');
 if(c.pace!=='gentle')errors.push('Record a gentle, constant angular pace for this profile');
 if(c.degrees!==undefined)warnings.push('Numeric angle is unverified and omitted from the prompt; use actual measured/reviewed test evidence before treating it as calibrated');
 for(const key of ['input','element'])if(p.reviews?.[key]?.status!=='pass'||!text(p.reviews?.[key]?.notes))errors.push('Reviewed '+key+' required; prompt cannot repair a bad still or Element');
 if(p.visibleWipers&&p.reviews?.wipers?.status!=='pass')errors.push('Visible parked wipers require a separate visual review before readiness');
 const settings={model:'Kling3.0',seconds:3,resolution:'1080p',aspectRatio:'9:16',outputs:1,multiShot:false,nativeAudio:false};
 for(const [key,value]of Object.entries(settings))if(p.settings?.[key]!==value)errors.push('Expected settings.'+key+'='+value);
 const details=p.details??[];if(!Array.isArray(details)||details.length>2||details.some(d=>!text(d)))errors.push('Use at most two relevant visible-detail sentences; keep the full identity inventory in QA');
 const arc=c.extent==='subtle'?'a short arc':'a small arc';
 const detailText=Array.isArray(details)&&details.length?details.join(' '):'Preserve the original body proportions and existing visible parts.';
 const prompt=`The camera moves at a slow, steady pace along ${arc} around the ${c.anchor??'vehicle'} ${c.direction??''} over three seconds, revealing ${c.reveal??''}. Use @${p.elementName??'Element'} as the same single parked ${p.subject??'vehicle'} shown in the starting frame. Keep the same camera height and focal length. Maintain the ${c.framing??'existing framing'}. ${detailText} Let details follow perspective and natural occlusion; do not add or duplicate parts or text. ${p.visibleWipers?'Keep the wipers switched off at their source-documented resting positions and angles. ':''}All lamps remain off. Maintain natural colors and exposure. Only the camera moves; the car and wheels remain stationary. One continuous shot, no zoom, cuts or fading.`.replace(/\s+/g,' ').trim();
 const lint=lintPrompt(prompt);errors.push(...lint.errors);warnings.push(...lint.warnings);
 return {ready:!errors.length,status:errors.length?'hold':'prepared-not-provider-verified',prompt,errors,warnings,wordCount:lint.wordCount,settings,motion:{pace:'slow-steady',extent:c.extent},promptBasis:'owner-reported-successful-964-structure; Jeep adaptation unverified',scope:'Text and recorded-review check only; not visual certification or permission to generate.',generationCalls:0};
}
export async function main(args=process.argv.slice(2)){
 const [command,file,out]=args;if(!file)throw Error('Usage: kling-prompt-workflow.mjs build plan.json output.json | lint prompt.txt');
 if(command==='lint')return lintPrompt(await fs.readFile(file,'utf8'));
 if(command!=='build'||!out)throw Error('Build requires a new output JSON');const p=JSON.parse(await fs.readFile(file,'utf8')),r=preparePrompt(p);
 // A record must identify the exact reviewed bytes. The CLI never accepts a pass for changed files.
 for(const ref of p.reviewedFiles??[]){try{const hash=crypto.createHash('sha256').update(await fs.readFile(path.resolve(path.dirname(file),ref.file))).digest('hex');if(ref.status!=='pass'||hash!==ref.sha256){r.errors.push('Stale/held reviewed file: '+ref.file);r.ready=false;}}catch{r.errors.push('Unreadable reviewed file: '+ref.file);r.ready=false;}}
 if(!p.reviewedFiles?.length){r.errors.push('CLI requires reviewed input and Element file hashes');r.ready=false;}
 const starts=(p.reviewedFiles??[]).filter(f=>f.role==='start'),elements=(p.reviewedFiles??[]).filter(f=>f.role==='element');
 if(starts.length!==1||elements.length!==4||new Set(elements.map(f=>path.resolve(path.dirname(file),f.file))).size!==4){r.errors.push('One start and four distinct Element files required');r.ready=false;}
 if((p.reviewedFiles??[]).some(f=>!['start','element'].includes(f.role)||f.stage!==p.stage)){r.errors.push('Reviewed files must match the same restoration stage');r.ready=false;}
 if(!r.ready)r.status='hold';await fs.writeFile(out,JSON.stringify(r,null,2),{flag:'wx'});return r;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{const r=await main();console.log(JSON.stringify(r,null,2));if(r.ready===false||r.valid===false)process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=1;}}
