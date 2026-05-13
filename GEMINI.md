# 🛠️ Chris AI Code-Forge: Project Instructions & Roadmap

## 1. Overview
이 프로젝트는 다중 에이전트 협업 체계를 시각화하고, 인수인계서 기반의 자동 워크플로우를 통해 고도화된 개발 업무를 수행하는 **지능형 에이전트 오케스트레이션** 시스템입니다.

## 2. Core Principles (핵심 원칙)
- **Absolute Path Standard**: 모든 파일 작업은 `C:\Users\ChrisHong`을 루트로 하는 절대 경로를 사용한다.
- **Handoff-Driven**: 에이전트 간의 모든 소통은 구조화된 '인수인계서' 및 '리포트'를 기반으로 한다.
- **Human-in-the-loop**: 계획 단계에서 Chris님의 피드백을 수렴하여 반복적으로 계획을 수정(Iterative Planning)한다.

## 3. 세션 분리 및 상호 견제 원칙 (Session Isolation Mandate)
- **교차 검증 필수**: 구현(Developer)과 검증(Reviewer/QA)은 반드시 **별도의 독립적인 에이전트 호출(Turn)**로 분리하여 수행한다. 동일 세션 내에서 개발과 검수를 동시에 수행하는 '일괄 처리'를 엄격히 금지한다.
- **물리적 증거 중심**: 검증 에이전트는 이전 에이전트의 설명을 신뢰하지 않고, 오직 수정된 파일의 코드와 실제 실행 결과(Test Output)만을 근거로 판단한다.
- **명시적 인수인계**: 세션 간 이동 시 반드시 `storage/projects/{ID}/handoffs/` 폴더 내에 마일스톤 문서를 생성하여 '팩트 기반'의 인수인계를 수행한다.

## 4. 무결성 보존 및 회귀 버그 방지 (Regression Prevention)
- **수정 전 백업**: 단일 파일 수정이라도 `backups/` 폴더 내에 타임스탬프 기반 백업 생성을 의무화한다.
- **사전 승인 프로세스**: 동작 방식의 변경이나 대규모 리팩토링은 반드시 Chris님의 컨펌 후 진행한다.

## 5. Future Roadmap: Multi-Mode Orchestration (향후 확장 계획)
업무의 성격에 따라 최적화된 에이전트 스쿼드를 가동하기 위해 다음과 같은 '모드 전환' 기능을 도입한다.

### A. Coding Mode (Current: Chris AI Code-Forge)
- **대상**: 소프트웨어 개발, 디버깅, 시스템 설계.
- **핵심 스쿼드**: PM, Technical Architect, Developer, Reviewer, QA, Debugger.
- **특징**: TDD 기반 구현 및 빌드/테스트 자동화에 집중.

### B. Biz Mode (Future: Chris AI Strategy-Forge)
- **대상**: 시장 리서치, 비즈니스 기획, 보고서 작성, 마케팅 전략.
- **핵심 스쿼드**: Strategist, Market Researcher, Analyst, Writer-Biz, Editor.
- **특징**: 데이터 분석, 정보 요약, 톤앤매너 중심의 문서화에 집중.

### C. Logic
- **Dynamic R&R**: Master 에이전트가 입력된 Task를 분류하여 해당 모드에 맞는 에이전트 정체성(System Prompt)과 도구셋(Tools)을 동적으로 로드한다.

---
*Last Updated: 2026-05-11*
