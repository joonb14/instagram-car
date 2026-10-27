import test from 'node:test';
import assert from 'node:assert/strict';
import {planScene,scenes} from './creative-plan.mjs';
const base={selection:{status:'selected',candidateId:'TEST'},vehicleReference:'source-file'};
test('dry default and source setting require actual reference, not inherited wet E30 treatment',()=>{
 assert.notEqual(planScene(base).sceneId,'original');
 assert.equal(planScene({...base,sceneId:'harbor'}).weather,'dry');
 assert.throws(()=>planScene({...base,sceneId:'original'}),/sourceBackgroundReference/);
 assert.equal(planScene({...base,sceneId:'original',sourceBackgroundReference:'reviewed-source.jpg'}).atmosphere,'source-matched');
});
test('bright/dark, green rural, factory and harbor are choices, not a fixed rotation',()=>{
 for(const id of ['rural','factory','harbor'])assert.ok(scenes.some(s=>s.id===id));
 assert.equal(planScene({...base,sceneId:'factory',atmosphere:'bright'}).atmosphere,'bright');
 assert.equal(planScene({...base,sceneId:'harbor',atmosphere:'dark',weather:'rain'}).weather,'rain');
});
