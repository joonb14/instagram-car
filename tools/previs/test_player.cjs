const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeTimeline, locateTime, nextCut } = require('./player.js');
const fs = require('node:fs');
const path = require('node:path');

const library = process.argv[2];
if (!library) throw new Error('Usage: node tools/previs/test_player.cjs <library>');
const manifest = JSON.parse(fs.readFileSync(path.join(library, 'manifest.json'), 'utf8'));
const shots = manifest.shots;

test('scrubbing seeks into every real cut and uses the new cut at each boundary', () => {
  const timeline = makeTimeline(shots);
  timeline.forEach((entry, i) => {
    assert.equal(locateTime(timeline, entry.start).index, i);
    assert.equal(locateTime(timeline, entry.start + entry.duration / 2).index, i);
    assert.ok(Math.abs(locateTime(timeline, entry.start + entry.duration / 2).offset - entry.duration / 2) < 1e-8);
    assert.equal(locateTime(timeline, entry.end - 1 / 60).index, i);
  });
  assert.equal(locateTime(timeline, -1).offset, 0);
  assert.equal(locateTime(timeline, 999).index, shots.length - 1);
  assert.equal(locateTime([], 0), null);
});

test('all three collections start at zero and retain authored order and duration', () => {
  for (const group of ['A', 'B', 'C']) {
    const subset = shots.filter(s => s.id.startsWith(group));
    const timeline = makeTimeline(subset);
    assert.equal(timeline[0].start, 0);
    assert.deepEqual(timeline.map(e => e.shot.id), subset.map(s => s.id));
    assert.ok(Math.abs(timeline.at(-1).end - subset.reduce((sum, s) => sum + s.duration, 0)) < 1e-8);
  }
});

test('single-cut, continuous, last-cut stop and repeat behavior stay distinct', () => {
  for (let i = 0; i < shots.length - 1; i++) assert.equal(nextCut(i, shots.length, true, false), i + 1);
  assert.equal(nextCut(0, shots.length, false, true), null);
  assert.equal(nextCut(shots.length - 1, shots.length, true, false), null);
  assert.equal(nextCut(shots.length - 1, shots.length, true, true), 0);
  assert.equal(nextCut(0, 1, true, true), 0);
  assert.equal(nextCut(0, 0, true, true), null);
});

test('standalone generated player binds every cut to its real files and exact prompt', () => {
  const html = fs.readFileSync(path.join(library, 'index.html'), 'utf8');
  const data = JSON.parse(html.match(/<script id="manifest" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.shots.length, 31);
  assert.ok(!html.includes('__MANIFEST_JSON__'));
  assert.ok(!html.includes('/*__JS__*/'));
  assert.ok(!html.includes('/*__CSS__*/'));
  for (const shot of data.shots) {
    assert.ok(shot.description_ko);
    assert.ok(shot.photo_label);
    for (const field of ['clip', 'mid_frame', 'start_frame']) assert.ok(fs.existsSync(path.join(library, shot[field])), `${shot.id}/${field}`);
    assert.equal(shot.prompt, fs.readFileSync(path.join(library, shot.id, 'prompt.txt'), 'utf8').replace(/\r\n/g, '\n'));
  }
  assert.ok(fs.existsSync(path.join(library, 'catalog.html')));
});
