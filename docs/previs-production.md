# 프리비즈를 어떻게 만들었는가

이 문서는 이 저장소에서 실제로 사용한 제작 방식과 현재 결과물을 설명합니다. 레퍼런스 영상에서 카메라 수치를 자동 추출한 작업은 아닙니다. 원본의 컷과 구도를 눈으로 분석한 뒤, 단순한 3D 모델과 카메라 경로를 직접 작성하고 검토하며 수정했습니다.

완성 자료는 [현재 10초 묶음](../presets/current-10s/README.md), 이전 시안은 [프리셋 목록](../presets/README.md), 코드별 역할은 [도구 안내](../tools/previs/README.md)에 있습니다.

```mermaid
flowchart LR
    A[레퍼런스 컷 분석] --> B[단순 Blender 씬]
    B --> C[물체 고정 · 카메라 경로]
    C --> D[PNG 렌더 · 검토]
    D --> E[컷별 MP4 · 프롬프트]
    E --> F[실외·실내 조합]
    F --> G[실차 사진과 생성 입력]
```

## 1. 레퍼런스를 컷으로 나눴다

초기 `fvlAGwLelT8` 외관 작업에서 출발했고, 이후 `eaq0oFtTaQs`, `NHWZKfeyJII`, `xPlXE8XQi0Y`를 기반으로 A/B 외관과 C 실내·문 동작 라이브러리를 만들었습니다. 각 컷의 원본 시간대·길이·분류·구도는 [shots.py](../tools/previs/shots.py)에 기록했습니다. 원본 영상은 `.local/references/`에 보관합니다.

장면 전환 후보만 믿지 않고 앞뒤 프레임을 확인했습니다. 반사나 손 움직임도 컷처럼 보일 수 있기 때문입니다. 카메라가 차 밖에 있어도 열린 문으로 실내가 보이면 혼합 컷으로 분류했습니다. 이후 사용자가 선택한 구도를 기준으로 카메라 이동을 추가했으며, 이 추가 연출은 원본 카메라의 정확한 복원과 구분합니다.

## 2. 외형보다 구도와 움직임을 위한 3D 프록시를 만들었다

Blender에는 길·단순 차량·필요한 사람 위치를 남겼습니다. 차량은 직접 만든 범용 차체로, 휠 아치·바퀴·라이트가 구분되는 수준입니다. 정확한 964/G500 CAD가 아닙니다. 초기 외관 장면의 `approach_flush` 차체를 모듈형 라이브러리에서 재사용했습니다.

실내는 시트, 대시보드, 도어, 빈 콘솔, 단순 스티어링 링으로 구성했습니다. E30 전용 기어봉·키·버튼·도어풀을 일반 실내에 강제하지 않도록 단순화했습니다. 현재 사진 기반 생성에서는 실제 차의 사진이 실내 구조와 재질을 결정합니다.

사람이 필요한 이전 동작 컷에서는 팔·손·머리를 만들지 않고 사람당 사각기둥 하나만 사용했습니다. 기둥은 문이 움직이는 전체 범위와 최소 0.20m 간격을 두었습니다. 현재 10초 beauty 조합에는 사람이나 승하차 동작을 넣지 않았습니다.

## 3. 차량과 모든 부품을 멈추고 카메라만 움직였다

초기 주행 버전은 차량 이동량으로 휠 회전을 계산했습니다. 생성 결과에서 배경 이동 속도와 휠 회전이 맞지 않아 정차 방향으로 바꿨습니다. 잠깐 완전 스틸 버전을 만들었지만, 최종적으로는 **물체 고정 + 카메라 이동**을 선택했습니다.

[build_camera_presets.py](../tools/previs/build_camera_presets.py)는 기존 씬의 검토한 중간 프레임에서 물체의 월드 변환을 저장하고 애니메이션·부모 관계를 정리해 정차 상태를 유지합니다. 이후 카메라에만 키프레임을 넣습니다. 카메라 움직임 때문에 구도가 바뀔 수는 있지만 바퀴, 기어봉, 문, 시트, 배경은 움직이지 않습니다.

