import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Validates a human visual-review record; does not inspect pixels or certify fidelity.
const input = process.argv[2];
if (!input) throw new Error('Usage: node validate-video-inputs.mjs review.json');
const reviewPath = path.resolve(input);
const review = JSON.parse(await fs.readFile(reviewPath, 'utf8'));
const errors = [];
const selected = review.shots?.filter(s => s.selectedForVideo === true) ?? [];
if (!selected.length) errors.push('No explicitly selected video inputs');
if (review.requireInterior && !selected.some(s => s.role === 'interior')) errors.push('Required interior shot missing');
for (const shot of selected) {
  const label = shot.id ?? shot.file ?? 'unnamed';
  if (shot.status !== 'pass') errors.push(`${label}: status must be pass, observed ${shot.status}`);
  if (shot.method !== 'original-preserved') {
    if (!shot.lightingReview?.treatment || !shot.lightingReview?.reviewedAt || !shot.lightingReview?.sourceComparison) errors.push(`${label}: per-angle lighting/reflection review and source comparison required`);
    for (const surface of ['body', 'glazing', 'lamp-lenses', 'ground', 'background']) {
      const checks = (shot.lightingReview?.surfaces ?? []).filter(c => c.surface === surface);
      if (checks.length !== 1 || checks[0]?.status !== 'pass' || !checks[0]?.observation) errors.push(`${label}: ${surface} reflection/emission observation must independently pass; lights OFF alone is insufficient`);
    }
    if (!Array.isArray(shot.lightingReview?.evidenceFiles) || !shot.lightingReview.evidenceFiles.length) errors.push(`${label}: actual reviewed lighting evidence files required`);
    for (const evidence of shot.lightingReview?.evidenceFiles ?? []) {
      try { await fs.access(path.resolve(path.dirname(reviewPath), evidence)); } catch { errors.push(`${label}: lighting evidence missing ${evidence}`); }
    }
  }
  if (!shot.source?.file || !shot.source?.postUrl) errors.push(`${label}: original source file and post URL required`);
  if (!shot.visualReview?.reviewedAt || !shot.visualReview?.notes) errors.push(`${label}: actual visual-review record required`);
  for (const key of ['identityChecks', 'lightingChecks']) {
    if (!Array.isArray(shot[key]) || !shot[key].length) errors.push(`${label}: ${key} required`);
    for (const check of shot[key] ?? []) {
      if (check.status !== 'pass' && !(check.status === 'source-unresolved-unchanged' && shot.method === 'original-preserved')) errors.push(`${label}: ${check.detail ?? key} unresolved/failed`);
      if (!check.note) errors.push(`${label}: review observation missing for ${check.detail ?? key}`);
    }
  }
  try {
    const bytes = await fs.readFile(path.resolve(path.dirname(reviewPath), shot.file));
    const hash = crypto.createHash('sha256').update(bytes).digest('hex');
    if (hash !== shot.reviewedFileHash) errors.push(`${label}: reviewed file hash missing or changed; re-review actual saved file`);
    if (shot.source?.file) await fs.access(path.resolve(path.dirname(reviewPath), shot.source.file));
  } catch (error) { errors.push(`${label}: ${error.message}`); }
}
console.log(JSON.stringify({ok: errors.length === 0, selected: selected.map(s => s.id), errors, scope: 'Review-record and file-integrity gate only; not automated visual certification'}, null, 2));
if (errors.length) process.exitCode = 1;
