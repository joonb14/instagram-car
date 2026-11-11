"""Portable camera/transition studies; clean shots plus exact 20s editions."""
from pathlib import Path
import argparse, json, shutil, subprocess, html
from package import FF, probe
from package_presets import RECIPES

# One explicit editorial decision for each of the nine cut boundaries.
EDITS={
 'E01':['cut','cut','fade','cut','smoothleft','cut','cut','fade','cut'],
 'E02':['cut','cut','cut','fade','cut','smoothleft','cut','cut','fade'],
 'E03':['cut','fade','cut','cut','smoothleft','cut','fade','cut','cut'],
 'E04':['cut','cut','fadeblack','cut','cut','cut','fade','cut','fade'],
 'I01':['cut','cut','fadeblack','cut','fade','cut','cut','fadeblack','fade'],
 'I02':['fade','cut','cut','fade','fadeblack','cut','cut','cut','fade'],
 'I03':['cut','cut','fadeblack','cut','fade','cut','cut','fade','cut'],
 'I04':['fadeblack','fade','cut','cut','cut','fade','fadeblack','cut','fade'],
}
NAMES={'cut':'직접 컷','fade':'짧은 디졸브','fadeblack':'짧은 암전','smoothleft':'왼쪽 방향 전환'}

def run(args):
    subprocess.run([str(FF),'-hide_banner','-loglevel','error',*map(str,args)],check=True)

