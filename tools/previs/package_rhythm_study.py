"""Encode unequal-duration shots and frame-exact master/splits."""
import json,shutil,argparse
from pathlib import Path
from package import probe
from package_camera_treatments import encode,run

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--library',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args()
    p=a.library.resolve();out=a.output.resolve();assert not out.exists()
    m=json.loads((p/'manifest.json').read_text(encoding='utf-8'));rows=m['shots'];shots={s['id']:s for s in rows};order=m['selected_order']
    assert sum(s['frames'] for s in rows)==1800
    assert sum(shots[s]['frames'] for s in order[:m['split_after']])==1200
    out.mkdir(parents=True)
    for s in rows:
        sid=s['id'];dest=out/'shots'/sid;dest.mkdir(parents=True)
        reused=m.get('previous_package') and sid not in m.get('changed_shots',[])
        if reused:
            previous=Path(m['previous_package']).resolve()/'shots'/sid
            for name in ['preview.mp4','start.png']:shutil.copy2(previous/name,dest/name)
            assert (dest/'preview.mp4').read_bytes()==(previous/'preview.mp4').read_bytes()
        else:
            encode(['-framerate','60','-i',p/sid/'frames/%04d.png','-frames:v',s['frames']],dest/'preview.mp4')
            shutil.copy2(p/sid/'frames/0001.png',dest/'start.png')
        s['checks']=probe(dest/'preview.mp4');assert s['checks']['frames']==s['frames']
        (dest/'prompt.txt').write_text(s['prompt'],encoding='utf-8')
        s.update(clip=f'shots/{sid}/preview.mp4',start_frame=f'shots/{sid}/start.png')
    cut=m['split_after'];definitions=[('FULL','전체 시안',order),('PART1','생성 입력 1',order[:cut]),('PART2','생성 입력 2',order[cut:])];results=[]
    for rid,title,ids in definitions:
        dest=out/rid;dest.mkdir();frames=sum(shots[s]['frames'] for s in ids);seconds=frames/60
        concat=p/(rid+'-concat.txt');concat.write_text(''.join("file '"+(out/'shots'/sid/'preview.mp4').as_posix()+"'\n" for sid in ids),encoding='utf-8')
        run(['-f','concat','-safe','0','-i',concat,'-c','copy','-movflags','+faststart','-n',dest/'previs.mp4'])
        check=probe(dest/'previs.mp4');assert check['frames']==frames
        timeline=[];cursor=0
        for i,sid in enumerate(ids):
            s=shots[sid];end=cursor+s['frames']
            timeline.append(dict(id=sid,title=s['title'],start=cursor/60,end=end/60,start_frame=cursor,end_frame=end,camera_prompt=s['prompt'],transition='cut' if i<len(ids)-1 else None,transition_after='직접 컷' if i<len(ids)-1 else '종료'))
            cursor=end
        prompt=f'Create a realistic {seconds:g}-second portrait 9:16 car film. Use @동영상1 for the exact uneven shot durations, camera paths and framing. Use @차량요소 for vehicle identity. The car, wheels and environment remain stationary. Only the camera moves; no digital zoom. '
        if any(shots[s]['classification']=='interior' for s in ids):prompt+='Use @실내사진 for the actual cabin. Keep the wide cabin view followed by its grouped detail/medium shots. Grey proxy blocks are composition markers. No hands, door operation or gear movement. '
        prompt+='Use direct cuts. Do not force all shots to two seconds. Preserve the brief detail inserts and longer orbit/pullback shots. No repeated ending, captions, music or speech.\n\n'
        prompt+='\n'.join(f'{s["start"]:g}–{s["end"]:g}s {s["id"]}: {s["camera_prompt"]}' for s in timeline)
        if rid=='FULL':prompt='REVIEW / EDITING MASTER: 30 seconds. For a 20-second generation limit, use PART1 (20s) and PART2 (10s) separately.\n\n'+prompt
        (dest/'prompt.txt').write_text(prompt,encoding='utf-8')
        r=dict(id=rid,title=f'{title} · {seconds:g}초',category='.',seconds=seconds,video=f'{rid}/previs.mp4',clean=f'{rid}/previs.mp4',prompt=f'{rid}/prompt.txt',shots=timeline,checks={'previs.mp4':check})
        (dest/'recipe.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8');results.append(r)
    data=dict(version=m.get('version',5),preferred_edition='clean',shots=rows,presets=results)
    (out/'presets.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    template=Path(__file__).with_name('camera_treatments.html').read_text(encoding='utf-8')
    template=template.replace('기존 구도 + 카메라 기법 + 컷별 전환','컷의 호흡을 달리한 30초 시안')
    template=template.replace('8개 × 20초 · 1080×1920 · 60fps · 차량/휠/실내 고정. 생성에는 클린 버전을 사용하고 전환은 편집 단계에 적용하세요.','16컷 · 컷마다 1~4초 · 새 컷 W01/I07/T01 · 1080×1920 · 60fps · 무음. 전체 30초 / 생성용 20초 + 10초. 실내는 전체→부분으로 모으고 마지막 전체차를 길게 보여줍니다.')
    if m.get('page_title'):
        template=template.replace('컷의 호흡을 달리한 30초 시안',m['page_title']).replace('16컷 · 컷마다 1~4초 · 새 컷 W01/I07/T01 · 1080×1920 · 60fps · 무음. 전체 30초 / 생성용 20초 + 10초. 실내는 전체→부분으로 모으고 마지막 전체차를 길게 보여줍니다.',m['page_summary'])
    template=template.replace('<select id="edition" aria-label="영상 버전">','<select id="edition" aria-label="영상 버전" hidden>').replace('id="continuous" checked','id="continuous"').replace('다음 조합 자동재생','다음 파일 자동재생').replace('전환 시안 MP4','MP4 다운로드')
    (out/'index.html').write_text(template.replace('__DATA__',json.dumps(data,ensure_ascii=False).replace('</','<\\/')),encoding='utf-8')
    table='\n'.join(f'| {s["id"]} | {s["duration"]:g}초 | {s["title"]} |' for s in rows)
    (out/'README.md').write_text('# 컷의 호흡을 달리한 30초 시안\n\nFULL은 30초, PART1은 20초, PART2는 10초입니다. 모두 1080×1920, 60fps, 무음이며 각 파일에 프롬프트가 있습니다.\n\n| 컷 | 길이 | 내용 |\n|---|---|---|\n'+table+'\n\n새 컷은 W01 앞 휠 접근, I07 시트·콘솔 중간 거리, T01 테일램프 디테일입니다. 기존 경로는 새 길이에 맞춰 Blender에서 60fps로 다시 샘플링·렌더했습니다. 인코딩된 영상의 프레임을 복제해서 늘리지 않았습니다. 실내는 한 구간에 모았고 외관은 마지막 전체차로 확대됩니다. A11은 4초로 마무리합니다.\n\n시작 PNG는 범용 프록시 구도용입니다. 실제 차의 외관·실내 사진은 별도 입력입니다. 차량·휠·문·실내 조작부는 모두 고정합니다. 이전 v4를 보존했습니다.\n\n제작: build_rhythm_study.py (검증된 MCP) → render_camera_presets.py → package_rhythm_study.py. 소스 및 실행 기록: .local/previs/preset-camera-v005.\n',encoding='utf-8')
    if m.get('study_note'):
        (out/'README.md').write_text('# '+m['page_title']+'\n\n'+m['study_note']+'\n\nFULL 30초 / PART1 20초 / PART2 10초. 1080×1920 · 60fps · 무음.\n\n| 컷 | 길이 | 내용 |\n|---|---|---|\n'+table+'\n\n시작 PNG는 프록시 구도용이며 실제 차 사진 기반 생성용 Start Frame은 별도입니다. 소스/검수: .local/previs/'+m['revision']+'. 제작: '+m['build_tool']+' → render_camera_presets.py → package_rhythm_study.py. 이전 버전은 보존했습니다.\n',encoding='utf-8')
    print('DONE 30s / 20s / 10s',flush=True)

if __name__=='__main__':main()
