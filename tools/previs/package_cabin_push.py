"""Package the I01 forward-dolly revision, reusing the other five LHD clips."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
from package import FF, probe

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.local/previs/interior-lhd-v002-push'
OLD = ROOT / 'presets/interior-lhd-v1'
OUT = ROOT / 'presets/interior-lhd-v2'
assert not OUT.exists(), 'Use a new revision'
persisted = json.loads((SOURCE/'persisted-push-verification.json').read_text(encoding='utf-8'))
assert persisted['monotonic_inward'] and .0399 < persisted['forward_travel_m'] < .0401
shutil.copytree(OLD, OUT)


def run(args):
    return subprocess.run([str(FF), '-hide_banner', '-v', 'error', *map(str, args)],
                          check=True, capture_output=True)


def hashes(path):
    raw = run(['-i', path, '-map', '0:v:0', '-f', 'framemd5', '-']).stdout.decode()
    return [s.split(',')[-1].strip() for s in raw.splitlines() if s and not s.startswith('#')]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


assert len(list((SOURCE/'I01/frames').glob('*.png'))) == 120
run(['-framerate', 60, '-start_number', 1, '-i', SOURCE/'I01/frames/%04d.png',
     '-frames:v', 120, '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', 18,
     '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', OUT/'shots/I01/preview.mp4'])
for label in ['start', 'mid', 'end']:
    shutil.copy2(SOURCE/'I01'/(label+'.png'), OUT/'shots/I01'/(label+'.png'))
olddata = json.loads((OLD/'presets.json').read_text(encoding='utf-8'))
data = json.loads((OLD/'presets.json').read_text(encoding='utf-8'))
manifest = json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
row = next(r for r in manifest['shots'] if r['id']=='I01')
row.update(clip='shots/I01/preview.mp4', start_frame='shots/I01/start.png',
           mid_frame='shots/I01/mid.png', end_frame='shots/I01/end.png')
data['shots'] = [row if s['id']=='I01' else s for s in data['shots']]
(OUT/'shots/I01/prompt.txt').write_text(row['prompt'], encoding='utf-8')
data.update(version='interior-lhd-v2', source_revision='interior-lhd-v1', changed_ids=['I01'])
recipe = data['presets'][0]
recipe['title'] = '좌핸들 실내 10초 · 첫 컷 돌리 인'
recipe['shots'][0].update(title=row['title'], camera_prompt=row['prompt'])
order = [s['id'] for s in recipe['shots']]
concat = SOURCE/'push-10s-concat.txt'
concat.write_text(''.join("file '"+(OUT/'shots'/sid/'preview.mp4').as_posix()+"'\n" for sid in order), encoding='utf-8')
run(['-f', 'concat', '-safe', 0, '-i', concat, '-c', 'copy', '-movflags', '+faststart', '-y', OUT/'interior-10s.mp4'])
(OUT/'presets.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
page = (OLD/'index.html').read_text(encoding='utf-8')
oldpayload = json.dumps(olddata, ensure_ascii=False).replace('</', '<\\/')
assert oldpayload in page
page = page.replace(oldpayload, json.dumps(data, ensure_ascii=False).replace('</', '<\\/'))
page = page.replace('좌핸들 실내 프리비즈', '좌핸들 실내 프리비즈 · 첫 컷 돌리 인')
(OUT/'index.html').write_text(page, encoding='utf-8')
(OUT/'README.md').write_text(
    '좌핸들 범용 실내 프리비즈 v2. 차량 전방 -Y, 운전자 왼쪽 +X.\n\n'
    'I01 첫 구도에서 고정 렌즈·고정 방향으로 4cm 전진합니다. 실내를 뒤로 빠지며 새롭게 드러내는 풀백을 제거했습니다. '
    '차량·시트·핸들·기어·도어는 정지합니다. I02–I06 영상과 PNG는 v1과 동일합니다.\n\n'
    'I01→I05→I02→I04→I06, 각 2초, 총 10초, 1080×1920/60fps/무음. I03은 독립 컷으로 제공합니다. '
    '실제 실내 디자인은 차량 사진을 따르며 생성 결과의 구조 보존을 보장하는 자료는 아닙니다.\n\n'
    '소스·검증: .local/previs/interior-lhd-v002-push (Git 제외). '
    '도구: revise_cabin_push.py → verify_cabin_push.py → render_camera_presets.py --ids I01 → package_cabin_push.py. '
    'v1은 비교용으로 보존합니다.\n', encoding='utf-8')
checks = {}
for shot in data['shots']:
    sid = shot['id']
    checks[sid] = probe(OUT/shot['clip'])
    assert checks[sid]['frames'] == 120
    if sid != 'I01':
        for f in (OLD/'shots'/sid).iterdir():
            assert sha(f) == sha(OUT/'shots'/sid/f.name), (sid, f.name)
checks['interior-10s'] = probe(OUT/'interior-10s.mp4')
assert checks['interior-10s']['frames'] == 600
assert hashes(OUT/'interior-10s.mp4') == sum((hashes(OUT/'shots'/sid/'preview.mp4') for sid in order), [])
(SOURCE/'encoded-verification.json').write_text(json.dumps(dict(files=checks,
    decoded_sequence_exact=True, unchanged_ids=['I02','I03','I04','I05','I06']), indent=2), encoding='utf-8')
print('PASS: 600-frame 10s forward-dolly assembly; I02-I06 byte-identical to v1')
