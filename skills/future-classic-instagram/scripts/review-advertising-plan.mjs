import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function reviewPlan(plan, history = []) {
  const errors = [], warnings = [];
  const text = v => typeof v === 'string' && v.trim().length > 0;
  if (plan.mode !== 'vehicle-advertising') errors.push('Use mode vehicle-advertising; documentary stage sorting is a separate workflow.');
  for (const field of ['vehicle', 'sourceArticle', 'creativeRationale', 'variationFromRecent']) {
    if (!text(plan[field])) errors.push(`Missing ${field}`);
  }
  for (const field of ['setting', 'lighting', 'weather', 'rationale']) {
    if (!text(plan.background?.[field])) errors.push(`Missing background.${field}`);
  }
  if (!Array.isArray(plan.shots) || !plan.shots.length) errors.push('No shots planned');
  const shots = Array.isArray(plan.shots) ? plan.shots : [];
  const ids = new Set();
  for (const [i, shot] of shots.entries()) {
    for (const field of ['id', 'role', 'source', 'purpose', 'framing', 'cameraMovement']) {
      if (!text(shot[field])) errors.push(`Shot ${i + 1}: missing ${field}`);
    }
    if (ids.has(shot.id)) errors.push(`Duplicate shot id ${shot.id}`);
    ids.add(shot.id);
    if (!Number.isFinite(shot.duration) || shot.duration <= 0) errors.push(`Shot ${i + 1}: invalid duration`);
  }
  if (plan.requireWideInterior && !shots.some(s => s.role === 'interior' && s.framing === 'wide')) {
    errors.push('Requested wide interior is missing; a steering macro does not satisfy it.');
  }
  const signature = shots.map(s => s.role).join(' > ');
  for (const prior of history.slice(-3)) {
    if (prior.status !== 'reviewed-export') continue;
    const previous = (prior.shots ?? []).map(s => s.role).join(' > ');
    if (signature && previous === signature) warnings.push(`Same role order as reviewed export ${prior.id ?? 'unknown'}: review actual films and justify repetition or revise.`);
    if (plan.background?.setting && prior.background?.setting === plan.background.setting && prior.background?.lighting === plan.background.lighting) warnings.push(`Repeated setting/lighting from ${prior.id ?? 'unknown'}: compare actual exports; change or justify for this vehicle.`);
  }
  const recentExports = history.filter(p => p.status === 'reviewed-export').slice(-2);
  const wet = v => /rain|wet|damp/i.test(v ?? '') && !/^(dry|none)$/i.test(v ?? '');
  if (wet(plan.background?.weather) && recentExports.length === 2 && recentExports.every(p => wet(p.background?.weather))) warnings.push('Three consecutive wet/rain concepts: rain is occasional, review whether a dry treatment better serves this car.');
  return { valid: !errors.length, errors, warnings, durationSeconds: shots.reduce((n, s) => n + (Number.isFinite(s.duration) ? s.duration : 0), 0), roleOrder: signature, note: 'Planning records only. Does not inspect images, certify originality, authorize spending, or approve QA/publication.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [file, historyFile] = process.argv.slice(2);
  if (!file) throw Error('Usage: review-advertising-plan.mjs plan.json [history.json]');
  const result = reviewPlan(JSON.parse(await fs.readFile(file, 'utf8')), historyFile ? JSON.parse(await fs.readFile(historyFile, 'utf8')) : []);
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}
