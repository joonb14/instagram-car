import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const sharp=createRequire(resolve(process.cwd(),'package.json'))('sharp');

export async function applyBrandPlate(c){
  if((c.selection?.status!=='selected'||!c.selection?.candidateId)&&!(c.experiment?.requestedBy==='user'&&c.experiment?.scope==='cover-only'))throw Error('Selected case or user-requested cover experiment required');
  if(resolve(c.image)===resolve(c.output))throw Error('Keep original image');
  const q=c.quad;
  if(!Array.isArray(q)||q.length!==4||q.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v))))throw Error('Four plate corners required in TL TR BR BL order');
  const m=await sharp(c.image).metadata();
  if(q.some(p=>p[0]<0||p[1]<0||p[0]>m.width||p[1]>m.height))throw Error('Plate outside image');
  const logo=await sharp(c.logo).trim().png().toBuffer();
  const [tl,tr,,bl]=q;
  const a=tr[0]-tl[0],b=tr[1]-tl[1],cc=bl[0]-tl[0],d=bl[1]-tl[1];
  if(Math.abs(a*d-b*cc)<1)throw Error('Degenerate plate');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${m.width}" height="${m.height}"><polygon points="${q.map(p=>p.join(',')).join(' ')}" fill="#e4e3e1"/><g transform="matrix(${a},${b},${cc},${d},${tl[0]},${tl[1]})"><image x=".07" y=".17" width=".86" height=".66" preserveAspectRatio="none" xlink:href="data:image/png;base64,${logo.toString('base64')}"/></g></svg>`;
  await mkdir(dirname(resolve(c.output)),{recursive:true});
  await sharp(c.image).composite([{input:Buffer.from(svg)}]).png().toFile(c.output);
  return {output:c.output,logo:c.logo,quad:q,sourceUnchanged:true};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(await applyBrandPlate(JSON.parse(await readFile(process.argv[2],'utf8')))));
