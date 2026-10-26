import {readFile,writeFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
export function retimeExterior(config,factor){
 if(!Number.isFinite(factor)||factor<1||factor>2)throw Error('Exterior speed must be between 1 and 2');
 const result=structuredClone(config),fps=result.fps??24,changed=[];
 if(!Number.isInteger(fps)||fps<=0)throw Error('Valid fps required');
 for(let i=0;i<result.shots.length;i++){const shot=result.shots[i];if(shot.motionRole!=='exterior-pan')continue;
  if(shot.comparison||!shot.pan||!(shot.duration>0))throw Error('Exterior pan requires a positive duration and explicit path');
  const base=shot.duration;shot.duration=Math.round(base/factor*fps)/fps;if(shot.duration<.5)throw Error('Retimed shot is too short');
  changed.push({index:i,baselineDuration:base,duration:shot.duration,requestedFactor:factor,actualFactor:base/shot.duration});
 }
 if(!changed.length)throw Error('Explicit exterior-pan motionRole required; other shots are never inferred');
 result.timingReview={status:'comparison-draft',exteriorSpeedFactor:factor,changed,interiorTimingUnchanged:true,pathAndEasingUnchanged:true};return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const[input,factor,output]=process.argv.slice(2);if(!output)throw Error('Usage: retime-exterior.mjs input.json factor output.json');const result=retimeExterior(JSON.parse(await readFile(input,'utf8')),Number(factor));await writeFile(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.timingReview));}
