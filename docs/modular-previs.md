# 컷별 자동차 프리비즈 도구

세 레퍼런스의 31컷을 독립 씬으로 관리한다. A/B는 GT7 주행 레퍼런스, C는 실제 차량 문·실내·정차 ASMR 레퍼런스다. 소스 ID와 실측 컷 경계는 `tools/previs/shots.py`에 있다. 카메라 수치는 원본의 정확한 복원값이 아닌 직접 만든 블로킹이다.

## 현재 라이브러리

`.local/previs/modular-car-v001/`에 `index.html`, `manifest.json`, `modular-car.blend`, `photo-guide.md`, `all-prompts.md`가 있다. 컷별 폴더에 `preview.mp4`, `start.png`, `mid.png`, `end.png`, `prompt.txt`를 둔다. 모든 출력은 1080×1920, 60fps, 무음이다. 최종 사용자 시각 승인은 별도다.

사용자 요청으로 카메라 움직임을 추가한 변형은 `.local/previs/modular-car-v002/`다. ASMR C01–C09에 짧은 전진·후진·옆 이동을 넣었다. A/B 주행 22컷과 휠·인물·조작부 애니메이션은 유지한다. 사용자는 원본 주행의 바퀴 회전을 유지하기로 했으므로 정지 휠 버전으로 바꾸지 않는다. v001은 비교용으로 보존한다. 새 C 카메라는 원본의 정확한 재현이 아닌 추가 연출이다.

`camera_motion.py`는 v001을 열어 둔 검증된 MCP 인스턴스에서 실행하며 새 v002를 만든다. 기존 v002가 있으면 덮어쓰지 않고 멈춘다. 기존 컷을 복사한 새 버전을 패키징할 때는 `python tools/previs/package.py --library .local/previs/modular-car-v002 --encode-ids C01,C02,C03,C04,C05,C06,C07,C08,C09`를 쓴다. 지정하지 않은 컷도 파일 존재·전체 디코딩·형식을 검증한다.

차체는 기존 직접 제작한 일반 차량 프록시를 재사용한다. 새 카메라, 도로, 실내 조작부, 주황색 손/사람 프록시는 직접 제작했다. BMW/964 정밀 모델이 아니다. 사진을 받으면 실제 구조에 맞춰 변경한다. 이전 요청대로 윙은 생략했다.

원본과 생성물·Blender 파일·검수 기록은 Git에 넣지 않는다. 분석용 다운로드는 공개 재사용 권한을 뜻하지 않는다.

## 실행

1. `AGENTS.md`대로 이번 작업용 Blender를 CLI로 새로 시작하고 MCP PID를 검증한다. 기존 파일을 보존한다.
2. MCP에서 `build.py`를 실행한다. 기존 프록시 `.local/previs/exterior-30s-v004/exterior-30s.blend`가 필요하다. 해당 파일이 없으면 사용 가능한 직접 제작 모델을 먼저 지정한다. 장면 전체를 교체하므로 작업용 인스턴스/파일에서 실행한다.

```python
from pathlib import Path
p = Path('C:/Users/joonb/OneDrive/바탕 화면/instagram-car/tools/previs/build.py')
ns = {'__file__': str(p)}
exec(compile(p.read_text(encoding='utf-8'), str(p), 'exec'), ns)
result = ns['result']
```

