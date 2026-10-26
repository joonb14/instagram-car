import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const text = x => typeof x === 'string' && x.trim().length > 0;
const point = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const round = n => Math.round(n * 10) / 10;

export function gridLocation(polygon, source, divisions = 20) {
  if (!Number.isInteger(divisions) || divisions < 2 || divisions > 100 || !(source.width > 0 && source.height > 0)) throw Error('Invalid dimensions or grid divisions');
  if (!Array.isArray(polygon) || polygon.length < 3 || polygon.some(p => !point(p) || p[0] < 0 || p[1] < 0 || p[0] > source.width || p[1] > source.height)) throw Error('Polygon outside source pixel bounds');
  const xs = polygon.map(p => p[0] / source.width * 1000), ys = polygon.map(p => p[1] / source.height * 1000);
  const x = [Math.min(...xs), Math.max(...xs)], y = [Math.min(...ys), Math.max(...ys)];
  if (x[0] === x[1] || y[0] === y[1]) throw Error('Degenerate polygon');
  const cells = range => [Math.min(divisions - 1, Math.floor(range[0] / 1000 * divisions + 1e-9)), Math.max(0, Math.ceil(range[1] / 1000 * divisions - 1e-9) - 1)];
  return { range1000: {x:x.map(round),y:y.map(round)}, cells:{x:cells(x),y:cells(y)}, divisions, convention:'Zero-based cells, half-open boundaries; image-left to image-right and top to bottom. Source-view evidence, not physical dimensions.' };
}

// Fit only the specified planar surface; points at other depths cannot share this transform.
export function rectifyPoint(quad, p) {
  if (!Array.isArray(quad) || quad.length !== 4 || quad.some(q => !point(q)) || !point(p)) throw Error('Four ordered plane corners and a point required');
  const signs = quad.map((a,i) => {const b=quad[(i+1)%4], c=quad[(i+2)%4]; return (b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);});
  if (signs.some(x => Math.abs(x)<1e-8) || !(signs.every(x=>x>0) || signs.every(x=>x<0))) throw Error('Invalid or degenerate plane quadrilateral');
  const a=[];
  quad.forEach(([x,y],i) => {const [u,v]=[[0,0],[1,0],[1,1],[0,1]][i];a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);});
  for (let col=0;col<8;col++) {
    let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
    if(Math.abs(a[pivot][col])<1e-12)throw Error('Singular or degenerate plane');
    [a[pivot],a[col]]=[a[col],a[pivot]];const scale=a[col][col];a[col]=a[col].map(v=>v/scale);
    for(let row=0;row<8;row++)if(row!==col){const factor=a[row][col];a[row]=a[row].map((v,k)=>v-factor*a[col][k]);}
  }
  const h=a.map(row=>row[8]), [x,y]=p, w=h[6]*x+h[7]*y+1;
  if(Math.abs(w)<1e-10)throw Error('Point at projective infinity');
  return [(h[0]*x+h[1]*y+h[2])/w*1000,(h[3]*x+h[4]*y+h[5])/w*1000];
}

export function reviewSymmetry(spec) {
  const errors=[],results=[], exceptions=spec.symmetry?.exceptions??[];
  for(const rule of spec.symmetry?.pairs??[]) {
    const fail = message => {errors.push(`${rule.id}: ${message}`);results.push({id:rule.id,status:'hold',reason:message});};
    const plane=spec.planes?.find(p=>p.id===rule.planeId),parts=(rule.partIds??[]).map(id=>spec.parts?.find(p=>p.id===id));
    if(!plane || plane.status!=='verified' || !text(plane.evidence) || !text(plane.centerlineEvidence)){fail('Verified planar calibration and physical centerline evidence required; do not compare raw perspective pixels');continue;}
    if(parts.length!==2 || parts.some(p=>!p) || parts.some(p=>p.surface!==plane.id)){fail('Paired landmarks must belong to the same surface/plane');continue;}
    if(parts.some(p=>exceptions.some(e=>e.partId===p.id))){fail('A documented asymmetric exception cannot also be forced into a symmetry pair');continue;}
    if(!(rule.tolerance1000>0 && rule.tolerance1000<=100) || !text(rule.toleranceNotes)){fail('An explicit reviewed annotation tolerance and rationale required');continue;}
    const obs=parts.map(p=>p.observations?.find(o=>o.sourceId===plane.sourceId));
    if(obs.some(o=>!point(o?.landmark))){fail('Both source-view landmark coordinates required');continue;}
    try {
      const locations=obs.map(o=>rectifyPoint(plane.quad,o.landmark));
      const horizontalResidual=Math.abs(locations[0][0]+locations[1][0]-1000),verticalResidual=Math.abs(locations[0][1]-locations[1][1]);
      results.push({id:rule.id,status:Math.max(horizontalResidual,verticalResidual)<=rule.tolerance1000?'within-recorded-tolerance':'hold',horizontalResidual1000:round(horizontalResidual),verticalResidual1000:round(verticalResidual),tolerance1000:rule.tolerance1000,scope:'Manually annotated points on this plane only; not automatic visual certification.'});
    } catch(e){fail(e.message);}
  }
  return {errors,results,exceptions};
}

