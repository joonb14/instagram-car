# 프리비즈 도구 지도

전체 제작 설명은 [제작 과정](../../docs/previs-production.md), 바로 사용할 영상은 [현재 패키지](../../presets/current-10s/README.md)에 있습니다. Blender 내부 실행 도구와 일반 Python/Node 도구를 구분해서 실행하세요.

## 현재 작업에서 쓰는 도구

| 도구 | 실행 환경 | 역할 |
|---|---|---|
| [package_current_pair.py](package_current_pair.py) | 일반 Python + Pillow + FFmpeg | Git의 실외 v3/실내 LHD v2 컷으로 현재 10초 두 편과 20초 합본 생성. `--output`, `--ffmpeg` 지원 |
| [revise_cabin_push.py](revise_cabin_push.py) | 검증된 Blender MCP | LHD v1에서 I01만 4cm 전진으로 수정, 새 로컬 리비전 저장 |
| [verify_cabin_push.py](verify_cabin_push.py) | Blender, 저장한 새 파일을 연 상태 | I01 전진·렌즈·방향 및 LHD/물체 정지 검증 |
| [verify_interior_lhd.py](verify_interior_lhd.py) | Blender | 차량 전방 기준 좌핸들, 카메라 움직임, 부품 정지 확인 |
| [render_camera_presets.py](render_camera_presets.py) | Blender 배경 렌더 | 열린 `.blend` 옆 manifest로 렌더. `--ids`, `--stills` 지원 |
| [package_cabin_push.py](package_cabin_push.py) | 일반 Python + Pillow + FFmpeg | 수정 I01과 기존 I02–I06을 묶어 LHD v2 생성 |
| [test_camera_treatments.cjs](test_camera_treatments.cjs) | Node.js | 패키지 폴더의 HTML/JSON 타임라인·seek·자동 다음 영상·마지막 정지 테스트 |
| [package.py](package.py) | 일반 Python + Pillow + FFmpeg | 초기 라이브러리 패키징 및 공용 `probe()` 전체 디코딩 검사 |

## 기존 장면을 만든 도구

| 단계 | 코드 | 주의점 |
|---|---|---|
| 컷 정의·모듈형 씬 | [shots.py](shots.py), [build.py](build.py) | 원본 시간·구도 정의. 초기 차체는 로컬 `.blend`에서 가져옴 |
| 실내/ASMR 카메라·사람 단순화 | [camera_motion.py](camera_motion.py), [simplify_people.py](simplify_people.py), [person_proxy.py](person_proxy.py) | 이전 동작 버전. 현재는 사람·조작 없는 camera-only가 기본 |
| 완전 스틸 파생본 | [freeze.py](freeze.py) | 중간 PNG로 영상 생성. 현재 카메라 이동 버전과 구분 |
| camera-only v1 | [build_camera_presets.py](build_camera_presets.py), [package_presets.py](package_presets.py) | 정차 상태·범용 실내·20초 조합. 새 빌더의 실내는 LHD |
| 카메라·전환 v2 | [refine_camera_presets.py](refine_camera_presets.py), [package_camera_treatments.py](package_camera_treatments.py) | 전환 시안과 클린 버전 분리 |
| 대상별 경로 v3 | [direct_camera_presets.py](direct_camera_presets.py) | 아크·휠 풀백·부위별 이동. 옛 I01 풀백은 최신 LHD v2로 대체 |
| 선택 컷 v4 | [revise_selected_cameras.py](revise_selected_cameras.py), [package_selected_cuts.py](package_selected_cuts.py) | B08/A02 수정 및 26초/20초/6초 분할 |
| 호흡·리빌 실험 v5/v6 | [build_rhythm_study.py](build_rhythm_study.py), [build_reveal_study.py](build_reveal_study.py), [package_rhythm_study.py](package_rhythm_study.py) | 가변 길이와 3개 카메라 효과를 실험한 보관 버전 |
| 옛 실내 좌핸들 변환 | [convert_interior_lhd.py](convert_interior_lhd.py), [package_interior_lhd.py](package_interior_lhd.py) | 옛 RHD 씬 대상. 이미 LHD인 씬에 재적용하지 않음 |

[assemble.py](assemble.py)는 초기 라이브러리의 `manifest.json`을 받습니다. 현재 `presets.json` 패키지에 그대로 적용하는 명령이 아닙니다. 현재 두 편은 `package_current_pair.py`를 사용하세요.

Blender 수정 도구는 `SOURCE`/`OUT` 경로가 고정된 경우가 많습니다. 실행 전 필요한 이전 씬, manifest, 출력 폴더를 확인하고 새 리비전을 사용합니다. 단순 재조합·문서 정리에는 Blender를 띄우지 않습니다. 새 장면 작업에는 [AGENTS.md](../../AGENTS.md)의 새 CLI 인스턴스/PID 검증 규칙을 따릅니다.
