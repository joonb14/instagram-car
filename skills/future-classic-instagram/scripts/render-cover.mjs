import {createRequire} from 'node:module';
const sharp=createRequire(resolve(process.cwd(),'package.json'))('sharp');
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
export async function renderCover(c){
 if((c.selection?.status!=='selected'||!c.selection?.candidateId)&&!(c.experiment?.requestedBy==='user'&&c.experiment?.scope==='cover-only'))throw Error('User curation selection required');
 if(!c.title||String(c.title).length>70)throw Error('Title required, max70 characters');
 const width=c.width??1080,height=c.height??width,header=c.headerHeight??0,textArea=c.textAreaHeight??0,area=header||textArea,opacity=c.opacity??(header?0:textArea ? .48 : .12);
 if(!Number.isInteger(header)||header<0||header>=height)throw Error('Invalid header height');
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<320||height<320||width>4096||height>4096)throw Error('Invalid dimensions');
 if(!Number.isInteger(textArea)||textArea<0||textArea>=height||header&&textArea)throw Error('Invalid or conflicting text area height');
 if(!(opacity>=0&&opacity<=(textArea?1:.3)))throw Error('Invalid overlay opacity');
 const image=resolve(c.image),output=resolve(c.output),overlay=resolve(c.overlay);
 if(new Set([image,output,overlay]).size!==3)throw Error('Input/output paths must differ');
 const font=esc(c.font??'Bahnschrift'),x=Math.round(width*.055),y=Math.round(area?area*.215:height*.11),size=c.fontSize??Math.round(width*(area ? .0528 : .052));
 const lines=String(c.title).split('\n');if(lines.length>3)throw Error('Max3 title lines');
 const svg=`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${area||height}" fill="black" fill-opacity="${opacity}"/><g font-family="${font},Arial,sans-serif" fill="white"><text x="${x}" y="${y}" font-size="${Math.round(width*.013)}" letter-spacing="2.5">${esc(c.badge??'FUTURE CLASSIC CLUB / REVIVED')}</text>${lines.map((line,i)=>`<text x="${x}" y="${(area?area*.56:y+size*1.25)+i*size*1.05}" font-size="${size}" font-weight="700" stroke="black" stroke-opacity=".12" stroke-width=".7" paint-order="stroke">${esc(line)}</text>`).join('')}<text x="${x}" y="${c.subtitleY??(area?area*.82:y+size*1.25+lines.length*size*1.05)}" font-size="${Math.round(width*.016)}" letter-spacing="2">${esc(c.subtitle??'')}</text></g></svg>`;
 await mkdir(dirname(output),{recursive:true});await mkdir(dirname(overlay),{recursive:true});
 await sharp(Buffer.from(svg)).ensureAlpha().png().toFile(overlay);
 let photo=sharp(image).rotate();
 if(c.crop)photo=photo.extract(c.crop);
 if(c.color){const v=c.color;photo=photo.modulate({brightness:v.brightness??1,saturation:v.saturation??1}).linear(v.contrast??1,v.offset??0).gamma(v.gamma??1);}
 photo=header?photo.resize(width,height-header,{fit:'cover'}).extend({top:header,bottom:0,background:c.headerColor??'#151718'}):photo.resize(width,height,{fit:textArea?'cover':'contain',background:'#141414'});
 await photo.composite([{input:overlay}]).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(output);
 return {output,overlay,width,height,headerHeight:header,textAreaHeight:textArea,opacity};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const file=process.argv[2];if(!file)throw Error('Usage: node render-cover.mjs cover.json');console.log(JSON.stringify(await renderCover(JSON.parse(await readFile(file,'utf8')))));}
