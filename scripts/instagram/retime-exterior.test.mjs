import test from 'node:test';import assert from 'node:assert/strict';import {retimeExterior} from './retime-exterior.mjs';
test('only explicitly marked exterior pans accelerate; source, path, easing and cabin timing remain intact',()=>{
 const c={fps:24,shots:[{file:'front.png',motionRole:'exterior-pan',duration:8,pan:{from:[.2,.5],to:[.8,.5]},zoom:[1,1]},{file:'cabin.png',duration:8,comparison:{wipeStart:2,wipeDuration:2.4}},{file:'rear.png',motionRole:'exterior-pan',duration:8,pan:{from:[.8,.5],to:[.2,.5]}}]},before=structuredClone(c);
 for(const speed of [1.3,1.4,1.5]){const r=retimeExterior(c,speed);assert.deepEqual(r.shots[1],c.shots[1]);for(const i of [0,2]){assert.deepEqual({...r.shots[i],duration:8},c.shots[i]);assert.ok(Math.abs(r.shots[i].duration-8/speed)<=.5/24+1e-8);}assert.equal(r.timingReview.changed.length,2);}
 assert.deepEqual(c,before);assert.throws(()=>retimeExterior({shots:[{duration:8}]},1.4),/Explicit/);assert.throws(()=>retimeExterior(c,NaN),/speed/);
});
