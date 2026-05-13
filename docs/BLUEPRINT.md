# 🛠️ Chris AI Code-Forge: System Blueprint

## 1. Vision & Purpose (비전 및 목적)
Chris AI Code-Forge(CCF)는 단순한 AI 채팅 인터페이스를 넘어, 8인의 전문 AI 에이전트가 협업하여 고도화된 소프트웨어 엔지니어링 산출물을 만들어내는 **'지능형 자율 대장간'**입니다. Chris님의 로컬 환경과 밀착 연동되어 실질적인 개발 성과를 내는 것을 최우선 목표로 합니다.

## 2. Core Architecture (시스템 아키텍처 v2.0)

### A. Engine Layer (Gemini Enterprise OAuth + Resilience)
- **Enterprise Security**: `google-auth` 기반 사내 OAuth 인증 및 Discovery Engine API 연동.
- **401 Auto-Recovery**: 인증 만료(401) 시 자동으로 토큰을 갱신하고 작업을 재시도하는 회복력 확보.
- **Action-First Protocol**: 가이드 제공보다 도구(Tools)를 통한 직접적인 결과물 생성을 우선시함.
- **Isolated Sessions**: 턴 기반 독립 컨텍스트 및 `logs/sessions/` 물리 로그 생성.

### B. Workflow Layer (Adversarial Tiki-Taka)
- **Living Document (PLAN.md)**: 설계도를 고정된 유물이 아닌, 프로젝트 전 과정에서 실시간 업데이트되는 최상위 가이드로 관리.
- **Adversarial QA/Review**: "잘 돌아간다"가 아닌 "망가뜨리려 노력하는" 공격적 품질 검증 체계.
- **Self-Healing Loop**: Debugger(SRE)의 RCA(근본원인분석) 기반 자동 수정 프로세스.

### C. GUI Layer (Command Center Studio)
- **Unified Command Center**: 하단 채팅바를 제거하고 우측 사이드바에 채팅과 로그를 고해상도로 통합.
- **Avatar Identity 2.0**: 아바타별 고유 복장(후드, 정장 등) 및 기능형 LED 상태바 적용.
- **Office Dynamics**: 업무 전달 후 4초 뒤 자동 복귀(Return Home) 및 구역별 가이드라인 배치.

## 3. The 8-Agent Coding Squad
1. **👑 Master (PM)**: 전체 지휘, 의사결정 중재, 최종 보고.
2. **📋 Planner (Architect)**: 기술 설계, DB/API 설계, 구조 확립.
3. **💡 Visionary (Innovation)**: 아이디어 고도화, 신기술 제안, UX 개선.
4. **🛡️ Red-Team (Risk Audit)**: 보안 감사, 논리적 취약점 공격, 현실성 검토.
5. **💻 Developer (Engineer)**: TDD 기반 코드 구현, 문서화.
6. **🔍 Reviewer (Code Review)**: 코드 품질 검토, 규칙 준수 여부 판정 (L1~L4).
7. **✅ QA (Test Engineer)**: 실제 환경 테스트, AC 충족 여부 검증.
8. **🔧 Debugger (SRE)**: 오류 근본 원인 분석, 수정 가이드 작성.

## 4. Implementation Standards (구현 표준)
- **Path Standard**: `C:\Users\ChrisHong` 기준의 절대 경로 강제.
- **TDD First**: 모든 구현 전 테스트 케이스 정의 필수.
- **Handoff Documentation**: 모든 세션 이동 시 '인수인계서' 기반 데이터 전달.
