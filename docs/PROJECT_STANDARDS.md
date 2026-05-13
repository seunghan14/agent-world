# 📁 Chris AI Code-Forge: Project Structure Standards

Chris AI Code-Forge에서 새로운 프로젝트를 생성하면, 내부적으로 다음과 같은 표준 파일들이 자동으로 정의되거나 관리됩니다. 이는 Gemini CLI의 작업 수준을 유지하기 위한 필수 구성 요소입니다.

## 1. Core Project Files (자동 관리 파일)

| 파일명 | 용도 | 설명 |
| :--- | :--- | :--- |
| **`CONTEXT.md`** | 프로젝트 맥락 | 현재 작업의 목적, 범위, 제약 사항 및 기술 스택이 기술됩니다. |
| **`PLAN.md`** | 기술 설계도 | Planner/Visionary/Red-Team의 티키타가를 거쳐 확정된 '합의안'입니다. |
| **`TDD_CHECKLIST.md`** | 검증 리스트 | Developer와 QA가 공유하는 테스트 케이스 및 수락 기준(AC)입니다. |
| **`STATE.json`** | 세션 데이터 | 프로젝트의 대화 이력, 현재 위치, 작업 진행 상태를 담은 영구 보존 파일입니다. |

## 2. Dynamic Artifacts (작업 산출물)

에이전트들이 협업하면서 다음과 같은 파일들을 `storage/projects/{ID}/` 폴더 내에 생성합니다.

- **`handoffs/*.md`**: 에이전트 간 세션 이동 시 생성되는 상세 인수인계 리포트.
- **`src/**`**: Developer가 실제로 작성한 코드 파일들.
- **`tests/**`**: 코드 검증을 위해 생성된 자동화 테스트 스크립트.
- **`logs/`**: 에이전트 세션 로그 및 실행 로그.

## 3. Project Creation & Execution Flow (Action-First)
1. **Init**: Chris님이 새 작업을 요청하면 즉시 `storage/projects/{ID}/` 폴더 생성 및 `CONTEXT.md` 작성.
2. **Design**: 브레인 팀(Planner, Visionary, Red-Team)의 3회 티키타가 토론 후 `PLAN.md` 확정.
3. **Build**: Developer가 코드를 작성하고, Reviewer와 QA가 **공격적 검토(Adversarial Mode)**를 통해 품질 보증.
4. **Action**: 에이전트는 설명보다 **직접적인 도구 실행(write_file, .bat 생성 등)**을 통해 물리적 결과를 도출.
5. **Sync**: 모든 작업 단계에서 발생하는 변경 사항은 `PLAN.md`에 실시간으로 동기화(Living Document).

---
*Last Updated: 2026-05-11*
