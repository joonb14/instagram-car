import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewPlan } from './review-advertising-plan.mjs';
const shot = (id, role, framing = 'detail') => ({ id, role, framing, source: 'original photo ledger', purpose: 'Source-backed vehicle feature', cameraMovement: 'Visible lateral parallax; parked vehicle', duration: 1.6 });
const plan = () => ({ mode: 'vehicle-advertising', vehicle: '1989 BMW 325iX', sourceArticle: 'verified article URL', creativeRationale: 'Wide cabin and rain detail show this build beyond the reference.', variationFromRecent: 'Open with roof detail rather than repeat reference lamp opening.', background: {setting:'brick courtyard',lighting:'cool diffuse',weather:'dry',rationale:'Original photo location suits this car'}, requireWideInterior: true, shots: [shot('roof', 'pillar'), shot('cabin', 'interior', 'wide'), shot('engine', 'engine'), shot('close', 'exterior', 'wide')] });
test('original project-specific additions pass without copying reference order/count/duration', () => {
  assert.equal(reviewPlan(plan()).valid, true);
});
test('steering macro cannot satisfy a requested wide cabin', () => {
  const p = plan(); p.shots[1].framing = 'detail';
  assert.equal(reviewPlan(p).valid, false);
});
test('actual repeated sequence warns, does not force randomness or pretend aesthetic rejection', () => {
  const p = plan(); const r = reviewPlan(p, [{ id: 'prior', status: 'reviewed-export', shots: p.shots }]);
  assert.equal(r.valid, true); assert.equal(r.warnings.length, 1);
  assert.equal(reviewPlan(p, [{ status: 'draft', shots: p.shots }]).warnings.length, 0);
});
test('missing rationale, duplicate IDs and invalid timing fail', () => {
  const p = plan(); delete p.creativeRationale; p.shots[1].id = 'roof'; p.shots[0].duration = 0;
  assert.equal(reviewPlan(p).errors.length, 3);
});
test('rain is optional and repeated wet concepts warn without a forced rotation', () => {
  const p = plan(); p.background.weather = 'rain';
  const history = [1,2].map(id => ({id, status:'reviewed-export', background:{weather:'wet'}}));
  assert.equal(reviewPlan(p, history).warnings.length, 1);
  p.background.weather = 'dry'; assert.equal(reviewPlan(p, history).warnings.length, 0);
});
