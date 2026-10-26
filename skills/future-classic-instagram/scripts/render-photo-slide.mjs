import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const sharp=createRequire(resolve(process.cwd(),'package.json'))('sharp');

// Arrange reviewed plate-protected derivatives; focal crops need visual review.
export async function renderPhotoSlide(c){
 if(c.selection?.status!=='selected'||!c.selection?.candidateId)throw Error('User curation selection required');
 const images=c.images,width=c.width??1080,height=c.height??1440,gap=c.gap??24;
 if(!Array.isArray(images)||![1,2].includes(images.length))throw Error('One portrait or two landscape photos required');
 if(![width,height,gap].every(Number.isInteger)||width<320||height<320||width>4096||height>4096||gap<0||gap>=height)throw Error('Invalid dimensions');
 const fit=c.fit??'cover';if(!['cover','contain'].includes(fit))throw Error('Invalid fit');
 const output=resolve(c.output),ids=new Set();const buffers=[];
 for(const s of images){if(!s.sourceAssetId||ids.has(s.sourceAssetId))throw Error('Unique original photo identities required');ids.add(s.sourceAssetId);if(resolve(s.file)===output)throw Error('Input/output paths must differ');const data=await sharp(s.file).rotate().toBuffer();const m=await sharp(data).metadata();if(images.length===2&&m.width<=m.height)throw Error('Pair landscape photos only');if(images.length===1&&m.width>m.height&&!c.allowSingleLandscape)throw Error('Landscape photos should be paired');buffers.push(data);}
 const labelBoxes=[];
 const slotHeight=Math.floor((height-gap*(images.length-1))/images.length),layers=[];
 for(let i=0;i<buffers.length;i++){const b=await sharp(buffers[i]).resize(width,slotHeight,{fit:fit==='cover'?'cover':'inside',position:images[i].position??'centre',withoutEnlargement:false}).toBuffer(),m=await sharp(b).metadata();layers.push({input:b,left:Math.round((width-m.width)/2),top:i*(slotHeight+gap)+Math.round((slotHeight-m.height)/2)});}
 if(images.length===2){
 const seam=slotHeight;
 layers.push({input:Buffer.from('<svg width="'+width+'" height="'+gap+'"><rect width="100%" height="100%" fill="black"/></svg>'),left:0,top:seam});
 if(c.showLabels===true&&c.labels){
  if(!Array.isArray(c.labels)||c.labels.length!==2)throw Error('Two labels required');
  const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const fontSize=Math.round(width*.0185),padX=Math.round(width*.011),padY=Math.round(width*.007);
  for(let i=0;i<2;i++){
   const text=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+(fontSize*3)+'"><text x="0" y="'+(fontSize*2)+'" fill="white" font-family="Bahnschrift,Arial,sans-serif" font-size="'+fontSize+'" letter-spacing="2">'+esc(c.labels[i])+'</text></svg>')).ensureAlpha().trim().png().toBuffer();
   const m=await sharp(text).metadata(),bw=m.width+padX*2,bh=m.height+padY*2;
   const left=width-bw,top=i===0?seam-bh:seam+gap;
   const input=await sharp({create:{width:bw,height:bh,channels:3,background:'#000000'}}).composite([{input:text,left:padX,top:padY}]).png().toBuffer();
   layers.push({input,left,top});labelBoxes.push({left,top,width:bw,height:bh});
  }
 }
 }

 await mkdir(dirname(output),{recursive:true});await writeFile(output,await sharp({create:{width,height,channels:3,background:c.background??'#000000'}}).composite(layers).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toBuffer());
 return {output,width,height,layout:images.length===2?'paired-landscapes':'single-portrait',sourceAssetIds:[...ids],fit,labelBoxes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){console.log(JSON.stringify(await renderPhotoSlide(JSON.parse(await readFile(process.argv[2],'utf8')))));}