## 4. 컷의 대상에 맞춰 카메라 경로를 정했다

여러 기법을 임의로 섞은 시안에서 출발해, 사용자가 선택한 구도를 기준으로 대상이 잘 보이는 움직임으로 수정했습니다. [direct_camera_presets.py](../tools/previs/direct_camera_presets.py)에 기본 경로가 있습니다.

| 대상 | 카메라 경로 | 의도 |
|---|---|---|
| 차량 전체 | 차체 중심 주위의 수평 아크 | 실루엣과 입체감을 유지하면서 측면·후면 관계를 보여주기 |
| 상부·높은 측면 | 위에서 아래로 내려오는 수직 아크 | 단순 틸트가 아니라 위치를 이동해 높이와 깊이를 보여주기 |
| 휠 | 휠을 유지하며 대각선 뒤로 이동 | 펜더와 차체 일부를 드러내되 바퀴는 정지 |
| 라이트·전면 | 짧은 슬라이드 또는 접근 | 선택한 라이트가 화면에서 벗어나지 않게 유지 |
| 핸들·콘솔·도어·대시보드 | 해당 부위를 따라 짧은 이동 | 구조를 새로 만들거나 조작하는 느낌을 줄이기 |
| 현재 실내 전체 I01 | 고정 렌즈·고정 방향으로 4cm 전진 | 풀백에서 새 시트·내장이 생성되는 문제를 줄이기 |

원래 구도를 경로의 기준점으로 사용합니다. 수평 아크는 실제 차체 중심, 휠 컷은 실제 휠 위치를 대상으로 잡습니다. 월드 원점 주위를 무조건 돌리지 않습니다. 고정 렌즈를 사용하며 디지털 줌으로 움직임을 대신하지 않습니다.

현재 I01의 위치는 `시작 위치 + 카메라 전방 × 0.04m × (3u²−2u³)`이며 `u`는 컷의 진행률입니다. 시작과 끝에서 부드럽게 멈추며, 회전과 렌즈는 유지합니다. [revise_cabin_push.py](../tools/previs/revise_cabin_push.py)로 수정하고 [verify_cabin_push.py](../tools/previs/verify_cabin_push.py)로 실제 저장된 경로를 확인했습니다. 이 제한은 실내 전체 컷에 적용한 것이며 채택한 외관 휠 풀백은 유지했습니다.

## 5. 좌핸들과 컷 순서를 고쳤다

실내 프록시는 차량 전방이 -Y이고 운전자의 왼쪽은 +X입니다. 옛 버전은 스티어링이 -X에 있어 실제로 우핸들이었습니다. 좌핸들이라는 프롬프트만으로 해결하지 않고 [convert_interior_lhd.py](../tools/previs/convert_interior_lhd.py)로 실내와 카메라 경로를 함께 반영했습니다. 메시 방향과 양의 변환을 확인하고 다시 렌더했습니다. 새 실내 빌더도 좌핸들이 기본입니다. **이미 좌핸들인 씬에 이 과거 변환을 다시 적용하면 안 됩니다.**

실외는 비슷한 후면 구도 두 개가 연속되어 끊긴 움직임처럼 보였습니다. 현재 순서는 `A06 → A07 → A03 → A08 → A11`로, 뒤 사선과 마지막 후면 사이에 상부/전면 컷을 배치했습니다. 실내는 `I01 → I05 → I02 → I04 → I06`으로 전체에서 부분으로 이어집니다. 컷마다 2초인 현재 조합과 달리 이전 호흡 실험은 1–4초를 사용했으며, 앞으로도 컷 길이를 반드시 2초로 제한하지는 않습니다.

## 6. PNG로 렌더하고 컷 단위로 패키징했다

Workbench 렌더러로 1080×1920, 60fps PNG 시퀀스를 만들었습니다. [render_camera_presets.py](../tools/previs/render_camera_presets.py)는 현재 열린 `.blend` 옆의 `manifest.json`을 읽어 해당 씬을 렌더합니다. `--ids I01`처럼 변경한 컷만 선택할 수 있고 `--stills`로 시작·중간·끝 PNG를 먼저 확인할 수 있습니다.