3. 저장된 파일에서 CLI로 스틸을 먼저 렌더한다. 경계 PNG를 검토하고 수정한 뒤 전체 애니메이션을 렌더한다. `--python-exit-code 1`과 새 완료 receipt 둘 다 확인한다.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background '.local/previs/modular-car-v001/modular-car.blend' --python-exit-code 1 --python 'tools/previs/render.py' -- --stills
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background '.local/previs/modular-car-v001/modular-car.blend' --python-exit-code 1 --python 'tools/previs/verify_scene.py'
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background '.local/previs/modular-car-v001/modular-car.blend' --python-exit-code 1 --python 'tools/previs/render.py'
$env:PYTHONPATH = Join-Path (Get-Location) '.local/runtime'
& 'C:/Users/joonb/.local/bin/python3.11.exe' 'tools/previs/package.py'
& 'C:/Users/joonb/.local/bin/python3.11.exe' 'tools/previs/test_assembly.py'
```

Python은 Pillow와 로컬 imageio_ffmpeg 바이너리를 사용한다. 이번 설치 경로는 코드에 명시되어 있다. 다른 환경에서는 경로를 먼저 확인한다. Blender 5.2 Action은 `layers -> strips -> channelbags -> fcurves`를 사용한다.

4. `index.html` 씬 플레이어에서 왼쪽 영상과 오른쪽 씬 번호·제목·한국어 설명·영문 프롬프트를 확인한다. 썸네일을 클릭하면 해당 컷으로 이동해 재생한다. 전체 시간 막대로 컷 안의 시점까지 이동할 수 있다. A/B/C 모음 선택, 연속 재생, 전체 반복, 재생 속도, 프롬프트 복사를 지원한다. 연속 재생을 끄면 해당 컷에서 멈추며, 전체 반복이 꺼져 있으면 마지막 컷에서 끝난다. 브라우저가 자동 재생을 막으면 재생 버튼을 누른다.

페이지는 CSS·JS·씬 데이터를 포함한 독립 HTML이며 영상·프레임은 같은 폴더의 상대경로로 읽는다. `player.html`도 같은 플레이어다. 기존 조합 목록은 `catalog.html`로 유지하며, 플레이어 상단의 **컷 조합하기**에서 접근한다. 조합 목록에서 컷을 선택 순서대로 추가한다. 예를 들어:

```powershell
& 'C:/Users/joonb/.local/bin/python3.11.exe' 'tools/previs/assemble.py' --library '.local/previs/modular-car-v001' --ids 'C01,C02,C05,C06,A01,A09,A03,C07,C09' --max-seconds 20 --name 'door-drive-idle'
```

`--recipe`는 목록에서 저장한 JSON도 받는다. 20초를 넘으면 컷 경계에서 파트로 나누며, 개별 컷이 제한보다 길면 오류로 멈춘다. 기존 출력 덮어쓰기와 우발적 중복은 막는다. 동일 컷을 의도적으로 반복할 때만 `--allow-repeat`를 사용한다. A12는 A01의 루프 복귀 컷이다.

레시피 예시: `{"revision":"modular-car-v001","shots":["C02","C05"]}`. `shots` 배열의 순서가 편집 순서다. 위 20초는 이 프로젝트에서 사용자가 확인한 입력 제한이며, 다른 서비스에 그대로 적용하지 않는다.

플레이어만 다시 만들 때는 Blender나 재인코딩이 필요 없다. 원본은 `tools/previs/player.py`, `player.html`, `player.css`, `player.js`다. 한국어 컷 설명과 필요한 사진 이름은 `player.py`에서 관리한다. C의 추가 카메라 설명은 `camera_motion`이 있는 변형에만 적용한다. `package.py --catalog-only`는 조합 목록과 플레이어를 함께 갱신한다.

```powershell
& 'C:/Users/joonb/.local/bin/python3.11.exe' -X utf8 tools/previs/player.py --library .local/previs/modular-car-v002
node tools/previs/test_player.cjs .local/previs/modular-car-v002
```

플레이어 검사는 실제 31컷의 경계 탐색, 모음별 순서·총시간, 연속/반복 분기, 파일과 프롬프트 연결을 확인한다. 실제 브라우저 영상 재생·레이아웃 검토 여부는 별도 기록한다. 표시용 폴더를 복사할 때 HTML뿐 아니라 연결된 컷 폴더와 `catalog.html`도 유지한다.

## 검수와 사진 적용

`scene-verification.json`은 31씬의 5시점 타이어 접지, 이동·회전, 지정 전체차 구도와 접촉 부모 관계를 검사한다. `verification.json`은 인코딩된 파일을 전체 디코딩해 크기·fps·프레임수·무음·SHA256을 확인한다. 수치 통과만으로 자연스러운 손 해부학이나 연속 재생에서의 휠 방향이 승인되는 것은 아니다. 독립 검토에는 정확한 검사 범위와 파일 해시를 남긴다.

기존 C02 오독(창문 크랭크)을 실제 연속 표본으로 도어풀 동작으로 수정했다. 자동 컷 검출도 손 움직임을 여러 컷으로 오인하므로 반드시 직접 표본을 확인한다. C01/C09는 외부 카메라지만 열린 실내가 보이므로 mixed 분류다.

현재 C05/C07는 일반적인 오른쪽 물리 키 배치를 설명하는 프록시다. 964 사진을 적용할 때 실제 키 위치로 바꾸고 다시 프레임을 검토한다. 자동기어·전자식 주차브레이크·시동 버튼에는 현재 수동 조작 영상을 그대로 쓰지 않는다. 카메라를 보존하면서 동작과 필요한 구조를 바꾼다.

현재 프레임은 프리비즈 Start Frame이다. 실제 차량 이미지로 만든 생성용 Start Frame과 서비스 설정·태그 바인딩은 사진 수령 후 별도로 확인한다.
