import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import {validateIdentityMap} from './vehicle-identity-map.mjs';

export async function validateReferences(record, base = process.cwd()) {
  const errors = [], hashes = new Map();
  const hashFile = async (file, label) => {
    if (!file) { errors.push(`${label}: file required`); return null; }
    try {
      const key = path.resolve(base, file);
      const hash = crypto.createHash('sha256').update(await fs.readFile(key)).digest('hex');
      hashes.set(key, hash); return hash;
    } catch { errors.push(`${label}: cannot read file ${file}`); return null; }
  };
  if (!['prepared', 'submitted'].includes(record.stage)) errors.push('stage must be prepared or submitted');
  if (!record.inventoryReviewedAt || !record.inventoryNotes) errors.push('Original-image visible-mark inventory review required, even if no marks are visible');
  if (!Array.isArray(record.visibleMarks)) errors.push('visibleMarks inventory required');
  if (!Array.isArray(record.inputFiles) || !record.inputFiles.length) errors.push('Actual prepared/submitted inputFiles required');
  for (const file of record.inputFiles ?? []) await hashFile(file, 'input');
  const inputSet = new Set((record.inputFiles ?? []).map(file => path.resolve(base, file)));
  if (!record.vehicleSourceFile || !inputSet.has(path.resolve(base, record.vehicleSourceFile))) errors.push('Original vehicle reference must be an actual image input');
  let identitySpec,identityBase;const requireMap=record.identityMapRequired!==false;
  if(requireMap || record.identityMapFile){
    if(!record.identityMapFile||!record.identityMapHash)errors.push('Current inspected identity map file/hash required before new vehicle image generation');
    else try{
      const mapFile=path.resolve(base,record.identityMapFile),bytes=await fs.readFile(mapFile);identityBase=path.dirname(mapFile);
      if(crypto.createHash('sha256').update(bytes).digest('hex')!==record.identityMapHash)errors.push('Stale identity map hash; review changed reference specification');
      identitySpec=JSON.parse(bytes);const review=await validateIdentityMap(identitySpec,{base:identityBase});errors.push(...review.errors.map(e=>'identity map: '+e));
      if(!record.vehicleSourceFile||!identitySpec.sources?.some(s=>path.resolve(identityBase,s.file)===path.resolve(base,record.vehicleSourceFile)))errors.push('Actual vehicle input is not an original in this identity map');
    }catch(e){errors.push('Cannot inspect identity map: '+e.message);}
  }
  const ids = new Set();
  for (const mark of record.visibleMarks ?? []) {
    if (!mark.id || ids.has(mark.id)) errors.push('Visible mark id missing or duplicated');
    ids.add(mark.id);
    if (!mark.detail || !mark.reviewNotes) errors.push(`${mark.id}: actual source observation required`);
    if(requireMap||record.identityMapFile){
      const p=identitySpec?.parts?.find(p=>p.id===mark.identityPartId);
      if(!p||p.presence!=='present'||!p.observations?.some(o=>{const s=identitySpec.sources?.find(s=>s.id===o.sourceId);return s&&mark.sourceFile&&path.resolve(identityBase,s.file)===path.resolve(base,mark.sourceFile);}))errors.push(`${mark.id}: visible mark must reference an observed identity part on the actual original source`);
    }
    if (!['readable', 'unresolved'].includes(mark.legibility)) errors.push(`${mark.id}: legibility must be readable or unresolved; do not guess`);
    if (mark.legibility === 'readable' && !mark.observedTextOrPattern) errors.push(`${mark.id}: source-supported text/pattern required`);
    const originalHash = await hashFile(mark.sourceFile, `${mark.id} original`);
    const cropHash = await hashFile(mark.referenceFile, `${mark.id} original-photo crop`);
    if (originalHash !== mark.sourceHash || cropHash !== mark.referenceHash) errors.push(`${mark.id}: missing or stale original/crop hash; inspect changed pixels`);
    if (!Array.isArray(mark.crop) || mark.crop.length !== 4 || mark.crop.some(n => !Number.isFinite(n)) || mark.crop[0] < 0 || mark.crop[1] < 0 || mark.crop[2] <= 0 || mark.crop[3] <= 0) errors.push(`${mark.id}: original-pixel crop [x,y,width,height] required`);
    if (!mark.referenceFile || !inputSet.has(path.resolve(base, mark.referenceFile))) errors.push(`${mark.id}: original-photo crop omitted from actual image inputs`);
    if (mark.artworkFile) {
      const artworkHash = await hashFile(mark.artworkFile, `${mark.id} artwork`);
      if (artworkHash !== mark.artworkHash || !mark.artworkSourceUrl || !mark.artworkReviewNotes) errors.push(`${mark.id}: artwork hash, source and matching-design review required`);
      if (!inputSet.has(path.resolve(base, mark.artworkFile))) errors.push(`${mark.id}: declared artwork omitted from inputs`);
    }
  }
  if (record.stage === 'submitted' && (!record.submissionId || !record.submissionEvidence)) errors.push('Submitted audit requires observed tool/job id and evidence, never a planned request');
  return { ok: !errors.length, errors, reviewedMarks: [...ids], inputHashes: Object.fromEntries(hashes), identityMapRequired:requireMap, legacyIntegrityOnly:!requireMap, scope: 'Record/input-integrity audit only: cannot prove crop content, complete visual inventory, or visual fidelity. Explicit legacy mode is historical integrity only, not readiness for new generation. Inspect actual pixels and real tool arguments.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const file = process.argv[2];
  if (!file) throw Error('Usage: validate-image-references.mjs manifest.json');
  const result = await validateReferences(JSON.parse(await fs.readFile(file, 'utf8')), path.dirname(path.resolve(file)));
  console.log(JSON.stringify(result, null, 2)); if (!result.ok) process.exitCode = 1;
}
