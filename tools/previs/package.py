"""Encode, verify and package the per-cut library. Media stays outside Git."""
from pathlib import Path
import argparse,subprocess,json,hashlib,re,shutil,html
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'.local/previs/modular-car-v001'
FF=ROOT/'.local/runtime/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe'
def run(args):
    return subprocess.run([str(FF),'-hide_banner',*map(str,args)],capture_output=True,text=True,encoding='utf-8',errors='replace',check=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def probe(p):
    # ffmpeg decodes all frames; no reliance on predicted encode metadata.
    r=run(['-v','info','-i',p,'-map','0:v:0','-vf','showinfo','-f','null','-'])
    sizes=set(re.findall(r' s:(\d+x\d+) ',r.stderr));nums=re.findall(r' n:\s*(\d+) ',r.stderr)
    assert sizes=={'1080x1920'},(p,sizes)
    assert nums,(p,'no decoded frames')
    assert not re.search(r'(Invalid data|Error while decoding|corrupt)',r.stderr,re.I)
    meta=re.search(r'Video:.*? (\d+(?:\.\d+)?) fps',r.stderr)
    assert meta and float(meta.group(1))==60,(p,'fps')
    assert 'Audio:' not in r.stderr,(p,'unexpected audio')
    return dict(frames=int(nums[-1])+1,dimensions=[1080,1920],fps=60,silent=True,full_decode=True,sha256=sha(p))
def make_prompt(s):
    if s['classification']=='mixed':
        bindings='Use @동영상1 strictly for camera and action. Use @이미지1 for exterior vehicle identity and @이미지2 for its open-door cockpit and door structure.'
    elif s['classification']=='interior':
        bindings='Use @동영상1 strictly for camera and hand action. Use @이미지1 for the exact interior components, materials and placement.'
    else:bindings='Use @동영상1 strictly for camera, framing and vehicle motion. Use @이미지1 for exact exterior vehicle identity.'
    cue=s['camera_prompt']
    if s.get('camera_motion'):
        actions={
            'C01':'An adult opens the driver door once. Preserve the visible cockpit and keep the hand on the exterior handle.',
            'C02':'The hand grips the large interior door pull and draws the door inward to close it once.',
            'C03':'The hand grips the manual gear knob and moves it through a short deliberate shift pattern, then rests.',
            'C04':'The hand grips and operates the mechanical handbrake once, keeping contact with the lever.',
            'C05':'The hand inserts the ignition key, turns it to start, then releases it to the running position.',
            'C06':'The parked car idles in place. Every wheel stays still. Preserve the actual exhaust and do not invent smoke.',
            'C07':'The hand turns the ignition key off, removes it and withdraws from the control.',
            'C08':'Fingers pull the small interior release latch once and the door begins to open.',
            'C09':'An adult pushes the open driver door closed once, maintaining hand contact until closure.',
        }
        cue=actions[s['id']]+' '+s['camera_motion']['note']
    text=f'{bindings}\nOne continuous {s["duration"]:.3f}-second shot, vertical 9:16. {cue}\n'
    if s['kind']=='driving':text+='The vehicle travels forward along its own lane. Wheels roll naturally with road contact. Preserve the original camera height, crop, direction and timing. Dark tinted glazing with no clearly visible cabin or face. '
    else:text+='Natural practical-car footage with restrained handheld movement. The vehicle stays parked. '
    text+='Replace the blue/gray blocking geometry and orange action proxy with the referenced real car and a natural adult hand/person where present. Keep the mechanical action physically plausible. Preserve the real controls and body details. Do not invent a wing, change the wheels, mirror the cockpit, add extra fingers, extra actions, cuts, transitions, text or logos. Do not redesign the framing. '
    if s['classification']!='exterior':text+='If the reference photo has a different control type or position, adapt the previs before generation; do not fabricate the source BMW mechanism. '
    return text+'No music or narration; sound is added separately after picture selection.'
def contacts(m):
    for group in 'ABC':
        shots=[s for s in m['shots'] if s['id'][0]==group]
        sheet=Image.new('RGB',(216*6,420*((len(shots)+5)//6)),(235,237,240));d=ImageDraw.Draw(sheet)
        for i,s in enumerate(shots):
            im=Image.open(P/s['id']/'mid.png');im.thumbnail((216,384));x=(i%6)*216;y=(i//6)*420
            sheet.paste(im,(x,y+30));d.text((x+8,y+8),s['id']+' / '+str(round(s['duration'],2))+'s',fill='black')
        sheet.save(P/(group+'-contact.jpg'),quality=90)
def catalog(m):
    for s in m['shots']:
        if s.get('camera_motion'):s['camera_prompt']=s['camera_motion']['note']
        s['prompt']=make_prompt(s);(P/s['id']/'prompt.txt').write_text(s['prompt'],encoding='utf-8')
    (P/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
    payload=json.dumps(m,ensure_ascii=False).replace('</','<\\/')
    doc='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>컷별 자동차 프리비즈</title>
<style>*{box-sizing:border-box}body{margin:0;background:#10151c;color:#e8edf3;font:15px system-ui,sans-serif}header{padding:30px 5vw 20px;background:#192230}h1{font-size:28px;margin:0 0 12px}p{line-height:1.6;color:#b8c5d5}a{color:#7fcbff}button,select,input{font:inherit;border:1px solid #526379;background:#233348;color:white;border-radius:6px;padding:8px;cursor:pointer}.toolbar{position:sticky;top:0;background:#10151cf5;z-index:3;padding:12px 5vw;border-bottom:1px solid #35465b}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));gap:20px;padding:24px 5vw}.card{background:#192330;padding:14px;border:1px solid #35465b;border-radius:12px}.card video{display:block;width:100%;height:360px;background:#080c12;object-fit:contain}.card h2{font-size:18px}.meta{font-size:13px;color:#9db1c7;line-height:1.5}.card textarea{width:100%;height:150px;background:#0e1721;color:#dae5ef;margin-top:10px;padding:8px}.tag{font-size:12px;background:#34465e;padding:3px 6px;border-radius:5px}#queue{line-height:1.9;color:#9edcff}#duration{color:#ffc480}details{margin:12px 0}footer{padding:20px 5vw 40px;color:#9db1c7}</style>
<header><h1>조합해서 쓰는 자동차 프리비즈 · 31컷</h1><p>A/B: 주행·카메라 컷 22개 / C: 문·실내 조작·정차 9개. 1080×1920 · 60fps · 무음.<br>실제 차량 사진이 들어가기 전의 동작 블로킹입니다. 각 컷은 독립 파일이며 아래 순서대로 선택해 조합 요청을 보낼 수 있습니다.</p>
<a href="modular-car.blend">Blender 원본</a> · <a href="photo-guide.md">필요 사진 안내</a> · <a href="A-reference-order.mp4">A 전체</a> · <a href="B-reference-order.mp4">B 전체</a> · <a href="C-reference-order.mp4">C 전체 검토본(20.7초)</a></header>
<div class="toolbar"><select id="filter"><option value="all">모든 컷</option><option value="A">A 주행</option><option value="B">B 주행</option><option value="C">C 실내·ASMR</option><option value="interior">실내만</option><option value="mixed">문 + 실내</option></select> <button onclick="clearQueue()">선택 비우기</button> <button onclick="copyOrder()">선택 순서 복사</button> <button onclick="downloadRecipe()">조합 JSON 저장</button><div id="queue">아래에서 컷을 선택하세요.</div><div id="duration"></div></div><main class="grid" id="cards"></main><footer>원본 출처: FIAMRACING(A/B), Heritage Gruppe(C). 원본 영상은 분석용이며 이 파일에 포함하지 않았습니다. 원본 카메라의 수치 복원이나 특정 차종 CAD가 아닌 수작업 블로킹입니다. 주황색은 손·사람 동작 표시입니다. 사진별 맞춤 및 사용자 시각 검토가 남아 있습니다. A12는 A01로 돌아가는 루프 컷입니다.</footer>
<script>const data=__DATA__;let order=[];const byId=Object.fromEntries(data.shots.map(s=>[s.id,s]));
function esc(v){const t=document.createElement('span');t.textContent=v;return t.innerHTML}
function render(){const f=document.querySelector('#filter').value;document.querySelector('#cards').innerHTML=data.shots.filter(s=>f==='all'||s.id.startsWith(f)||s.classification===f).map(s=>`<article class="card"><span class="tag">${s.classification}</span><h2>${s.id} · ${esc(s.title)}</h2><video controls preload="none" poster="${s.mid_frame}" src="${s.clip}"></video><p class="meta">${s.duration.toFixed(3)}초 · 원본 ${s.source_in.toFixed(2)}–${s.source_out.toFixed(2)}초<br>사진: ${esc(s.photos)}<br>${esc(s.compatibility)}</p><button onclick="add('${s.id}')">조합에 추가</button> <a href="${s.clip}">MP4</a> · <a href="${s.start_frame}">Start</a> · <a href="${s.end_frame}">End</a><details><summary>카메라·생성 프롬프트</summary><p>${esc(s.camera_prompt)}</p><textarea readonly>${esc(s.prompt)}</textarea><button onclick="copyPrompt('${s.id}',this)">프롬프트 복사</button></details></article>`).join('')}
function add(id){if(order.includes(id))return;order.push(id);update()}
function update(){document.querySelector('#queue').textContent=order.join(' → ')||'아래에서 컷을 선택하세요.';let t=order.reduce((a,id)=>a+byId[id].duration,0);document.querySelector('#duration').textContent=order.length?`${t.toFixed(3)}초 / ${order.length}컷`+(t>20?' · 20초 제한 입력은 컷 경계에서 나누세요.':''):''}
function clearQueue(){order=[];update()}
async function copyText(t){try{await navigator.clipboard.writeText(t)}catch{prompt('복사할 내용',t)}}
function copyOrder(){copyText(order.join(','))}
async function copyPrompt(id,b){await copyText(byId[id].prompt);b.textContent='복사됨'}
function downloadRecipe(){const o={revision:data.revision,shots:order};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}));a.download='previs-recipe.json';a.click();URL.revokeObjectURL(a.href)}
document.querySelector('#filter').onchange=render;render();</script></html>'''.replace('__DATA__',payload)
    if m.get('camera_treatment'):
        doc=doc.replace('<a href="modular-car.blend">','<p>실내·문·정차 9컷에 전진·후진·옆 이동을 더한 버전입니다. 주행 컷과 바퀴·인물 동작은 기존 그대로입니다.</p><a href="modular-car.blend">',1)
    (P/'index.html').write_text(doc,encoding='utf-8')
    guide='''# 사진을 받아 각 컷을 맞추는 순서

현재 파일은 일반 차량 블로킹이며 실제 964/BMW 실내를 복제한 모델이 아닙니다. 사진을 받은 뒤 조작부 위치와 카메라 구도를 맞춥니다. 사진만 바꾸고 다른 차의 키 위치나 레버를 유지하지 않습니다.

1. 외관: 앞 사선, 앞 측면, 뒤 사선, 측면, 보닛·앞유리 상부, 트렁크·뒷유리 상부, 앞/뒤 휠. 동일 차량·동일 휠·동일 상태로 준비합니다.
2. C01/C09: 운전석 쪽 외관 + 같은 문을 완전히 열어 촬영한 좌석·대시보드 사진. 문 손잡이와 경첩 방향이 보여야 합니다.
3. C02/C08: 운전석 안쪽 도어패널 전체. 큰 도어풀과 작은 도어 릴리스가 둘 다 선명해야 합니다. 창문 크랭크를 돌리는 컷이 아닙니다.
4. C03: 기어 노브·부츠·센터콘솔이 함께 보이는 운전석 위쪽 시점. 수동/자동 여부를 확인합니다.
5. C04: 핸드브레이크 레버와 좌석 사이. 전자식 버튼 차량이면 컷을 별도로 바꿉니다.
6. C05/C07: 키 구멍·스티어링·계기판을 한 화면에. 964는 BMW와 키 위치가 다르므로 사진에 맞춰 카메라와 손 동작을 옮깁니다.
7. C06: 낮은 후방 사선에서 범퍼와 실제 배기구가 보이는 사진.

가급적 손이 없는 선명한 원본을 사용하고, 광각 왜곡·반사로 중요한 조작부를 가리지 않습니다. 문·실내·외관 사진은 같은 차량이어야 합니다. 사진의 EXIF나 모델명만으로 실제 보이지 않는 디테일을 확정하지 않습니다.

## 생성 입력

외관 컷: @동영상1 = 해당 컷 preview.mp4, @이미지1 = 대응 외관 사진.
실내 컷: @동영상1 = 해당 컷 preview.mp4, @이미지1 = 해당 조작부 사진.
문 혼합 컷: @동영상1 = 해당 컷, @이미지1 = 외관, @이미지2 = 열린 문과 실내.
태그 이름은 텍스트 자리표시자입니다. 서비스 업로드 후 실제 태그와 바인딩을 확인합니다. 기존 차량 Element를 쓸 경우 외관 identity 문장을 실제 Element 태그로 교체할 수 있습니다.

각 폴더의 start.png는 실제 1080×1920 프리비즈 프레임입니다. 차량 사진을 반영한 최종 Start Frame은 사진을 받은 뒤 별도로 준비합니다. 각 컷의 프롬프트는 prompt.txt에 있습니다. 지금은 유료 생성/업로드를 하지 않았습니다.

## 조합

index.html에서 원하는 컷을 순서대로 추가하고 선택 순서를 복사합니다. 예: C01,C02,C05,C06,A01,A09,A03,C07,C09. 선택 목록은 순서와 합계 시간을 보여줍니다.
동일 ID의 중복 선택은 막았습니다. A12는 A01로 돌아오는 루프 컷이므로 일반 조합에서 제외하는 것이 좋습니다. A/B의 비슷한 앵글도 모두 넣기보다 하나씩 골라 사용합니다.
C 전체는 20.7초 검토본이므로 20초 제한 생성 입력으로 한 번에 제출하지 않습니다. C01–C05 11.667초 / C06–C09 9.033초 분할본 또는 개별 컷을 사용합니다.

카메라 위치·전진·프레이밍을 전하는 무음 블로킹입니다. 원본 음악/ASMR 소리를 복제하지 않았습니다. 실제 엔진음과 문·기어 효과음은 생성 결과 선택 후 맞춥니다.
'''
    (P/'photo-guide.md').write_text(guide,encoding='utf-8')
    md=['# 컷별 카메라 및 생성 프롬프트','']
    for s in m['shots']:md += [f'## {s["id"]} · {s["title"]}',f'{s["duration"]:.3f}초 | {s["classification"]} | 사진: {s["photos"]}',s['compatibility'],'','```text',s['prompt'],'```','']
    (P/'all-prompts.md').write_text('\n'.join(md),encoding='utf-8')
def main():
    global P
    ap=argparse.ArgumentParser();ap.add_argument('--catalog-only',action='store_true');ap.add_argument('--contacts-only',action='store_true');ap.add_argument('--library',type=Path,default=P);ap.add_argument('--encode-ids',help='Comma-separated changed cuts; other clips must already exist and are verified unchanged');args=ap.parse_args()
    P=args.library.resolve()
    m=json.loads((P/'manifest.json').read_text(encoding='utf-8'))
    selected=set(args.encode_ids.split(',')) if args.encode_ids else {s['id'] for s in m['shots']}
    unknown=selected-{s['id'] for s in m['shots']}
    if unknown:ap.error('Unknown shot IDs: '+','.join(sorted(unknown)))
    if args.contacts_only:contacts(m);return
    if not args.catalog_only:
        checks=[]
        for s in m['shots']:
            d=P/s['id']
            out=d/'preview.mp4'
            if s['id'] in selected:
                files=list((d/'frames').glob('*.png'));assert len(files)==s['frames'],(s['id'],len(files),s['frames'])
                run(['-v','error','-framerate','60','-i',d/'frames/%04d.png','-frames:v',s['frames'],'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart','-y',out])
                for label,f in [('start',1),('mid',(s['frames']+1)//2),('end',s['frames'])]:shutil.copy2(d/'frames'/f'{f:04d}.png',d/(label+'.png'))
            else:assert out.exists(),('Missing reusable clip',s['id'])
            check=probe(out);assert check['frames']==s['frames'];check['id']=s['id']
            if (d/'render-source.json').exists():check['render_source']=json.loads((d/'render-source.json').read_text())
            checks.append(check);print('VERIFIED',s['id'],flush=True)
        for group in ['A','B','C','C-part1','C-part2']:
            ss=[s for s in m['shots'] if s['id'][0]==group[0] and (group not in ['C-part1','C-part2'] or (int(s['id'][1:])<=5)==(group=='C-part1'))]
            li=P/(group+'-concat.txt');li.write_text(''.join(f"file '{s['id']}/preview.mp4'\n" for s in ss),encoding='utf-8')
            out=P/(group+('-reference-order.mp4' if len(group)==1 else '.mp4'))
            run(['-v','error','-f','concat','-safe','0','-i',li,'-c','copy','-movflags','+faststart','-y',out]);c=probe(out);assert c['frames']==sum(s['frames'] for s in ss);c['id']=group;checks.append(c)
        (P/'verification.json').write_text(json.dumps({'blend_sha256':m['blend_sha256'],'files':checks,'continuous_playback_review':False,'user_visual_approval':False},indent=2),encoding='utf-8')
    contacts(m);catalog(m);print('PACKAGED',P,flush=True)
if __name__=='__main__':main()
