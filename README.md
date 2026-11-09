# 자동차 씬별 Blender 프리비즈

원본 영상을 분석해 길·차·사람만 남기는 Blender MCP 프리비즈 작업 공간입니다.
실내가 보이는 컷과 외관만 보이는 컷을 분리하고, 씬별로 생성한 뒤 편집에서 합칩니다.
원본 카메라 구도와 동선을 보존하며 제작 영상은 9:16입니다.

기존 프로젝트 스킬 7개와 도구·의존성을 제거하고 로컬 Git을 새로 초기화했습니다.
기존 결과물은 artifacts/에 보존합니다. 원본·실행 기록·로컬 도구는 .local/에 두며 Git에서 제외합니다.

현재 원본 YouTube fvlAGwLelT8을 .local/references/fvlAGwLelT8/source.mp4로 다운로드했습니다.
현재 외관 하이라이트 10컷, 30.36초의 Blender 프리비즈 검토본을 제작했습니다. 전체 원본의 모든 외관 컷을 재현한 것은 아니며 실내 컷은 별도 작업입니다. 실제 확인한 절차를 새 스킬로 정리할 예정이고, 새 스킬은 아직 미제작입니다.
Higgsfield 플러그인 설치 요구사항: https://higgsfield.ai/blog/higgsfield-blender-plugin
원격 저장소: https://github.com/joonb14/instagram-car.git

작업 규칙은 [AGENTS.md](AGENTS.md), Claude용 진입 안내는 [CLAUDE.md](CLAUDE.md)에 있습니다. 새 Blender MCP 작업은 현재 세션에서 CLI로 새 Blender 인스턴스를 실행하고 실제 MCP 연결과 PID를 검증하는 것으로 시작합니다.

현재 따라 할 사례는 Higgsfield 글의 **Use Case 5 — The Car Commercial**입니다. Blender 프리비즈는 에이전트가 MCP로 제작하고 사용자가 구도·움직임을 검토합니다. 실내가 보이는 컷과 외관만 보이는 컷을 나누어 씬별로 생성한 뒤 합칩니다.

현재 로컬 검토본은 `.local/previs/exterior-30s-v003/`에 있습니다. `raised964-30s.mp4`는 돌출 원형 라이트·앞휀더, `flush-30s.mp4`는 평평한 라이트를 사용하는 버전입니다. 두 버전 모두 단순 프록시 차량이며 정확한 차종 모델이 아닙니다. 윙을 제거하고 바퀴 위치를 유지한 채 차체를 반원으로 파낸 휠 아치를 적용했습니다. 보닛 중앙은 낮고 평평하게 유지하며, 964형 돌출은 헤드라이트 주변 양쪽 짧은 부분에만 적용합니다. 사용자는 이 단순화 스타일을 선호한다고 밝혔지만, 새 30초 편집본의 구도·움직임 승인은 아직 별도입니다.

개별 씬의 원본 시간대·길이·Blender 씬 이름은 `manifest.json`, 영상 전체 디코딩·프레임 수·해시는 `verification.json`에 기록했습니다. 각 연결본은 540×960·25fps·759프레임·30.36초·무음입니다. 생성용 최종 입력이나 1080×1920 Start Frame으로 검수한 결과는 아닙니다. 원본 카메라·동선의 정확한 일치와 휠 움직임은 추가 검토가 필요합니다. 영상·Blend 파일과 개인 실행 기록은 Git에 포함하지 않습니다.
