import {readFile,writeFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
export const restorationStageOrder=['exterior-before','exterior-work','exterior-after','engine-before','engine-work','engine-after','cabin-before','cabin-work','cabin-after'];
export function orderRestorationShots(shots,{missingStages={}}={}){
 if(!Array.isArray(shots))throw Error('Restoration shots required');
 for(const s of shots)if(s.thumbnailOnly||s.storyStage==='thumbnail')throw Error('Thumbnail assets must remain separate from the video timeline');
 for(const s of shots)if(!restorationStageOrder.includes(s.storyStage))throw Error('Unknown restoration stage: '+s.storyStage);
 for(const stage of restorationStageOrder)if(!shots.some(s=>s.storyStage===stage)&&!(typeof missingStages[stage]==='string'&&missingStages[stage].trim()))throw Error('Missing documented stage: '+stage);
 for(const [stage,reason] of Object.entries(missingStages))if(!restorationStageOrder.includes(stage)||!String(reason).trim()||shots.some(s=>s.storyStage===stage))throw Error('Invalid missing-stage evidence: '+stage);
 return [...shots].sort((a,b)=>restorationStageOrder.indexOf(a.storyStage)-restorationStageOrder.indexOf(b.storyStage));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const[input,output]=process.argv.slice(2);if(!output)throw Error('Usage: restoration-sequence.mjs recipe.json ordered.json');const c=JSON.parse(await readFile(input,'utf8'));c.shots=orderRestorationShots(c.shots,{missingStages:c.missingStages});await writeFile(output,JSON.stringify(c,null,2)+'\n');console.log(c.shots.map(s=>s.storyStage));}
