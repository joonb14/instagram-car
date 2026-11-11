"""Package eight portable camera-only 20-second presets, with no private photos."""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess, html
from package import FF, probe

RECIPES=[
 ('E01','외관 · 디테일에서 전체로','exterior',['A06','A09','A07','B08','A08','A02','A10','A03','A11','A01']),
 ('E02','외관 · 전면에서 후면으로','exterior',['A01','A02','A06','A09','A08','A10','A07','B08','A03','A11']),
 ('E03','외관 · 후면에서 전면으로','exterior',['A11','A03','B08','A07','A10','A08','A09','A06','A02','A01']),
 ('E04','외관 · 전체와 디테일 교차','exterior',['A01','A09','A11','A07','A02','A06','A03','B08','A10','A08']),
 ('I01','실내 포함 · 외관에서 실내로','interior',['A01','A06','A09','I01','I05','I02','I03','I04','A03','A11']),
 ('I02','실내 포함 · 실내에서 외관으로','interior',['I01','I06','I05','I02','I04','A09','A06','A02','A03','A01']),
 ('I03','실내 포함 · 외관·실내 교차','interior',['A01','I01','A09','I02','A06','I05','A07','I04','I06','A11']),
 ('I04','실내 포함 · 실내 디테일 중심','interior',['A02','I06','I03','I04','I02','I05','I01','B08','A03','A01']),
]

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--library',type=Path,required=True);ap.add_argument('--output',type=Path,default=Path('presets/camera-only-20s-v1'));args=ap.parse_args()
    p=args.library.resolve();out=args.output.resolve()
    if out.exists():raise SystemExit('Output exists; use a fresh package version')
    m=json.loads((p/'manifest.json').read_text(encoding='utf-8'));shots={s['id']:s for s in m['shots']}
    out.mkdir(parents=True)
    for sid,s in shots.items():
        folder=p/sid
        subprocess.run([str(FF),'-v','error','-framerate','60','-i',str(folder/'frames/%04d.png'),'-frames:v','120','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-an','-n',str(folder/'preview.mp4')],check=True)
        for name,frame in [('start',1),('mid',60),('end',120)]:shutil.copy2(folder/f'frames/{frame:04d}.png',folder/f'{name}.png')
        check=probe(folder/'preview.mp4');assert check['frames']==120
    results=[]
    for id,title,category,ids in RECIPES:
        assert len(ids)==len(set(ids))==10
        if category=='exterior':assert all(shots[s]['classification']=='exterior' for s in ids)
        folder=out/category/id;folder.mkdir(parents=True)
        concat=p/(id+'-concat.txt');concat.write_text(''.join("file '"+(p/s/'preview.mp4').as_posix()+"'\n" for s in ids),encoding='utf-8')
        target=folder/'previs.mp4'
        subprocess.run([str(FF),'-v','error','-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(target)],check=True)
        check=probe(target);assert check['frames']==1200
        shutil.copy2(p/ids[0]/'start.png',folder/'start.png')
        interior=category=='interior'
        prompt='Create a realistic 20-second vertical 9:16 car film. Use @동영상1 for the exact cut order, timing, framing and camera movement. Use @차량요소 for the target vehicle identity. The vehicle is parked throughout. Every wheel, the road and background stay fixed in world space; only the camera moves. Keep tire contact fixed and do not add wheel rotation or vehicle travel. Preserve target-car body details and its photographed wing if present. '
        if interior:
            prompt+='Use @실내사진 for all actual cabin design and materials. The simple grey dashboard, door, seats and blank console are composition markers only. Follow the target photos for console, steering wheel and door layout; do not copy a BMW E30 layout. The blank console specifies neither manual nor automatic transmission. No gear shifting, control operation, door movement, arms or hands. Every cabin object remains stationary while the camera slides gently. If photos do not cover a selected cabin view, adapt the shot before generation rather than inventing its layout. '
        else:prompt+='Exterior views only. Keep the cabin unobtrusive. '
        prompt+='Match the reference camera path in each two-second shot. Hard cuts only; no extra transitions, repeated ending, titles or captions. No music or speech. End at exactly 20 seconds.'
        (folder/'prompt.txt').write_text(prompt,encoding='utf-8')
        timeline=[dict(id=s,title=shots[s]['title'],start=i*2,end=(i+1)*2,classification=shots[s]['classification']) for i,s in enumerate(ids)]
        record=dict(id=id,title=title,category=category,shots=timeline,seconds=20,**check,video=f'{category}/{id}/previs.mp4',poster=f'{category}/{id}/start.png',prompt=f'{category}/{id}/prompt.txt',required_photos=['target exterior angles']+(['target dashboard, door panel, console, seats and steering views'] if interior else []))
        (folder/'recipe.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8');results.append(record)
    (out/'presets.json').write_text(json.dumps(dict(version=1,motion='camera-only; parked car; no control movement',presets=results),ensure_ascii=False,indent=2),encoding='utf-8')
    cards=[]
    for r in results:
        folder=out/r['category']/r['id'];prompt=(folder/'prompt.txt').read_text(encoding='utf-8')
        cards.append('<article data-category="'+r['category']+'"><h2>'+html.escape(r['id']+' · '+r['title'])+'</h2><video controls preload="none" poster="'+r['poster']+'" src="'+r['video']+'"></video><p>'+html.escape(' → '.join(s['id'] for s in r['shots']))+'</p><a href="'+r['video']+'" download>MP4 저장</a> · <a href="'+r['prompt']+'">프롬프트 TXT</a><details><summary>생성 프롬프트</summary><textarea readonly>'+html.escape(prompt)+'</textarea></details></article>')
    doc='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>20초 자동차 프리비즈 프리셋</title><style>body{margin:0;padding:28px;background:#111922;color:#eef4fa;font:16px/1.7 system-ui}h1{margin:0}a{color:#edbd77}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:22px;margin-top:24px}article{background:#21303e;border-radius:12px;padding:18px}h2{font-size:19px}video{width:100%;height:480px;object-fit:contain;background:#080b0f}textarea{width:100%;height:230px;box-sizing:border-box}button{padding:10px;margin:6px;cursor:pointer}p{color:#bfcddd;font-size:14px}</style><h1>카메라만 움직이는 20초 프리셋 · 8종</h1><p>1080×1920 · 60fps · 무음 · 10컷 × 2초. 차량·휠·배경·실내 조작부는 고정합니다.<br>실내는 범용 덩어리입니다. 실제 차의 대시보드·센터콘솔·문·시트 사진을 연결하세요. 프리비즈 Start PNG는 구도 참고용이며 실제 차량 기반 생성용 Start Frame은 별도 준비합니다.<br>프롬프트의 @동영상1 · @차량요소 · @실내사진은 실제 업로드 항목과 요소 이름으로 바꾸고 선택 메뉴에서 연결하세요.</p><button onclick="filter('all')">전체</button><button onclick="filter('exterior')">실내 미포함 4종</button><button onclick="filter('interior')">실내 포함 4종</button><main class="grid">CARDS</main><script>function filter(c){document.querySelectorAll('article').forEach(a=>a.hidden=c!=='all'&&a.dataset.category!==c)}document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>document.querySelectorAll('video').forEach(o=>{if(o!==v)o.pause()})))</script></html>'''.replace('CARDS',''.join(cards))
    (out/'index.html').write_text(doc,encoding='utf-8')
    (out/'README.md').write_text('# 카메라만 움직이는 20초 프리셋\n\n`index.html`을 브라우저로 열면 실내 포함/미포함으로 선택할 수 있습니다. MP4·Start PNG·prompt.txt·recipe.json은 각 폴더에 있습니다.\n\n차량, 휠, 배경, 문과 실내 조작부는 정지하고 카메라만 움직입니다. 실내는 기어봉·버튼·키·손잡이 디테일 없는 기본 덩어리입니다. 차량 사진 없이 실제 차의 실내와 일치한다고 주장하지 않습니다. 팔과 손은 없습니다.\n\n8개 모두 1080×1920, 60fps, 무음, 1200프레임=20초입니다. 각 프리셋은 서로 다른 순서의 10컷×2초입니다. 4개 외관 프리셋은 동일한 10개 각도를 순서만 바꾸고, 4개 실내 포함 프리셋은 서로 다른 실내·외관 조합입니다.\n\n이는 직접 만든 프록시 3D 렌더이며 특정 차종 모델이나 원본 영상이 아닙니다. E30/997/964 등의 실차 사진과 생성된 최종 영상은 포함하지 않습니다. 실내 프리셋에는 대상 차량의 실제 대시보드·문·센터콘솔·시트 사진이 필요합니다. 수동/자동 기어를 가정하지 않습니다.\n\n제작: `tools/previs/build_camera_presets.py`를 검증된 Blender MCP 인스턴스에서 실행 → `render_camera_presets.py`로 CLI 렌더 → `package_presets.py --library .local/previs/preset-camera-v001`. 재생성에는 기존 private generic proxy Blender 라이브러리가 필요하지만, 이 폴더의 완성된 MP4/HTML은 독립적으로 사용할 수 있습니다. 최초 소스 분석 레퍼런스: FIAMRACING의 eaq0oFtTaQs, NHWZKfeyJII. 원본 프레임이나 오디오를 복사하지 않았습니다.\n\n검증: 전체 MP4 디코딩·형식·프레임수·SHA256. Blender 장면의 비카메라 객체 애니메이션 제거 및 월드 변환 검증은 비공개 실행 기록에 보관합니다. 사용자 최종 시각 승인은 별도입니다.\n',encoding='utf-8')
    print('Packaged 8 presets:',out,flush=True)

if __name__=='__main__':main()
