# Future Classic — Instagram Car

Future Classic의 자동차 이미지, Instagram Reels·캐러셀, YouTube Shorts 제작 스킬과 재사용 도구를 관리합니다.

## 포함한 스킬

| 스킬 | 역할 |
| --- | --- |
| future-classic-instagram | 복원 사례 큐레이션, 이미지·영상·본문·출처·전달 |
| future-classic-kling-prompts | 차량 고정 카메라 프롬프트 작성·검토 |
| future-classic-kling-operator | 실제 주체 연결, 생성 전 검수, 비용 기록, 결과 검토 |
| future-classic-before-after | 복원 전후 영상 구성 |
| future-classic-home-films | 공개 영상과 기존 사이트 게시글 연결 |
| future-classic-turbo-references | Porsche 사진 후보 수집 |
| future-classic-backgrounds | 배경 시안과 참고 자료 관리 |

## 반드시 지킬 제작 규칙

- 영상용 기반 이미지부터 **9:16**, 최종 Start Frame은 실제 **1080×1920 PNG**여야 합니다. 주체 등록용 참고 사진의 가로 비율을 영상용 이미지로 그대로 넘기지 않습니다.
- `source`나 `source crop`을 비율 승인으로 사용하지 않습니다. 공통 생성 비용 기록 도구는 실제 PNG 크기와 설정을 확인해 잘못된 요청을 차단합니다.
- 이미지 크기, 구도, 차량·타이어·엠블럼·휠·레터링·와이퍼·조명을 검수한 뒤 생성합니다. 검증 도구 통과가 시각 검수를 대신하지 않습니다.
- 주체는 실제 Kling 선택기로 연결합니다. 생성 요청, 재시도와 공개 업로드는 사용자의 해당 작업 승인을 따릅니다.
- `front half`라는 말만으로 정면·사선 구도를 임의로 바꾸지 않습니다. 선택한 실제 이미지와 카메라 구도를 먼저 확인합니다.

## 필수 5컷

차량별로 정면 front-half, 앞 사선 전체, 뒤 사선 전체, 엠블럼 확대, 휀더 또는 뒤쪽 디테일 확대가 필요합니다. 정면 front-half를 사선 사진 크롭으로 대체하지 않습니다. 두 차량을 다루면 각각의 필수 컷을 확인하고 함께 있는 컷은 추가 구성으로 사용합니다. 모든 영상 기반 이미지는9:16입니다.

## 실행과 설치

Node.js22 이상, 이미지 도구에는 Sharp가 필요합니다. 일부 Python 도구에는 Pillow와 NumPy, 영상 인코딩에는 별도 FFmpeg가 필요합니다.

```sh
npm ci
npm test
python -m pip install -r requirements.txt
node scripts/install-skills.mjs --list
node scripts/install-skills.mjs --check future-classic-instagram future-classic-kling-operator
node scripts/install-skills.mjs --install
```

설치 경로는 `$CODEX_HOME/skills`이며, 환경 변수가 없으면 `~/.codex/skills`입니다. 설치는 명시적인 `--install`에서만 실행됩니다. `--check`는 파일 차이를 확인하며 변경하지 않습니다.

앞으로 스킬 수정은 이 저장소를 기준으로 작성·검증·커밋한 뒤 설치 사본에 반영합니다. 다른 프로젝트나 설치된 사본에서 수정했다면 변경 내용을 이 저장소에 가져와 검증하고 커밋해야 백업이 완료됩니다. 자동 Git 동기화가 설정된 것은 아닙니다.

## 범위

사이트 게시글 수집·배포 도구인 `garage-forum-editorial`은 별도 프로젝트 의존성입니다. 이 저장소만으로 사이트 수집·배포 전체가 동작한다고 가정하지 않습니다. 참고용 성공 사례의 과거 로컬 경로는 기록이며 새 환경에서 존재를 보장하지 않습니다.

원본 차량 사진, 작업 중 생성물, 개인 실행 기록, 로그인 정보와 설치된 의존성은 이 저장소에 넣지 않습니다. 현재 사용 중인 스킬을 처음 가져온 내역은 `skill-import.json`에 기록했습니다.
