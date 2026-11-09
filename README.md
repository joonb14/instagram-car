# 자동차 씬별 Blender 프리비즈

원본 영상을 분석해 길·차·사람만 남기는 Blender MCP 프리비즈 작업 공간입니다.
실내가 보이는 컷과 외관만 보이는 컷을 분리하고, 씬별로 생성한 뒤 편집에서 합칩니다.
원본 카메라 구도와 동선을 보존하며 제작 영상은 9:16입니다.

기존 프로젝트 스킬 7개와 도구·의존성을 제거하고 로컬 Git을 새로 초기화했습니다.
기존 결과물은 artifacts/에 보존합니다. 원본·실행 기록·로컬 도구는 .local/에 두며 Git에서 제외합니다.

현재 원본 YouTube fvlAGwLelT8을 .local/references/fvlAGwLelT8/source.mp4로 다운로드했습니다.
Blender 프리비즈와 새 스킬은 아직 제작 전입니다. 실제 확인한 절차를 새 스킬로 정리합니다.
Higgsfield 플러그인 설치 요구사항: https://higgsfield.ai/blog/higgsfield-blender-plugin
원격 저장소: https://github.com/joonb14/instagram-car.git

작업 규칙은 [AGENTS.md](AGENTS.md), Claude용 진입 안내는 [CLAUDE.md](CLAUDE.md)에 있습니다. 새 Blender MCP 작업은 현재 세션에서 CLI로 새 Blender 인스턴스를 실행하고 실제 MCP 연결과 PID를 검증하는 것으로 시작합니다.

현재 따라 할 사례는 Higgsfield 글의 **Use Case 5 — The Car Commercial**입니다. Blender 프리비즈는 에이전트가 MCP로 제작하고 사용자가 구도·움직임을 검토합니다. 실내가 보이는 컷과 외관만 보이는 컷을 나누어 씬별로 생성한 뒤 합칩니다.
