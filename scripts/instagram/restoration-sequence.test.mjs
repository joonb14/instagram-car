import test from 'node:test';import assert from 'node:assert/strict';
import {orderRestorationShots,restorationStageOrder} from './restoration-sequence.mjs';
test('restoration narrative starts directly with exterior before and rejects thumbnail inserts',()=>{
 const shots=[...restorationStageOrder].reverse().map(storyStage=>({storyStage,file:storyStage+'.png'}));const result=orderRestorationShots(shots);assert.deepEqual(result.map(s=>s.storyStage),restorationStageOrder);assert.equal(shots[0].storyStage,'cabin-after');
 assert.throws(()=>orderRestorationShots(shots.filter(s=>s.storyStage!=='engine-before')),/Missing documented stage/);
 assert.throws(()=>orderRestorationShots([...shots,{storyStage:'imagined-work'}]),/Unknown restoration stage/);
 const missing=shots.filter(s=>s.storyStage!=='engine-before');
 assert.equal(result[0].storyStage,'exterior-before');
 assert.throws(()=>orderRestorationShots([{storyStage:'thumbnail'},...shots]),/thumbnail.*separate/i);
 assert.equal(orderRestorationShots(missing,{missingStages:{'engine-before':'No genuine engine-bay before photo in the captured source'}}).length,8);
 assert.throws(()=>orderRestorationShots(shots,{missingStages:{'engine-before':'Absent'}}),/Invalid missing-stage/);
});
