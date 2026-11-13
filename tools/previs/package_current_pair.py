"""Assemble the current 10s exterior/interior pair from Git-tracked proxy clips."""
from pathlib import Path
import argparse
import copy
import json
import os
import shutil
import subprocess
from PIL import Image
import package

ROOT = Path(__file__).resolve().parents[2]
RECIPES = [
    ('EXTERIOR', '실외 10초 · 후면 컷 분리', 'camera-only-20s-v3', ['A06','A07','A03','A08','A11']),
    ('INTERIOR', '좌핸들 실내 10초 · 첫 컷 돌리 인', 'interior-lhd-v2', ['I01','I05','I02','I04','I06']),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT/'presets/current-10s')
    parser.add_argument('--ffmpeg', type=Path, default=package.FF)
    args = parser.parse_args()
    out = args.output.resolve()
    assert not out.exists(), 'Preserve existing output; choose a new --output folder'
    package.FF = args.ffmpeg.resolve()
    assert package.FF.is_file(), 'Provide --ffmpeg with an installed ffmpeg executable'
    receipt_dir = ROOT/'.local/previs/current-pair-packaging'/out.name
    receipt_dir.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True)
    shots, recipes, checks, expected_sequences = [], [], {}, []

    def relative(path):
        return Path(os.path.relpath(path, out)).as_posix()

    def run(args):
        return subprocess.run([str(package.FF), '-hide_banner', '-v', 'error', *map(str, args)],
                              check=True, capture_output=True)

    def hashes(path):
        raw = run(['-i', path, '-map', '0:v:0', '-f', 'framemd5', '-']).stdout.decode()
        return [s.split(',')[-1].strip() for s in raw.splitlines() if s and not s.startswith('#')]

    def concat(paths, name, target):
        listing = receipt_dir/(name+'-concat.txt')
        listing.write_text(''.join("file '"+p.as_posix()+"'\n" for p in paths), encoding='utf-8')
        run(['-f','concat','-safe',0,'-i',listing,'-c','copy','-movflags','+faststart','-n',target])

    for rid, title, source_name, ids in RECIPES:
        source = ROOT/'presets'/source_name
        data = json.loads((source/'presets.json').read_text(encoding='utf-8'))
        lookup = {s['id']:s for s in data['shots']}
        folder = out/rid
        folder.mkdir()
        paths, timeline, sequence = [], [], []
        for i, sid in enumerate(ids):
            row = copy.deepcopy(lookup[sid])
            clip, start = source/row['clip'], source/row['start_frame']
            checks[sid] = package.probe(clip)
            assert checks[sid]['frames']==120, (sid, 'Expected clean 2-second source')
            with Image.open(start) as image:
                assert image.size==(1080,1920)
            row.update(frames=120, duration=2, core_duration=2, source_package=source_name)
            for key in ['clip','start_frame','mid_frame','end_frame']:
                if key in row:
                    path = source/row[key]
                    if path.is_file(): row[key]=relative(path)
                    else: del row[key]
            shots.append(row)
            paths.append(clip)
            sequence.extend(hashes(clip))
            timeline.append(dict(id=sid, title=row['title'], start=i*2, end=i*2+2,
                camera_prompt=row['prompt'], transition_after='직접 컷' if i<4 else '종료',
                transition='cut' if i<4 else None))
        target = folder/'previs.mp4'
        concat(paths, rid, target)
        checks[rid] = package.probe(target)
        assert checks[rid]['frames']==600 and hashes(target)==sequence
        expected_sequences.extend(sequence)
        shutil.copy2(source/lookup[ids[0]]['start_frame'], folder/'start.png')
        recipe = dict(id=rid, title=title, category='.', seconds=10, frames=600,
            video=f'{rid}/previs.mp4', clean=f'{rid}/previs.mp4', prompt=f'{rid}/prompt.txt',
            source_package=source_name, shots=timeline,
            transitions=[dict(at=t, type='cut', duration=0) for t in [2,4,6,8]])
        base = ('Create a 10-second portrait 9:16 car film using the supplied previs for shot order, framing and camera motion. '
                'Use the target-car photos for appearance. The proxy body and neutral interior specify composition only. '
                'The vehicle, wheels, environment, doors and all controls remain stationary. Only the camera moves. '
                'Use fixed focal lengths, clean direct cuts at 2, 4, 6 and 8 seconds, and no added shots, hands, captions or music. ')
        base += ('Keep the high/front shot between the two rear views. ' if rid=='EXTERIOR' else
                 'Preserve the photographed left-hand-drive layout. The opening moves gently forward; do not pull back or widen the view. ')
        prompt = base.rstrip()+'\n\n'+'\n'.join(f'{s["start"]}-{s["end"]}s: {s["id"]}. {s["camera_prompt"]}' for s in timeline)+'\n'
        (folder/'prompt.txt').write_text(prompt, encoding='utf-8')
        (folder/'recipe.json').write_text(json.dumps(recipe, ensure_ascii=False, indent=2), encoding='utf-8')
        recipes.append(recipe)
    review = out/'REVIEW'
    review.mkdir()
    concat([out/r['video'] for r in recipes], 'combined', review/'combined-20s.mp4')
    checks['combined'] = package.probe(review/'combined-20s.mp4')
    assert checks['combined']['frames']==1200 and hashes(review/'combined-20s.mp4')==expected_sequences
    data = dict(version='current-10s-2026-11-13', preferred_edition='clean', shots=shots, presets=recipes)
    (out/'presets.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    template = (ROOT/'tools/previs/camera_treatments.html').read_text(encoding='utf-8')
    template = template.replace('<title>카메라·전환 프리비즈</title>', '<title>현재 프리비즈 · 실외 / 실내</title>')
    template = template.replace('<select id="edition" aria-label="영상 버전">', '<select id="edition" aria-label="영상 버전" hidden>')
    template = template.replace('기존 구도 + 카메라 기법 + 컷별 전환', '현재 프리비즈 · 실외 / 좌핸들 실내')
    template = template.replace('8개 × 20초 · 1080×1920 · 60fps · 차량/휠/실내 고정. 생성에는 클린 버전을 사용하고 전환은 편집 단계에 적용하세요.',
        '실외 10초 + 실내 10초 · 1080×1920 · 60fps · 카메라만 이동. 실제 차량 디자인은 사진으로 지정하세요.')
    (out/'index.html').write_text(template.replace('__DATA__', json.dumps(data, ensure_ascii=False).replace('</','<\\/')), encoding='utf-8')
    (receipt_dir/'verification.json').write_text(json.dumps(dict(files=checks,
        decoded_sequences_exact=True, method='Stream-copy assembly of tracked proxy clips; no Blender scene edits.'), indent=2), encoding='utf-8')
    print('PASS: 10 tracked clips, exact 600/600/1200 frames, 1080x1920/60fps/silent; source media untouched')


if __name__=='__main__':
    main()
