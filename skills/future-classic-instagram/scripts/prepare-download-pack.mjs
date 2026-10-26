import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {reviewStructure,buildPrompt} from './advertising-workflow.mjs';
export async function prepareDownloadPack(m,base,out){
 const check=reviewStructure(m);
 if(!check.valid)throw Error('Invalid structure: '+check.errors.join('; '));
 if(!m.element.description?.trim())throw Error('Element description required');
 for(const s of m.sources)if(!/^[a-z0-9-]+$/.test(s.id))throw Error('Unsafe source ID');
 try{await fs.access(out);throw Error('Output exists; choose a new version');}catch(e){if(e.code!=='ENOENT')throw e;}
 const assets=[];
 for(const [i,s]of m.sources.entries()){
  const bytes=await fs.readFile(path.resolve(base,s.file));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==s.sha256)throw Error('Source hash mismatch: '+s.id);
  const prompt=s.videoPrompt??buildPrompt(m,s);
  if(!prompt.trim())throw Error('Missing prompt: '+s.id);
  assets.push({s,bytes,prompt,stem:String(i+1).padStart(2,'0')+'-'+s.id});
 }
 await fs.mkdir(out,{recursive:false});
 for(const folder of ['01_VIDEO_INPUTS','02_KLING_ELEMENT','03_VIDEO_PROMPTS'])await fs.mkdir(path.join(out,folder));
 for(const a of assets){await fs.writeFile(path.join(out,'01_VIDEO_INPUTS',a.stem+'.png'),a.bytes);await fs.writeFile(path.join(out,'03_VIDEO_PROMPTS',a.stem+'.txt'),a.prompt.trim()+'\n');}
 for(const id of m.element.sourceIds){const a=assets.find(a=>a.s.id===id);await fs.writeFile(path.join(out,'02_KLING_ELEMENT',a.stem+'.png'),a.bytes);}
 await fs.writeFile(path.join(out,'02_KLING_ELEMENT','01_DESCRIPTION_ONLY.txt'),m.element.description+'\n');
 await fs.writeFile(path.join(out,'02_KLING_ELEMENT','00_ELEMENT_SETUP.txt'),'Name: '+m.element.name+'\nTag: Items / 소품\nPrimary: whole-car\n첨부된 외관 4장만 주체로 등록하세요. 영상 입력 이미지는 01_VIDEO_INPUTS에서 선택하세요.\nDescription은 01_DESCRIPTION_ONLY.txt 내용을 복사하세요.\n');
 await fs.writeFile(path.join(out,'00_START_HERE.txt'),m.vehicle+'\n\n1. 02_KLING_ELEMENT의 외관 4장으로 주체를 직접 만드세요. whole-car를 대표 사진으로 권장합니다.\n2. 01_VIDEO_INPUTS 이미지와 같은 번호의 03_VIDEO_PROMPTS 텍스트를 사용하세요.\n3. 주체 선택기에서 @'+m.element.name+'을 실제 연결하세요.\n4. Kling 3.0 / 3초 / 1080p / 9:16 / 1개 / Multi-Shot OFF / 오디오 OFF.\n5. 생성 요청은 사용자가 직접 실행합니다. 이 패키지는 자동 제출하지 않습니다.\n6. 영상에서 로고·문구·차량 정지 여부를 확인한 뒤 편집합니다. 기본은 1배속, 추가 줌 없음, 마지막 0.8초 페이드아웃.\n\n이미지 검수 상태는 package-receipt.json에 원본대로 기록했습니다. 패키징은 검수 통과를 의미하지 않습니다.\nSource: '+(m.sourceArticle??'')+'\nCredit: '+(m.sourceCredit??'')+'\n');
 const receipt={vehicle:m.vehicle,imageCount:assets.length,promptCount:assets.length,elementCount:4,submissionOwner:'user-manual',sources:assets.map(a=>({id:a.s.id,sha256:a.s.sha256,review:a.s.review})),generatedAt:new Date().toISOString()};
 await fs.writeFile(path.join(out,'package-receipt.json'),JSON.stringify(receipt,null,2));return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const file=path.resolve(process.argv[2]);console.log(JSON.stringify(await prepareDownloadPack(JSON.parse(await fs.readFile(file,'utf8')),path.dirname(file),path.resolve(process.argv[3]))));}