def encode(args,target):
    run([*args,'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-an','-movflags','+faststart','-n',target])

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--library',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args()
    p=a.library.resolve();out=a.output.resolve();assert not out.exists(),'Use a new output folder'
    out.mkdir(parents=True);m=json.loads((p/'manifest.json').read_text(encoding='utf-8'));shots={s['id']:s for s in m['shots']}
    for sid,s in shots.items():
        dest=out/'shots'/sid;dest.mkdir(parents=True)
        encode(['-framerate','60','-i',p/sid/'frames/%04d.png','-frames:v','132'],p/sid/'handles.mp4')
        encode(['-i',p/sid/'handles.mp4','-vf','trim=start_frame=6:end_frame=126,setpts=PTS-STARTPTS'],dest/'preview.mp4')
        assert probe(dest/'preview.mp4')['frames']==120
        shutil.copy2(p/sid/'frames/0007.png',dest/'start.png')
        s['clip']=f'shots/{sid}/preview.mp4';s['start_frame']=f'shots/{sid}/start.png'
        (dest/'prompt.txt').write_text(s['prompt'],encoding='utf-8')
    results=[]
    for rid,title,category,ids in RECIPES:
        dest=out/category/rid;dest.mkdir(parents=True)
        transitions=m.get('edits',EDITS)[rid];assert len(transitions)==len(ids)-1==9
        concat=p/(rid+'-clean.txt');concat.write_text(''.join("file '"+(out/'shots'/sid/'preview.mp4').as_posix()+"'\n" for sid in ids),encoding='utf-8')
        run(['-f','concat','-safe','0','-i',concat,'-c','copy','-movflags','+faststart','-n',dest/'clean.mp4'])
        inputs=[];filters=[]
        for i,sid in enumerate(ids):
            inputs+=['-i',p/sid/'handles.mp4'];filters.append(f'[{i}:v]settb=1/60,setpts=PTS-STARTPTS,format=yuv420p[v{i}]')
        prev='v0'
        for i,kind in enumerate(transitions,1):
            spec="custom:expr='if(gte(P,0.5),A,B)'" if kind=='cut' else kind
            filters.append(f'[{prev}][v{i}]xfade=transition={spec}:duration=0.2:offset={i*2}[x{i}]');prev=f'x{i}'
        filters.append(f'[{prev}]trim=start_frame=6:end_frame=1206,setpts=PTS-STARTPTS,format=yuv420p[final]')
        encode(['-filter_complex_threads','1',*inputs,'-filter_complex',';'.join(filters),'-map','[final]','-frames:v','1200'],dest/'previs.mp4')
        checks={name:probe(dest/name) for name in ['previs.mp4','clean.mp4']}
        assert all(v['frames']==1200 for v in checks.values())
        timeline=[]
        for i,sid in enumerate(ids):
            timeline.append(dict(id=sid,title=shots[sid]['title'],start=2*i,end=2*i+2,camera_prompt=shots[sid]['prompt'],transition_after=NAMES[transitions[i]] if i<9 else '종료',transition=transitions[i] if i<9 else None))
        base='Create a realistic 20-second portrait 9:16 film. Use @동영상1 as the timing, framing and camera-motion reference and @차량요소 for identity. The car is parked. All wheels, doors, controls and background remain fixed in world space. Only the camera moves. Preserve each accepted composition and the small movement envelope. No vehicle movement, wheel rotation, hands or control operation. '
        if category=='interior':base+='Use @실내사진 for the real cabin design. Grey blocks only indicate framing: do not copy their geometry or invent an E30 dashboard. The blank console does not specify transmission type. '
        lines='\n'.join(f'{s["start"]:02d}–{s["end"]:02d}s: {s["id"]}. {s["camera_prompt"]}' for s in timeline)
        prompt=base+'Use clean cuts between shots for generation; apply the supplied transition recipe after the shots are generated. No morphing between different body parts or exterior and cabin. No captions, music or extra ending.\n\n'+lines
        (dest/'prompt.txt').write_text(prompt,encoding='utf-8')
        record=dict(id=rid,title=title,category=category,seconds=20,video=f'{category}/{rid}/previs.mp4',clean=f'{category}/{rid}/clean.mp4',prompt=f'{category}/{rid}/prompt.txt',shots=timeline,transitions=[dict(at=(i+1)*2,type=t,label=NAMES[t],duration=0 if t=='cut' else .2) for i,t in enumerate(transitions)],checks=checks)
        (dest/'recipe.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8');results.append(record)
        print('DONE',rid,flush=True)
    data=dict(version=m.get('version',2),preferred_edition=m.get('preferred_edition','video'),shots=list(shots.values()),presets=results)
    (out/'presets.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    template=Path(__file__).with_name('camera_treatments.html').read_text(encoding='utf-8')
    (out/'index.html').write_text(template.replace('__DATA__',json.dumps(data,ensure_ascii=False).replace('</','<\\/')),encoding='utf-8')
    (out/'README.md').write_text('# 구도를 유지한 카메라·전환 프리셋\n\nindex.html: 왼쪽 재생, 오른쪽 컷별 설명/프롬프트/타임라인. 전환 시안과 생성 입력용 클린 버전을 전환할 수 있습니다. 8개 조합은 각각 20초, 1080×1920, 60fps, 무음입니다. shots/에는 재조합할 수 있는 16개 개별 클린 컷과 1080×1920 시작 PNG가 있습니다.\n\n기존 v1의 60프레임 구도를 경로 중심으로 사용했습니다. 차량과 모든 물체는 정지하며 카메라만 움직입니다. 돌리 인/아웃, 좌우 슬라이드, 상승/하강, 팬, 틸트, 짧은 아크를 구도별로 배치했습니다. 렌즈 줌이나 차종 변경은 없습니다.\n\n전환은 9개 경계마다 명시했습니다. 직접 컷, 0.2초 디졸브, 암전, 일부 방향 전환을 사용합니다. 전환은 편집 효과이며 실물의 움직임이 아닙니다. 이중 노출/형태 변형이 생성에 전파되지 않도록 생성에는 clean.mp4와 prompt.txt를 권장합니다. 결과물 조합 단계에 recipe.json 전환을 적용하세요. 핸들을 겹쳐도 길이는 정확히 1200프레임입니다.\n\n대상 실차 사진은 포함하지 않습니다. Start PNG는 프록시 구도 참고용으로 실제 차량 사진 기반 Start Frame을 대신하지 않습니다. 실내는 범용 덩어리이므로 실제 차량 실내 사진이 별도로 필요합니다.\n\n제작: refine_camera_presets.py (검증된 MCP) → render_camera_presets.py → package_camera_treatments.py. 이전 v1은 보존합니다. Blender/실행 기록은 .local/previs/preset-camera-v002에 보관합니다.\n',encoding='utf-8')
    if m.get('version',2)>=3:
        readme=out/'README.md';txt=readme.read_text(encoding='utf-8')
        start=txt.index('기존 v1의');end=txt.index('\n\n전환은',start)
        txt=txt[:start]+m['readme_camera']+' 차량·휠·실내 부품은 모두 정지합니다. 렌즈 줌은 없습니다.'+txt[end:]
        txt=txt.replace('직접 컷, 0.2초 디졸브, 암전, 일부 방향 전환을 사용합니다.','직접 컷을 기본으로, 일부 전체차 연결에 0.2초 디졸브와 실내 진입/이탈에 짧은 암전을 사용합니다.')
        txt=txt.replace('refine_camera_presets.py',m['build_tool']).replace('이전 v1은 보존합니다.','이전 v1·v2는 보존합니다.').replace('preset-camera-v002',m['revision'])
        readme.write_text(txt,encoding='utf-8')

if __name__=='__main__':main()