PNG를 H.264/yuv420p 무음 MP4로 인코딩하고, 독립 컷·시작 PNG·영문 프롬프트·조합 JSON·HTML 플레이어를 만듭니다. 이전 전환 시안은 컷 양끝에 여유 프레임을 추가했지만 생성 입력에는 그 여유를 제거한 클린 영상을 사용합니다. 컷끼리의 전환은 가능한 한 직접 컷으로 유지합니다.

현재 [package_current_pair.py](../tools/previs/package_current_pair.py)는 Git에 있는 클린 MP4를 재인코딩 없이 연결합니다. 실외·실내 600프레임씩, 합본은 1200프레임입니다. 개별 컷은 원래 버전 폴더를 참조하므로 복사본을 불필요하게 늘리지 않습니다.

## 7. 검증 범위를 나눠 기록했다

| 확인 | 방법 |
|---|---|
| 물체가 정지하는가 | 프레임과 반 프레임에서 비카메라 오브젝트 변환 비교 |
| 올바른 카메라 이동인가 | 대상의 화면 위치, 전체차 여백, 하강의 단조성, 휠과 거리 변화 확인 |
| 좌핸들인가 | 화면 좌우만 보지 않고 차량 진행 방향 기준 스티어링 위치 확인 |
| 실내 I01이 전진하는가 | 저장 파일을 다시 연 뒤 239개 시점에서 4cm 전진·고정 렌즈·고정 방향 확인 |
| 파일이 정확한가 | FFmpeg 전체 디코딩, 1080×1920/60fps/무음과 프레임 수 검사 |
| 조합에 중복·누락이 없는가 | 조합 전후 디코딩 프레임 해시의 순서 비교 |
| 플레이어 타임라인이 맞는가 | 컷 선택, 경계 시각, 다음 영상 자동 진행, 마지막 정지를 DOM 테스트로 확인 |
| 화면이 자연스러운가 | 시작·중간·끝과 전환 경계 샘플을 시각 검토. 연속 재생·사용자 승인과 별도로 기록 |

수치 검증 통과는 실제 생성 결과의 구조 보존이나 사용자의 시각 승인을 보장하지 않습니다. 이 차이를 실행 기록에 남깁니다.

## 다시 실행하는 방법

### Git 파일만으로 현재 영상 재조합

필요한 것은 Python, Pillow, FFmpeg입니다. HTML 동작 테스트에는 Node.js가 필요합니다. Blender와 실제 차량 사진은 필요하지 않습니다. 이 프로젝트의 현재 로컬 Python 의존성은 `.local/runtime/`에 있고 FFmpeg 기본 경로는 `package.py`의 `FF`에 있습니다. 새 환경에서는 Pillow를 설치하고 `--ffmpeg`로 실제 실행 파일을 지정할 수 있습니다.

저장소 루트의 PowerShell에서, 기존 결과와 다른 출력 폴더를 사용합니다.

```powershell
$env:PYTHONPATH = Join-Path (Get-Location) '.local/runtime'
python tools/previs/package_current_pair.py --output .local/previs/current-pair-check
node tools/previs/test_camera_treatments.cjs .local/previs/current-pair-check
```

FFmpeg가 기본 위치에 없으면 첫 명령에 `--ffmpeg 'C:/설치한경로/ffmpeg.exe'`를 추가합니다. `python`도 실제 설치된 실행 파일을 사용하세요. 이미 존재하는 출력 폴더는 덮어쓰지 않으며 새 이름을 지정해야 합니다. 이 명령은 **패키징 재현**이고 새로운 3D 렌더 검증은 아닙니다.

### Blender 장면을 수정하거나 다시 렌더

새 Blender MCP 작업은 [AGENTS.md](../AGENTS.md)의 새 CLI 인스턴스·리스너 소유권 확인 절차를 먼저 따릅니다. 기존 사용자 씬과 미저장 작업은 보존합니다. 설치된 MCP 애드온을 활성화하고 서버를 시작한 뒤, 실제 MCP Python 호출로 아래 값을 받아 CLI로 띄운 PID와 비교합니다.

