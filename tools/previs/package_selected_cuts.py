"""Deliver the selected 26s master and exact 20s/6s split without retiming."""
from pathlib import Path
import json,shutil,argparse,hashlib
from package import probe
from package_camera_treatments import run,encode

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--library',type=Path,required=True);ap.add_argument('--previous',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args()
    p=a.library.resolve();old=a.previous.resolve();out=a.output.resolve()
    assert not out.exists(),'Use a fresh output directory'
    m=json.loads((p/'manifest.json').read_text(encoding='utf-8'));out.mkdir(parents=True)
    shots={s['id']:s for s in m['shots']};order=m['selected_order'];assert len(set(order))==len(order)==13
    unchanged=[]
    for sid,s in shots.items():
        dest=out/'shots'/sid;dest.mkdir(parents=True)
        if sid in m['changed_shots']:
            encode(['-framerate','60','-i',p/sid/'frames/%04d.png','-vf','trim=start_frame=6:end_frame=126,setpts=PTS-STARTPTS','-frames:v','120'],dest/'preview.mp4')
            shutil.copy2(p/sid/'frames/0007.png',dest/'start.png')
        else:
            for file in ['preview.mp4','start.png']:shutil.copy2(old/'shots'/sid/file,dest/file)
            assert (dest/'preview.mp4').read_bytes()==(old/'shots'/sid/'preview.mp4').read_bytes()
            unchanged.append(sid)
        s['clip']=f'shots/{sid}/preview.mp4';s['start_frame']=f'shots/{sid}/start.png'
        s['checks']=probe(dest/'preview.mp4');assert s['checks']['frames']==120
        (dest/'prompt.txt').write_text(s['prompt'],encoding='utf-8')
    definitions=[('FULL','전체 연결본 · 26초',order),('PART1','생성 입력 1 · 20초',order[:10]),('PART2','생성 입력 2 · 6초',order[10:])]
    results=[]
    for rid,title,ids in definitions:
        folder=out/rid;folder.mkdir()
        concat=p/(rid+'-concat.txt');concat.write_text(''.join("file '"+(out/'shots'/sid/'preview.mp4').as_posix()+"'\n" for sid in ids),encoding='utf-8')
        target=folder/'previs.mp4';run(['-f','concat','-safe','0','-i',concat,'-c','copy','-movflags','+faststart','-n',target])
        check=probe(target);assert check['frames']==120*len(ids)
        timeline=[dict(id=sid,title=shots[sid]['title'],start=i*2,end=i*2+2,camera_prompt=shots[sid]['prompt'],transition='cut' if i<len(ids)-1 else None,transition_after='직접 컷' if i<len(ids)-1 else '종료') for i,sid in enumerate(ids)]
        duration=len(ids)*2
        prompt=f'Create a realistic {duration}-second vertical 9:16 car film. Use @동영상1 for exact camera motion, framing, cut order and timing. Use @차량요소 for exterior identity. The vehicle, wheels, doors, environment and interior parts remain completely stationary. Only the camera moves. Fixed focal lengths; no digital zoom. '
        if any(shots[sid]['classification']=='interior' for sid in ids):prompt+='Use @실내사진 for all real cabin design. Keep the cabin shots together, beginning with the wide cabin view and then close details. Generic blocks only indicate composition, not model-specific trim or transmission type. No hands, gear shifting or door operation. '
        prompt+='Keep each shot exactly two seconds, use direct cuts, and end without repeating a shot. No captions, music or speech.\n\n'
        prompt+='\n'.join(f'{s["start"]:02d}–{s["end"]:02d}s {s["id"]}: {s["camera_prompt"]}' for s in timeline)
        if rid=='FULL':prompt='EDITING / REVIEW MASTER: 26 seconds. For a 20-second generation limit, use the separate PART1 (20s) and PART2 (6s) videos and their prompts.\n\n'+prompt
        (folder/'prompt.txt').write_text(prompt,encoding='utf-8')
        r=dict(id=rid,title=title,category='.',seconds=duration,video=f'{rid}/previs.mp4',clean=f'{rid}/previs.mp4',prompt=f'{rid}/prompt.txt',shots=timeline,checks={'previs.mp4':check},transitions=[dict(at=2*i,type='cut',duration=0) for i in range(1,len(ids))])
        # The shared player resolves recipe links through category/id.
        (folder/'recipe.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8');results.append(r)
    data=dict(version=4,preferred_edition='clean',shots=list(shots.values()),presets=results,unchanged_from_v3=unchanged)
    (out/'presets.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    template=Path(__file__).with_name('camera_treatments.html').read_text(encoding='utf-8')
    template=template.replace('기존 구도 + 카메라 기법 + 컷별 전환','선택한 13컷 · 전체 26초 + 20초 / 6초')
    template=template.replace('8개 × 20초 · 1080×1920 · 60fps · 차량/휠/실내 고정. 생성에는 클린 버전을 사용하고 전환은 편집 단계에 적용하세요.','1080×1920 · 60fps · 무음. 실내 전체 → 실내 디테일을 한 구간에 모았습니다. 외관은 디테일에서 전체차로 이어집니다. 생성에는 PART1 20초와 PART2 6초를 각각 사용하세요.')
    template=template.replace('<select id="edition" aria-label="영상 버전">','<select id="edition" aria-label="영상 버전" hidden>')
    template=template.replace('전환 시안 MP4','MP4 다운로드').replace('생성용 클린 MP4','원본 클린 MP4')
    template=template.replace('id="continuous" checked','id="continuous"').replace('다음 조합 자동재생','다음 파일 자동재생')
    (out/'index.html').write_text(template.replace('__DATA__',json.dumps(data,ensure_ascii=False).replace('</','<\\/')),encoding='utf-8')
    (out/'README.md').write_text('# 선택한 13컷 · 26초 전체 / 20초 + 6초 분할\n\n- FULL/previs.mp4: 전체 26초, 1560프레임\n- PART1/previs.mp4: 앞 20초, 1200프레임\n- PART2/previs.mp4: 뒤 6초, 360프레임\n\n1080×1920, 60fps, 무음, 컷마다 2초입니다. 전체와 분할본은 동일한 인코딩 컷을 그대로 연결했으며 컷 속도를 바꾸지 않았습니다. 20초 제한 생성에는 PART1과 PART2를 각각 사용하세요. FULL은 전체 흐름 검토용입니다.\n\n순서: '+ ' → '.join(order[:10])+' | '+' → '.join(order[10:])+'\n\n실내는 I01 전체에서 I05/I02/I03/I04/I06 부분 컷으로 이어집니다. 실내를 한 구간에 모았고 마지막은 A03/A11 전체차로 마무리합니다. 변경은 B08 카메라 거리 30% 증가와 A02 20도 하강 수직 아크 두 컷뿐입니다. 나머지 11개 영상과 시작 PNG는 v3 원본을 그대로 복사했습니다.\n\nindex.html에서 전체/분할본과 컷을 선택할 수 있습니다. shots/에는 13개 독립 컷·시작 PNG·프롬프트가 있습니다. 모든 차체/휠/실내 부품은 고정돼 있습니다. 실차 외관·실내 사진은 별도 입력이며 이 PNG는 프록시 구도 참고용입니다.\n\n제작: revise_selected_cameras.py (검증된 MCP) → render_camera_presets.py --ids B08,A02 → package_selected_cuts.py. 이전 v3은 보존합니다. Blender 및 검수 기록은 .local/previs/preset-camera-v004에 보관합니다.\n',encoding='utf-8')
    print('DONE: 26s master + 20s / 6s; 11 shots byte-identical to v3')

if __name__=='__main__':main()
