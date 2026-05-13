# Agent World

멀티 에이전트 AI 시각화 시스템. Claude / Gemini를 엔진으로 사용하는 CLI wrapper로, 6개의 AI 에이전트가 아바타 세계에서 실제로 걸어다니며 협업하는 모습을 시각화합니다.

![Agent World](docs/preview.png)

---

## 개요

사용자가 개발 작업을 요청하면 Master 에이전트가 팀을 지휘해 자동으로 완수합니다.

```
사용자 → Master → Planner → Developer → Reviewer → QA → Debugger
```

각 에이전트는 실제 도구(`read_file`, `write_file`, `run_shell_command`)를 사용해 Claude Code CLI와 동일한 수준으로 작업합니다.

---

## 에이전트 역할

| 에이전트 | 역할 |
|---|---|
| 👑 Master | 오케스트레이터. 사용자와 대화, 팀 지휘 |
| 📋 Planner | 수락 기준(AC) 정의 및 3단계 구현 계획 수립 |
| 💻 Developer | TDD 기반 실제 코드 작성 및 파일 저장 |
| 🔍 Reviewer | L1~L4 정적 코드 검토 (PASS/FAIL 판정) |
| ✅ QA | 블랙박스 실행 테스트 (PASS/FAIL 판정) |
| 🔧 Debugger | QA 실패 시 원인 분석 및 수정 방안 제시 |

---

## 요구사항

- Python 3.10+
- Anthropic API 키 또는 Google Gemini API 키 (둘 중 하나 이상)

---

## 설치

```bash
# 1. 저장소 클론
git clone https://github.com/seunghan14/agent-world.git
cd agent-world

# 2. 의존성 설치
pip install -r backend/requirements.txt

# 3. 환경변수 설정
cp .env.example .env
# .env 파일을 열어 API 키 입력
```

**.env 파일 예시:**
```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

---

## 실행

```bash
cd backend
python main.py
```

브라우저에서 `http://localhost:8000` 접속

---

## 사용법

1. **엔진 선택** — 좌상단 `Claude` / `Gemini` 버튼으로 전환
2. **작업 요청** — 하단 채팅창에 입력 (예: `테트리스 게임 만들어줘`)
3. **계획 승인** — Planner가 계획서를 제출하면 승인/취소 선택
4. **진행 확인** — 우측 Agent Communications 패널에서 에이전트 간 대화 확인
5. **에이전트 클릭** — 각 에이전트 카드를 클릭하면 상세 활동 내역 조회

---

## 프로젝트 구조

```
agent-world/
├── agents/                  # 에이전트 시스템 프롬프트
│   ├── master.md
│   ├── planner.md
│   ├── developer.md
│   ├── reviewer.md
│   ├── qa.md
│   └── debugger.md
├── backend/
│   ├── main.py              # FastAPI 서버 + WebSocket
│   ├── workflow.py          # 에이전트 워크플로우 오케스트레이션
│   ├── tools.py             # read_file / write_file / run_shell_command
│   ├── agents/              # 에이전트 클래스
│   └── engine/              # Claude / Gemini 엔진 어댑터
├── frontend/
│   └── game/                # Phaser 3 기반 아바타 세계 시각화
├── config.json              # 엔진 설정
├── .env.example             # 환경변수 템플릿
└── requirements.txt
```

---

## 설정 (`config.json`)

```json
{
  "engine": "gemini",        // 기본 엔진: "claude" 또는 "gemini"
  "claude": {
    "model": "claude-sonnet-4-6",
    "api_key_env": "ANTHROPIC_API_KEY"
  },
  "gemini": {
    "model": "gemini-2.5-pro",
    "api_key_env": "GEMINI_API_KEY"
  },
  "agent_prompts_dir": "./agents"
}
```

---

## 에이전트 프롬프트 커스터마이징

`agents/` 폴더의 `.md` 파일을 수정해 각 에이전트의 성격과 동작 방식을 변경할 수 있습니다.

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 백엔드 | FastAPI, WebSocket, Python asyncio |
| AI 엔진 | Anthropic Claude API, Google Gemini API |
| 프론트엔드 | Phaser 3, Vanilla JS |
| 시각화 | 아바타 세계 (top-down, 실시간 에이전트 이동) |
