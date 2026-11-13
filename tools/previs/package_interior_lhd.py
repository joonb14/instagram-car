"""Package the directly authored LHD proxies; no private car photos in Git."""
from pathlib import Path
import json
import shutil
import subprocess
from package import FF, probe

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.local/previs/interior-lhd-v001'
OUT = ROOT / 'presets/interior-lhd-v1'
assert not OUT.exists(), 'Use a new revision'
OUT.mkdir(parents=True)
manifest = json.loads((SOURCE / 'manifest.json').read_text(encoding='utf-8'))
shots = []
checks = {}


def run(args):
    return subprocess.run([str(FF), '-hide_banner', '-v', 'error', *map(str, args)],
                          check=True, capture_output=True)


def hashes(path):
    output = run(['-i', path, '-map', '0:v:0', '-f', 'framemd5', '-']).stdout.decode()
    return [line.split(',')[-1].strip() for line in output.splitlines() if line and not line.startswith('#')]


for row in manifest['shots']:
    sid = row['id']
    dst = OUT / 'shots' / sid
    dst.mkdir(parents=True)
    frames = list((SOURCE / sid / 'frames').glob('*.png'))
    assert len(frames) == 120, (sid, len(frames))
    run(['-framerate', '60', '-start_number', '1', '-i', SOURCE/sid/'frames/%04d.png',
         '-frames:v', '120', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
         '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-n', dst/'preview.mp4'])
    for label in ['start', 'mid', 'end']:
        shutil.copy2(SOURCE/sid/(label+'.png'), dst/(label+'.png'))
    row.update(clip=f'shots/{sid}/preview.mp4', start_frame=f'shots/{sid}/start.png',
               mid_frame=f'shots/{sid}/mid.png', end_frame=f'shots/{sid}/end.png')
    (dst/'prompt.txt').write_text(row['prompt'], encoding='utf-8')
    shots.append(row)
    checks[sid] = probe(dst/'preview.mp4')
    assert checks[sid]['frames'] == 120

order = ['I01', 'I05', 'I02', 'I04', 'I06']
concat = SOURCE/'lhd-10s-concat.txt'
concat.write_text(''.join("file '"+(OUT/'shots'/sid/'preview.mp4').as_posix()+"'\n" for sid in order), encoding='utf-8')
run(['-f', 'concat', '-safe', '0', '-i', concat, '-c', 'copy', '-movflags', '+faststart', '-n', OUT/'interior-10s.mp4'])
checks['interior-10s'] = probe(OUT/'interior-10s.mp4')
assert checks['interior-10s']['frames'] == 600
assert hashes(OUT/'interior-10s.mp4') == sum((hashes(OUT/'shots'/sid/'preview.mp4') for sid in order), [])
lookup = {s['id']: s for s in shots}
timeline = [dict(id=sid, title=lookup[sid]['title'], start=i*2, end=i*2+2,
                 camera_prompt=lookup[sid]['prompt'], transition_after='직접 컷' if i<4 else '종료',
                 transition='cut' if i<4 else None) for i, sid in enumerate(order)]
recipe = dict(id='LHD', title='좌핸들 실내 10초', category='.', seconds=10,
              video='interior-10s.mp4', clean='interior-10s.mp4', shots=timeline,
              transitions=[dict(at=t, type='cut', duration=0) for t in [2,4,6,8]])
data = dict(version='interior-lhd-v1', preferred_edition='clean', driving_side='left_hand_drive', shots=shots, presets=[recipe])
(OUT/'presets.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
template = (ROOT/'tools/previs/camera_treatments.html').read_text(encoding='utf-8')
template = template.replace('기존 구도 + 카메라 기법 + 컷별 전환', '좌핸들 실내 프리비즈')
template = template.replace('8개 × 20초 · 1080×1920 · 60fps · 차량/휠/실내 고정. 생성에는 클린 버전을 사용하고 전환은 편집 단계에 적용하세요.',
                            '좌핸들 · 10초 · 1080×1920 · 60fps · 카메라만 이동. I01–I06 개별 컷도 함께 제공합니다.')
(OUT/'index.html').write_text(template.replace('__DATA__', json.dumps(data, ensure_ascii=False).replace('</', '<\\/')), encoding='utf-8')
(OUT/'README.md').write_text('좌핸들 범용 실내 프리비즈. 차량 전방 -Y, 운전자 왼쪽 +X.\n\n'
    '카메라만 이동하며 핸들·기어·문·시트는 고정입니다. 기존 v3 구도와 경로를 좌핸들 기준으로 반영한 Blender 재렌더입니다. '
    'I01→I05→I02→I04→I06은 각 2초, 총 10초입니다. I03 도어 상세도 개별 컷으로 제공합니다. '
    '실제 차량의 실내 디자인은 참조 사진으로 지정해야 합니다.\n\n'
    '소스/검증: .local/previs/interior-lhd-v001 (Git 제외). 이전 버전은 비교용으로 보존합니다.\n', encoding='utf-8')
(SOURCE/'encoded-verification.json').write_text(json.dumps(dict(files=checks, decoded_sequence_exact=True), indent=2), encoding='utf-8')
print('PASS: six clips and exact 600-frame 10s assembly; all 1080x1920/60fps/silent')
