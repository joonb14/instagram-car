# Future Classic 스킬·도구 관리

Git의 원본은 `skills/`, 실행 도구의 원본은 `scripts/instagram/`과 `scripts/home-films/`입니다. 개인 Codex 폴더는 이 원본에서 설치합니다. 개인 폴더에서만 수정한 내용을 방치하거나, 저장소 도구가 개인 폴더의 코드를 다시 불러오는 구조를 만들지 않습니다.

다른 계정·PC에서는 [이어하기 안내](account-handoff.md)를 먼저 읽습니다. 웹 프로젝트는 `joonb14/diy-cars`, 검수된 제작 스킬 배포 사본은 `joonb14/instagram-car`에 둡니다. Git에 올린 뒤 실제 원격 커밋을 확인해야 백업 완료로 기록합니다. 계정 연결 도구의 검색에 저장소가 없더라도 Git remote와 소유자가 준 실제 저장소 주소를 먼저 확인하며, 계정 연결 여부와 프로젝트 remote 설정을 구분합니다.

## 작업에 따른 진입점

| 작업 | 저장소 스킬 |
| --- | --- |
| 완성차 이미지·릴스·쇼츠, 캡션, Drive 전달·정리 | [future-classic-instagram](../../skills/future-classic-instagram/SKILL.md) |
| 복원 전후 비교와 상태별 주체 | [future-classic-before-after](../../skills/future-classic-before-after/SKILL.md) |
| 주차된 차량의 카메라 이동 프롬프트 | [future-classic-kling-prompts](../../skills/future-classic-kling-prompts/SKILL.md) |
| 허가받은 Kling 제출·5분 간격 확인·결과 검수 | [future-classic-kling-operator](../../skills/future-classic-kling-operator/SKILL.md) |
| 배경 시안과 재사용 배경 | [future-classic-backgrounds](../../skills/future-classic-backgrounds/SKILL.md) |
| 실제 공개 영상과 같은 차량의 홈 카드 연결 | [future-classic-home-films](../../skills/future-classic-home-films/SKILL.md) |
| Porsche 사진 레퍼런스 수집 | [future-classic-turbo-references](../../skills/future-classic-turbo-references/SKILL.md) |

원문 수집·사이트 글 준비는 [diy-cars의 garage-forum-editorial](https://github.com/joonb14/diy-cars/blob/main/skills/garage-forum-editorial/SKILL.md) 의존성이 필요합니다. 해당 저장소의 안내와 `scripts/forum-editorial/install-skill.mjs`를 사용합니다. 이 배포 사본에는 그 사이트 수집 도구가 포함되지 않습니다. 이 관리 도구가 수집 설정·잠금·자동화나 게시 상태를 변경하지는 않습니다.

## 수정과 설치

Node 24 이상과 프로젝트 의존성을 준비한 뒤 저장소 루트에서 실행합니다. 이미지/영상 도구는 작업에 따라 기존 FFmpeg, Pillow·NumPy 런타임을 별도로 사용하며 설치 도구가 이를 내려받지 않습니다.

실제 인코딩 테스트는 `FFMPEG` 환경 변수의 실행 파일 또는 PATH의 `ffmpeg`를 사용합니다. 둘 다 없으면 인코딩 두 건은 건너뛴 것으로 표시되며, 이를 인코딩 검증 통과로 보고하지 않습니다. 이전 작업 폴더의 Windows 바이너리 경로를 새 환경에 강제하지 않습니다.

```text
npm run skills:check
npm run skills:test
npm run skills:install
npm run skills:check -- --installed
```

처음 설치할 때는 `skills:install`을 사용합니다. 설치본이 이미 있으면 먼저 원본과 변경 내용을 확인한 후 `npm run skills:install -- --update`로 갱신합니다. 이 명령은 카탈로그에 있는 스킬의 관리 파일만 갱신하고 관련 없는 개인 파일은 삭제하지 않습니다. 런타임·비밀 파일·캐시는 묶지 않습니다. `CODEX_HOME`이 있으면 그 아래 `skills/`, 없으면 사용자 홈의 `.codex/skills/`를 사용합니다.

다른 위치에서 먼저 확인하거나 특정 스킬만 갱신할 수 있습니다.

```text
node scripts/skills/manage.mjs install --target-root "temporary skills"
node scripts/skills/manage.mjs check --installed --target-root "temporary skills"
npm run skills:install -- --only future-classic-kling-prompts --update
```

`scripts/skills/catalog.json`이 설치 대상과 도구 묶음을 정의합니다. `scripts/instagram/` 도구는 버전 관리하는 단일 원본이고, 필요한 개인 스킬의 `scripts/`에는 설치할 때 같은 파일을 복사합니다. 저장소에서 실행할 때는 `node scripts/instagram/<도구>.mjs`를 사용합니다. 설치본의 `scripts/<도구>.mjs` 표기는 생성된 묶음의 경로입니다. `check --installed`는 각 관리 파일의 실제 SHA-256으로 누락과 변경을 확인합니다.

## Git에 남기는 것

- `AGENTS.md`: 작업별 진입점, 원본/설치본 관계, 권한 경계.
- `skills/`: 재사용 지침·참조 문서, 필요한 소규모 구도 자산, 성공 프롬프트와 사실에 근거한 한계.
- `scripts/`: 도구 구현·테스트·설치 카탈로그. 도구의 동작을 수정하면 관련 테스트와 스킬 설명도 맞춥니다.
- `docs/social/`: 현재 사용법과 구현 경계. 성공 사례의 미디어 경로는 저장소 기준 상대 경로이며, 해당 영상이 Git에 포함됐다는 뜻은 아닙니다.

`artifacts/`, `.local/`, 다운로드 첨부, 설치된 의존성·런타임·캐시, 인증 정보는 커밋하지 않습니다. 원본 사진과 영상·Drive ID·게시 영수증 등 실제 실행 기록은 기존 비공개 작업 저장소에 유지합니다. 구도 예시로 채택한 작은 참조 자산은 일반 작업 결과물과 구분합니다.

## 전달과 정리

현재 검수된 최종본은 Drive의 `01 Ready to Upload` 바로 아래 날짜·차량명·버전 폴더에 둡니다. 생성 입력·주체 참조·개별 영상·검수 자료는 `02 Review`에 보관합니다. 기존 ID로 이동하고 현재 위치를 확인한 뒤, 영수증과 이전 작업 폴더의 안내 링크도 갱신합니다. 두 플랫폼의 게시 상태와 음악 상태는 별도로 기록하며 실제 확인 전에는 `03 Published`로 옮기지 않습니다.

중간 파일 정리는 [전달·정리 절차](../../skills/future-classic-instagram/references/drive-delivery.md)를 따릅니다. 결과물·원본·성공 프롬프트를 먼저 보호하고, 재생성 가능한 검수 프레임 등만 정해진 범위에서 복구 가능한 방식으로 처리합니다. Git 준비가 기존 작업 파일의 삭제나 유료 영상 생성·SNS 게시 권한을 추가하지 않습니다.

공개된 Shorts 링크를 받아 대문·복원기에 연결하는 작업은 [home-films 공개 링크 절차](../../skills/future-classic-home-films/references/published-link.md)를 사용합니다. 정확한 원문 차량 매칭, 실제 첫 섹션 ID, 보호된 원문 사진, 운영 버전 보존과 한영 실제 재생 검증을 포함하며, 사이트 연결과 플랫폼별 게시 기록을 구분합니다.
