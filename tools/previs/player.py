"""Build an offline scene player from an existing, private previs library."""
from pathlib import Path
import argparse
import json

HERE = Path(__file__).resolve().parent

# Human-readable descriptions of the authored framing, not a camera reconstruction.
NOTES = {
    'A01': '차량 앞쪽 사선의 낮은 위치에서 차와 같은 속도로 따라갑니다. 차 전체의 크기를 일정하게 유지합니다.',
    'A02': '높은 전방 사선에서 보닛·앞유리·앞바퀴를 가까이 담습니다. 차의 앞부분은 화면 왼쪽을 향합니다.',
    'A03': '뒤쪽 사선에서 후면과 뒷바퀴를 따라갑니다. 거리와 화면 속 차의 크기를 안정적으로 유지합니다.',
    'A04': '앞쪽 위에서 보닛과 그릴을 가파르게 내려다봅니다. 보닛의 앞끝이 화면 왼쪽 아래로 향하는 대각 구도를 유지합니다.',
    'A05': '트렁크와 후미등을 위에서 가까이 담고, 카메라를 옆으로 조금 이동합니다.',
    'A06': '지면 가까이에서 앞 범퍼와 헤드라이트를 따라갑니다. 차의 앞부분은 왼쪽을 향하고, 도로가 뒤로 흐릅니다.',
    'A07': '뒷바퀴와 뒤 펜더를 낮은 위치에서 올려다보며 따라갑니다. 바퀴의 회전과 차체 뒤로 보이는 하늘을 함께 담습니다.',
    'A08': '보닛과 앞유리를 대각선 탑뷰로 담습니다. 차 앞쪽이 화면 위를 향하고, 앞유리와 지붕은 아래로 이어집니다.',
    'A09': '앞바퀴 축을 화면 중심에 두고 측면에서 따라갑니다. 바퀴의 회전과 타이어가 도로에 닿는 부분을 보여줍니다.',
    'A10': '차 앞부분과 앞바퀴를 함께 담는 얕은 측면 구도입니다. 카메라는 뒤쪽으로 조금 미끄러지듯 이동합니다.',
    'A11': '차량 뒤쪽 사선을 낮은 위치에서 따라갑니다. 수평을 유지하며 하늘을 넉넉하게 담습니다.',
    'A12': '첫 컷 A01의 낮은 전방 사선 구도로 돌아옵니다. 처음과 끝을 연결하기 위한 짧은 루프 복귀 컷입니다.',
    'B01': '낮은 전방 사선에서 시작해 정면 쪽으로 조금 이동합니다. 차량과 같은 속도로 달리며 크기를 유지합니다.',
    'B02': '차량 옆에서 앞끝을 따라가다가 앞바퀴 쪽으로 이동합니다. 마지막에 앞바퀴가 분명히 보이게 담습니다.',
    'B03': '보닛·앞유리·지붕 앞끝을 위쪽 사선에서 넓게 담습니다. 차 앞부분은 화면 위를 향합니다.',
    'B04': '앞바퀴를 가까이 따라갑니다. 주행 속도에 맞춰 회전하는 휠과 스포크를 보여줍니다.',
    'B05': '반대편의 높은 전방 사선에서 보닛·앞유리·측면을 함께 담습니다. 차 앞부분이 화면 위를 향하는 구도입니다.',
    'B06': '앞쪽 위에서 보닛과 그릴을 가파르게 내려다봅니다. 차량 중심선 쪽으로 조금 이동합니다.',
    'B07': '전방 사선에서 차의 앞 절반을 따라가며 측면 쪽으로 이동합니다. 앞바퀴가 점점 더 드러납니다.',
    'B08': '트렁크와 뒷유리 아래쪽을 위쪽 사선에서 가까이 담습니다. 뒤 데크의 끝은 화면 왼쪽 아래를 향합니다.',
    'B09': '낮은 측면에서 차량을 따라가며 뒷바퀴 쪽으로 이동합니다. 수평선과 직진하는 차량을 안정적으로 유지합니다.',
    'B10': '높은 후방 사선에서 측면 쪽으로 작은 호를 그리며 이동합니다. 차량은 계속 앞으로 주행합니다.',
    'C01': '사람이 운전석 문을 여는 동안 카메라가 문을 따라 옆으로 이동하며 조금 다가갑니다. 손잡이와 손, 열리는 실내가 보이도록 허리 높이 구도를 유지합니다.',
    'C02': '손이 큰 실내 도어풀을 잡고 문을 당겨 닫습니다. 카메라는 도어패널을 따라 조금 이동하며 손잡이에 다가갑니다.',
    'C03': '손이 수동 기어 레버를 조작합니다. 카메라는 센터콘솔 위에서 기어 노브를 향해 대각선으로 천천히 다가갑니다.',
    'C04': '손이 기계식 핸드브레이크를 조작합니다. 카메라는 옆으로 이동하며 조금 낮아져, 레버와 회전축을 함께 보여줍니다.',
    'C05': '물리 키를 꽂아 돌려 시동을 겁니다. 카메라는 스티어링과 계기판에서 키 쪽으로 천천히 다가가며 조금 낮아집니다.',
    'C06': '정차한 차의 뒤쪽 사선을 낮은 위치에서 담습니다. 카메라가 옆으로 이동하며 범퍼와 배기구에 조금 다가갑니다. 차와 바퀴는 움직이지 않습니다.',
    'C07': '손이 시동을 끄고 키를 뺍니다. 카메라는 조금 물러나며 주변 실내가 더 보이도록 합니다.',
    'C08': '손가락으로 작은 실내 도어 릴리스를 당겨 문을 엽니다. 카메라는 손가락과 릴리스를 놓치지 않도록 짧게 다가가며 옆으로 이동합니다.',
    'C09': '사람이 운전석 문을 밀어 닫습니다. 카메라는 문을 따라 뒤로 이동하며 조금 물러나, 닫히는 틈과 손의 접촉을 끝까지 담습니다.',
}

