# Agent World — 프로젝트 계획서

## 프로젝트 개요

**목적**: 멀티에이전트 개발 워크플로우를 RPG 게임 UI로 시각화
**핵심 가치**: 에이전트가 지금 뭘 하는지 실시간 모니터링 + 병목 파악
**AI 엔진**: Claude / Gemini 교체 가능 구조

---

## 구현 범위

### 포함
- 7개 캐릭터 (Chris, Master, Planner, Developer, Reviewer, QA, Debugger)
- 탑뷰 2D 게임 맵 (에이전트별 구역)
- 실시간 캐릭터 이동 + 말풍선 대화
- 하단 Chris 입력창 (CLI 역할)
- Master → Chris 보고 화면
- Claude ↔ Gemini 엔진 전환 버튼
- 에이전트별 작업 소요시간 타이머 (병목 탐지)

### 제외 (v1)
- 스프라이트 애니메이션 (정적 아이콘으로 대체)
- 텔레그램 연동 (기존 telegram_notify.py 별도 활용)
- 저장/히스토리 기능

---

## 에이전트 구성

| 캐릭터 | 역할 | 맵 위치 | 시스템 프롬프트 출처 |
|---|---|---|---|
| Chris | 유저 입력 | 화면 상단 고정 | — |
| Master | 오케스트레이터 | 중앙 | master.md |
| Planner | 계획 수립 | 좌상단 기획실 | planner.md |
| Developer | 코드 구현 | 우상단 개발실 | developer.md |
| Reviewer | 정적 검토 | 우하단 검토실 | reviewer.md |
| QA | 실행 테스트 | 좌하단 테스트실 | qa.md |
| Debugger | 오류 분석 | 하단 중앙 비상구 | debugger.md |

---

## 워크플로우 (개발 작업 기준)

```
Chris 입력
  → Master 수신 및 분류
  → Planner (계획 수립)
  → Master가 Chris에게 보고 → 승인 대기
  → Developer (TDD 구현)
  → Reviewer (L1~L4 검토)
    ├─ FAIL → Developer 재작업 (최대 3회)
    └─ PASS
  → QA (블랙박스 실행)
    ├─ FAIL → Debugger 투입
    └─ PASS
  → Master가 Chris에게 최종 보고
```

---

## 구현 단계

| Phase | 내용 | 산출물 |
|---|---|---|
| 1 | AI 엔진 추상화 레이어 | `backend/engine/` |
| 2 | 에이전트 상태 머신 + LangGraph | `backend/agents/`, `backend/graph.py` |
| 3 | FastAPI + WebSocket 서버 | `backend/main.py` |
| 4 | Phaser.js 게임 UI | `frontend/` |
| 5 | 통합 테스트 | — |

---

## 수락 기준 (AC)

- [ ] Claude 엔진으로 개발 작업 요청 시 에이전트들이 게임 맵에서 이동하며 작업 수행
- [ ] Gemini 엔진으로 전환 후 동일 작업 시 동일하게 동작
- [ ] 에이전트 간 핸드오프 시 말풍선 대화가 화면에 표시됨
- [ ] Master가 Chris 입력창으로 최종 보고 메시지 전송
- [ ] 각 에이전트 타이머가 작업 시작~종료 시간을 표시
- [ ] Developer → Reviewer FAIL 시 캐릭터가 다시 Developer에게 걸어감