export async function validateIdentityMap(spec,{base=process.cwd(),checkFiles=true}={}) {
  const errors=[], warnings=[];
  if(spec.schemaVersion!==1 || !text(spec.vehicle) || !['before','after','finished'].includes(spec.stage))errors.push('schemaVersion=1, vehicle and explicit stage required');
  for(const key of ['reviewedAt','coordinateConvention','inventoryNotes'])if(!text(spec[key]))errors.push(key+' required');
  if(!Number.isInteger(spec.gridDivisions) || spec.gridDivisions<2 || spec.gridDivisions>100)errors.push('gridDivisions must be 2–100');
  if(!Array.isArray(spec.sources)||!spec.sources.length)errors.push('Inspected original sources required');
  if(!Array.isArray(spec.parts)||!spec.parts.length)errors.push('Explicit part inventory required');
  const sourceIds=new Set(),partIds=new Set();
  for(const s of spec.sources??[]) {
    if(!text(s.id)||sourceIds.has(s.id))errors.push('Missing/duplicate source id');sourceIds.add(s.id);
    if(!text(s.file)||!text(s.view)||!text(s.notes)||!Number.isInteger(s.width)||!Number.isInteger(s.height)||s.width<=0||s.height<=0||!/^[0-9a-f]{64}$/.test(s.sha256??''))errors.push(`${s.id}: source file/hash/dimensions/view/inspection notes required`);
    if(checkFiles)try{const b=await fs.readFile(path.resolve(base,s.file));if(crypto.createHash('sha256').update(b).digest('hex')!==s.sha256)errors.push(`${s.id}: source hash changed`);if(b.length<24||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')errors.push(`${s.id}: use EXIF-normalized PNG evidence`);else if(b.readUInt32BE(16)!==s.width||b.readUInt32BE(20)!==s.height)errors.push(`${s.id}: source dimensions changed`);}catch(e){errors.push(`${s.id}: source unreadable: ${e.message}`);}
  }
  const regionIds=new Set();
  for(const r of spec.sourceRegions??[]) {
    const s=spec.sources?.find(s=>s.id===r.sourceId),b=r.rect;
    if(!text(r.id)||regionIds.has(r.id)||!s||r.basis!=='projected-image-region'||!text(r.notes)||!Array.isArray(b)||b.length!==4||b.some(n=>!Number.isFinite(n))||b[0]<0||b[1]<0||b[2]<=0||b[3]<=0||b[0]+b[2]>s?.width||b[1]+b[3]>s?.height)errors.push('Region needs unique id, source bounds and basis=projected-image-region; it is not a physical frontal calibration');
    regionIds.add(r.id);
  }
  for(const p of spec.parts??[]) {
    if(!text(p.id)||partIds.has(p.id))errors.push('Missing/duplicate part id');partIds.add(p.id);
    if(!text(p.surface)||!text(p.placement)||!['present','absent-in-original','unresolved'].includes(p.presence))errors.push(`${p.id}: surface, placement and source presence required`);
    if(p.presence==='present' && (!Number.isInteger(p.count)||p.count<1||!p.observations?.length))errors.push(`${p.id}: positive count and observed position required`);
    if(p.presence!=='present' && !p.evidenceSourceIds?.length)errors.push(`${p.id}: absent/unresolved evidence source IDs required`);
    for(const id of p.evidenceSourceIds??[])if(!sourceIds.has(id))errors.push(`${p.id}: unknown evidence source ${id}`);
    if(p.physicalRange1000)errors.push(`${p.id}: uncalibrated physicalRange1000 is not accepted; retain source pixels or use the documented same-plane landmark transform`);
    if(p.text && (!['readable','unresolved','not-lettering'].includes(p.text.legibility)||!text(p.text.notes)||(p.text.legibility==='readable'&&!text(p.text.value))||(p.text.legibility==='unresolved'&&p.text.value)))errors.push(`${p.id}: text needs source readability evidence; unresolved text has no invented value`);
    for(const o of p.observations??[]) {
      const s=spec.sources?.find(s=>s.id===o.sourceId);
      if(!s){errors.push(`${p.id}: unknown observation source`);continue;}
      try{gridLocation(o.polygon,s,spec.gridDivisions);}catch(e){errors.push(`${p.id}: ${e.message}`);}
      if(o.regionId){const r=spec.sourceRegions?.find(r=>r.id===o.regionId&&r.sourceId===s.id);if(!r)errors.push(`${p.id}: unknown source region`);else try{gridLocation(o.polygon.map(([x,y])=>[x-r.rect[0],y-r.rect[1]]),{width:r.rect[2],height:r.rect[3]},spec.gridDivisions);}catch(e){errors.push(`${p.id}: region ${e.message}`);}}
      if(!Number.isFinite(o.uncertaintyPx)||o.uncertaintyPx<0||!text(o.notes))errors.push(`${p.id}: annotation uncertainty and actual observation required`);
      if(o.landmark && (!point(o.landmark)||o.landmark[0]<0||o.landmark[1]<0||o.landmark[0]>s.width||o.landmark[1]>s.height))errors.push(`${p.id}: landmark outside source`);
    }
    if(p.presence==='unresolved')warnings.push(`${p.id}: unresolved presence; inspect another original before generating this region`);
  }
  for(const e of spec.symmetry?.exceptions??[])if(!partIds.has(e.partId)||!text(e.reason)||!e.evidenceSourceIds?.length||e.evidenceSourceIds.some(id=>!sourceIds.has(id)))errors.push('Asymmetry exception needs actual part, source IDs and evidence reason');
  const symmetry=reviewSymmetry(spec);errors.push(...symmetry.errors);
  for(const r of symmetry.results)if(r.status==='hold')errors.push(`Symmetry pair ${r.id} is held; inspect source, annotation and image geometry before generation`);
  if(!symmetry.results.length)warnings.push('No calibrated numeric symmetry verdict. Image-grid locations do not establish physical symmetry.');
  return {valid:!errors.length,errors,warnings,symmetry,scope:'Evidence/schema/hash check only. Not a visual pass, completeness proof or authority to generate.'};
}

export function buildIdentityBrief(spec) {
  const rows=[`VEHICLE: ${spec.vehicle}; STATE: ${spec.stage}.`, 'SOURCE ANALYSIS FOR STILL GENERATION — image coordinates are view-specific evidence and not transferable to another camera view. Preserve the physical mounts and project them naturally; do not copy screen coordinates into new angles.',`Grid: image x/y=0–1000; ${spec.gridDivisions} divisions; 0-based cells. Vehicle-left/right is separate from image-left/right.`];
  for(const p of spec.parts??[]) {
    rows.push(`${p.id}: ${p.presence}; surface=${p.surface}; ${p.count??0} recorded. ${p.placement}`);
    if(p.text)rows.push(`Text: ${p.text.usage==='source-only'?'original inspected; print replacement specified below':p.text.legibility==='readable'?JSON.stringify(p.text.value):p.text.legibility}. ${p.text.notes}`);
    for(const o of p.observations??[]) {
      const s=spec.sources.find(s=>s.id===o.sourceId),g=gridLocation(o.polygon,s,spec.gridDivisions);
      rows.push(`  ${o.sourceId}: x=${g.range1000.x.join('–')}, y=${g.range1000.y.join('–')}; cells x=${g.cells.x.join('–')}, y=${g.cells.y.join('–')}; source annotation ±${o.uncertaintyPx}px. ${o.notes}`);
      if(o.regionId){const r=spec.sourceRegions.find(r=>r.id===o.regionId),v=gridLocation(o.polygon.map(([x,y])=>[x-r.rect[0],y-r.rect[1]]),{width:r.rect[2],height:r.rect[3]},spec.gridDivisions);rows.push(`  ${r.id} (projected front-region ONLY): x=${v.range1000.x.join('–')}, y=${v.range1000.y.join('–')}; cells x=${v.cells.x.join('–')}, y=${v.cells.y.join('–')}. Not a true frontal vehicle measurement.`);}
    }
  }
  rows.push('ASYMMETRY EXCEPTIONS:');for(const e of spec.symmetry?.exceptions??[])rows.push(`${e.partId}: ${e.reason}`);
  for(const e of spec.ownerEditOverrides??[])rows.push(`APPROVED EDIT — ${e.detail}: source observation: ${e.sourceObservation}; requested change: ${e.requestedEdit}`);
  rows.push('Symmetry is evaluated only for declared paired features on a verified rectified surface. Never mirror badges/decals/plates, invent a missing hood crest, move a partial plate into frame, or force equal pixel widths in an oblique view. New stills and Elements require their own visual review.');
  return rows.join('\n');
}

async function renderReview(spec,base) {
  let html=`<!doctype html><html lang="ko"><meta charset="utf-8"><title>${escape(spec.vehicle)} identity review</title><style>body{background:#111;color:#eee;font:16px/1.6 system-ui;max-width:1400px;margin:30px auto;padding:20px}svg{width:100%;max-height:850px;background:#222}article{margin:35px 0}pre{white-space:pre-wrap}h1{font-size:25px}.note{color:#ffc47c}</style><h1>${escape(spec.vehicle)} · 원본 디테일 좌표 검토</h1><p class="note">원본 사진 기준 ${spec.gridDivisions}분할/0–1000 좌표입니다. 실제 차의 정면 치수나 새 앵글의 고정 좌표가 아닙니다. 주황선은 손으로 기록한 범위이며 픽셀 판독·대칭을 자동 인증하지 않습니다.</p>`;
  for(const s of spec.sources) {
    const file=s.previewFile??s.file,bytes=await fs.readFile(path.resolve(base,file)),mime=/\.jpe?g$/i.test(file)?'image/jpeg':'image/png';
    const font=Math.max(18,s.width/75),stroke=s.width/800;
    let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.width} ${s.height}"><image width="${s.width}" height="${s.height}" href="data:${mime};base64,${bytes.toString('base64')}"/>`;
    for(let i=1;i<spec.gridDivisions;i++)svg+=`<path d="M ${s.width*i/spec.gridDivisions} 0 V ${s.height} M 0 ${s.height*i/spec.gridDivisions} H ${s.width}" stroke="white" stroke-opacity=".22" stroke-width="${stroke}"/>`;
    for(const p of spec.parts)for(const o of p.observations??[])if(o.sourceId===s.id)svg+=`<polygon points="${o.polygon.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#ffb347" stroke-width="${stroke*2}"/><text x="${o.polygon[0][0]}" y="${Math.max(font,o.polygon[0][1]-font/4)}" font-family="sans-serif" font-size="${font}" fill="white" stroke="black" stroke-width="${font/18}" paint-order="stroke">${escape(p.id)}</text>`;
    html+=`<article><h2>${escape(s.id)} · ${escape(s.view)}</h2><p>${escape(s.notes)}</p>${svg}</svg></article>`;
    for(const r of spec.sourceRegions??[])if(r.sourceId===s.id){
      const [x,y,w,h]=r.rect;let grid='';for(let i=0;i<=spec.gridDivisions;i++)grid+=`<path d="M ${x+w*i/spec.gridDivisions} ${y} V ${y+h} M ${x} ${y+h*i/spec.gridDivisions} H ${x+w}" fill="none" stroke="#7cffff" stroke-opacity=".45" stroke-width="${stroke}"/>`;
      const start=svg.indexOf('<image'),end=svg.indexOf('/>',start)+2;const imageMarkup=svg.slice(start,end);
      html+=`<article><h2>${escape(r.id)} · 전면 영역 ${spec.gridDivisions}분할</h2><p class="note">${escape(r.notes)} · 사선 사진의 전면 영역입니다. 원근 보정된 실제 정면이 아닙니다.</p><svg viewBox="${r.rect.join(' ')}">${imageMarkup}${grid}</svg></article>`;
    }
  }
  return html+`<h2>기준표 / 생성용 참조 설명</h2><pre>${escape(buildIdentityBrief(spec))}</pre></html>`;
}

export async function main(args=process.argv.slice(2)) {
  const [command,file,out]=args;if(!file||!['check','brief','render'].includes(command))throw Error('Usage: vehicle-identity-map.mjs check map.json | brief map.json output.txt | render map.json review.html');
  const base=path.dirname(path.resolve(file)),spec=JSON.parse(await fs.readFile(file,'utf8')),review=await validateIdentityMap(spec,{base});
  if(command==='check')return review;
  if(!review.valid)throw Error(review.errors.join('\n'));if(!out)throw Error('Output path required');
  await fs.writeFile(out,command==='brief'?buildIdentityBrief(spec):await renderReview(spec,base));
  return {...review,output:path.resolve(out),generationCalls:0};
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const r=await main();console.log(JSON.stringify(r,null,2));if(!r.valid)process.exitCode=1;}