PHOTO_NAMES = {
    'front_three_quarter': '전방 사선 외관', 'front_high': '높은 전방 사선',
    'rear_three_quarter': '후방 사선 외관', 'hood_high': '보닛·그릴 상부',
    'rear_high': '트렁크·뒷유리 상부', 'front_detail': '범퍼·헤드라이트',
    'rear_wheel': '뒷바퀴·펜더', 'hood_windshield': '보닛·앞유리 상부',
    'front_wheel': '앞바퀴', 'front_side': '차량 앞 절반 측면',
    'rear_low': '낮은 후방 사선·배기구', 'front_high_opposite': '반대편 전방 상부',
    'side': '측면 외관', 'rear_three_quarter_high': '높은 후방 사선',
    'exterior_driver_side + open_door_cockpit': '운전석 쪽 외관 + 열린 문·실내',
    'inside_door_panel': '운전석 안쪽 도어패널', 'gear_console': '기어 노브·센터콘솔',
    'handbrake_console': '핸드브레이크·좌석 사이', 'ignition_cluster': '키 구멍·스티어링·계기판',
}

SIMPLE_PERSON_NOTES = {
    'C01': '사람은 주황 사각기둥 하나로 표시합니다. 팔·손 없이 문이 열리는 동작을 보여주며, 카메라는 문을 따라 옆으로 이동하면서 조금 다가갑니다. 기둥은 문이 지나가는 전체 범위 밖에 있습니다.',
    'C02': '팔·손 없이 큰 실내 도어풀과 문이 안쪽으로 닫히는 동작을 보여줍니다. 카메라는 도어패널을 따라 조금 이동하며 손잡이에 다가갑니다.',
    'C03': '팔·손 없이 수동 기어 레버의 움직임만 보여줍니다. 카메라는 센터콘솔 위에서 기어 노브를 향해 대각선으로 천천히 다가갑니다.',
    'C04': '팔·손 없이 기계식 핸드브레이크의 움직임만 보여줍니다. 카메라는 옆으로 이동하며 조금 낮아져 레버와 회전축을 함께 담습니다.',
    'C05': '팔·손 없이 물리 키가 꽂히고 돌아가는 동작을 보여줍니다. 카메라는 스티어링과 계기판에서 키 쪽으로 천천히 다가갑니다.',
    'C07': '팔·손 없이 키가 돌아가고 빠지는 동작을 보여줍니다. 카메라는 조금 물러나 주변 실내를 더 담습니다.',
    'C08': '팔·손 없이 작은 실내 도어 릴리스가 움직이고 문이 열리는 동작을 보여줍니다. 카메라는 릴리스 쪽으로 짧게 다가가며 옆으로 이동합니다.',
    'C09': '사람은 주황 사각기둥 하나로 표시합니다. 팔·손 없이 문이 닫히는 동작을 보여주며, 카메라는 문을 따라 뒤로 이동하면서 조금 물러납니다. 기둥은 문이 지나가는 전체 범위 밖에 있습니다.',
}


def build_player(library, manifest=None):
    library = Path(library).resolve()
    manifest = manifest or json.loads((library / 'manifest.json').read_text(encoding='utf-8'))
    shots = []
    for s in manifest['shots']:
        shot = dict(s)
        # C notes describe the additional v002 camera moves only.
        note = NOTES.get(s['id']) if s['id'][0] != 'C' or s.get('camera_motion') else None
        if s.get('person_proxy_mode') in ['single_cuboid', 'control_only']:
            if s.get('camera_motion'):
                note = SIMPLE_PERSON_NOTES.get(s['id'], note)
            else:
                note = ('사람은 팔·손 없는 사각기둥 하나로 표시합니다. ' if s['person_proxy_mode'] == 'single_cuboid' else '팔·손 없이 조작부 움직임만 보여줍니다. ') + s['camera_prompt']
        shot['description_ko'] = note or s['camera_prompt']
        shot['photo_label'] = PHOTO_NAMES.get(s['photos'], s['photos'])
        for field in ('clip', 'mid_frame', 'start_frame'):
            asset = (library / s[field]).resolve()
            if not asset.is_relative_to(library) or not asset.is_file():
                raise ValueError(f"Missing or invalid {field}: {s['id']}")
        shots.append(shot)
    payload = json.dumps({'revision': manifest['revision'], 'shots': shots}, ensure_ascii=False)
    payload = payload.replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e')
    document = (HERE / 'player.html').read_text(encoding='utf-8')
    # Replace data last; user-supplied text cannot become a template instruction.
    document = document.replace('/*__CSS__*/', (HERE / 'player.css').read_text(encoding='utf-8'))
    document = document.replace('/*__JS__*/', (HERE / 'player.js').read_text(encoding='utf-8'))
    document = document.replace('__MANIFEST_JSON__', payload)
    for name in ('index.html', 'player.html'):
        (library / name).write_text(document, encoding='utf-8')
    return library / 'index.html'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--library', required=True, type=Path)
    print(build_player(parser.parse_args().library))