```python
import bpy, os
result = {
    "pid": os.getpid(),
    "version": bpy.app.version_string,
    "file": bpy.data.filepath,
    "addons": list(bpy.context.preferences.addons.keys()),
}
```

경로 생성 도구는 검증한 MCP 세션 안에서 실행합니다. 아래는 실행 형식이며, `path`에는 현재 만들 새 리비전에 맞는 도구 경로를 지정합니다. 원본·출력 경로가 도구 상단에 고정된 경우가 있으므로 먼저 확인하고, 완성된 폴더를 삭제해서 강제로 재실행하지 않습니다.

```python
from pathlib import Path
path = Path("C:/프로젝트경로/tools/previs/revise_cabin_push.py")
scope = {"__file__": str(path), "__name__": "__main__"}
exec(compile(path.read_text(encoding="utf-8-sig"), str(path), "exec"), scope)
result = scope.get("result")
```

저장한 파일을 다시 열고 검증한 다음 렌더합니다. 파일을 열면 이전 Blender window 객체 참조가 무효가 될 수 있으므로 새 참조를 얻습니다. 아래 예시는 현재 로컬 I01 소스를 별도의 배경 프로세스로 렌더하는 명령입니다. 렌더 PNG를 다시 쓰므로 필요한 수정이 있을 때 실행합니다.

```powershell
$blenderExe = 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe'
$sceneFile = '.local/previs/interior-lhd-v002-push/camera-presets.blend'
& $blenderExe --background $sceneFile --python-exit-code 1 --python tools/previs/render_camera_presets.py -- --ids I01 --stills
& $blenderExe --background $sceneFile --python-exit-code 1 --python tools/previs/render_camera_presets.py -- --ids I01
```

카메라를 수정한 뒤에는 저장 파일을 MCP에서 다시 열어 `verify_cabin_push.py`와 해당 장면 검증을 실행합니다. 배경 렌더는 이미 검증한 `.blend`의 출력 단계이며 MCP 연결 확인을 대신하지 않습니다.

### 재현에 필요한 로컬 원본

| 작업 | 필요한 로컬 입력 | 제작 도구 |
|---|---|---|
| 초기 모듈형 차체 | `.local/previs/exterior-30s-v004/exterior-30s.blend`의 `approach_flush` | `build.py` |
| 카메라 전용 기본 씬 | `.local/previs/modular-car-v003/modular-car.blend` | `build_camera_presets.py` |
| 대상별 카메라 v3 | `.local/previs/preset-camera-v001/camera-presets.blend`와 manifest | `direct_camera_presets.py` |
| 옛 우핸들 v3의 LHD 변환 | `.local/previs/preset-camera-v003/`의 당시 씬·manifest | `convert_interior_lhd.py` |
| 현재 I01 전진 수정 | `.local/previs/interior-lhd-v001/`의 씬·manifest | `revise_cabin_push.py` |
| 현재 실내 v2 패키징 | `.local/previs/interior-lhd-v002-push/`의 렌더와 검증 + Git의 LHD v1 | `package_cabin_push.py` |

`.blend`, 렌더 PNG 전체, 원본 레퍼런스, 실행 기록은 Git 제외입니다. 따라서 새 클론에서는 완성 프리비즈와 코드·프롬프트를 받고 재조합할 수 있지만, **위 초기 원본까지 포함한 3D 전체 복원은 로컬 파일을 추가로 가져와야 합니다.** 현재 코드는 과거 장면을 단계별로 수정한 도구 모음이며, 빈 Blender에서 전체 역사를 일괄 재생하는 빌더는 아닙니다.

실제 차량 사진과 생성 영상이 포함된 G500 전달 자료는 로컬 `output/g500-omni-10s-v003-push-recut/`에 있습니다. Git의 현재 패키지는 범용 프록시만 포함합니다. 생성 버튼 클릭, 서비스 과금, 게시·업로드는 이 제작 및 패키징 과정에 포함되지 않습니다.
