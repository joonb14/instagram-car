# 자동차 컷별 Blender 프리비즈

실제 차량 사진으로 영상을 생성하기 전에 **구도·카메라 이동·컷 순서**를 검토하는 3D 프리비즈 저장소입니다. Blender MCP로 단순 차량과 실내를 만들고, 각 컷을 독립 영상으로 렌더한 뒤 조합합니다. 실제 차종의 외형과 실내 디자인은 생성 단계에서 해당 차량 사진으로 지정합니다.

현재 기본 방향은 **주차된 차량 + 고정 휠·배경·실내 부품 + 카메라 이동만**입니다. 모든 현재 입력은 9:16, 1080×1920, 60fps, 무음입니다.

## 바로 사용할 현재 버전

| 자료 | 위치 |
|---|---|
| 현재 실외·실내 10초 묶음 | [사용 안내](presets/current-10s/README.md) · [로컬 플레이어](presets/current-10s/index.html) |
| 실외 10초 | [MP4](presets/current-10s/EXTERIOR/previs.mp4) · [프롬프트](presets/current-10s/EXTERIOR/prompt.txt) · [컷 순서](presets/current-10s/EXTERIOR/recipe.json) |
| 좌핸들 실내 10초 | [MP4](presets/current-10s/INTERIOR/previs.mp4) · [프롬프트](presets/current-10s/INTERIOR/prompt.txt) · [컷 순서](presets/current-10s/INTERIOR/recipe.json) |
| 두 편을 연결한 20초 검토본 | [MP4](presets/current-10s/REVIEW/combined-20s.mp4) |
| 전체 프리셋·이전 버전 | [프리셋 목록](presets/README.md) |
| 어떻게 만들었는지 | [제작 과정과 재조합·재렌더 안내](docs/previs-production.md) |
| 제작 코드 | [도구별 역할](tools/previs/README.md) |

실외는 **라이트 → 휠 → 뒤 사선 전체 → 상부 → 후면 전체**입니다. 비슷한 두 후면 구도 사이에 상부 컷을 넣었습니다. 실내는 **전체 → 핸들 → 콘솔 → 시트 → 조수석 대시보드**이며, 첫 컷은 뒤로 빠지는 대신 조금만 앞으로 들어갑니다. 이 수정본은 검토용으로 준비한 상태이며 사용자의 최종 시각 승인과 생성 결과는 별도입니다.

저장소를 클론하거나 전체 ZIP을 풀고 `presets/current-10s/index.html`을 브라우저에서 열면 됩니다. GitHub 파일 화면에서는 HTML 플레이어가 실행되지 않습니다. 개별 컷은 이웃한 버전 폴더를 상대 경로로 참조하므로 폴더 구조를 유지하세요. 완성 MP4는 단독으로 사용할 수 있습니다.

## 파일 구조

```text
presets/                     완성 프록시 MP4, 시작 PNG, 프롬프트, 컷 조합, 플레이어
  current-10s/               현재 실외 10초 / 실내 10초 / 검토용 20초
  interior-lhd-v2/           현재 좌핸들 실내 6개 독립 컷
  camera-only-20s-v3/        현재 실외 컷의 원본 라이브러리
docs/previs-production.md    제작 방식, 의존 파일, 실행 순서, 검증 기준
docs/modular-previs.md       기존 컷 라이브러리와 작업 방향 기록
tools/previs/               Blender 제작·렌더·패키징·검증 코드
skills/car-shot-previs/      유지보수하는 에이전트 스킬
.local/                     로컬 Blender 원본·렌더 PNG·레퍼런스·실행 기록 (Git 제외)
output/                     실제 차량 사진·생성 결과·차량별 전달 자료 (Git 제외)
```

## 재사용 원칙

- 컷 단위로 사진과 카메라 프롬프트를 맞춥니다. 실내가 보이는 문 열림 컷은 실내/외관 혼합 컷입니다.
- 범용 실내는 시트·대시보드·도어·빈 콘솔 덩어리입니다. 특정 차의 기어봉이나 도어 구조를 강제하지 않습니다. 현재는 부품 조작도 없습니다.
- 프록시 Start PNG는 구도 참고 자료입니다. 사진 기반 생성용 Start Frame은 실제 차량 사진으로 별도 준비합니다.
- 생성에는 클린 컷을 사용합니다. 디졸브 등 전환 실험은 이전 버전에 보존하고, 필요한 전환은 완성 영상 편집 단계에서 적용합니다.
- 직접 제작한 프록시 MP4와 레시피는 Git에 있습니다. 실제 차량 사진, 원본 레퍼런스 영상, 생성 영상, `.blend` 원본과 실행 영수증은 로컬에 있습니다.

Git 파일만으로 현재 영상을 재조합할 수 있습니다. **3D 장면을 처음부터 전부 다시 만드는 것은 별개**이며, 기존 제작 도구 일부가 로컬 `.blend` 원본에 의존합니다. 구체적인 재현 범위는 [제작 안내](docs/previs-production.md)에 적었습니다.

작업 규칙: [AGENTS.md](AGENTS.md) · [CLAUDE.md](CLAUDE.md) · [car-shot-previs 스킬](skills/car-shot-previs/SKILL.md). 새 Blender MCP 작업은 CLI로 새 인스턴스를 띄우고 실제 MCP 응답의 PID를 확인한 뒤 시작합니다. 이미 렌더된 컷을 조합하거나 문서를 수정할 때는 Blender 실행이 필요하지 않습니다.
