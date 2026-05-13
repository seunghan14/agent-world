# Agent World — 기술 사양서

## 시스템 아키텍처

```
[Browser: Phaser.js]
       ↕ WebSocket
[FastAPI Server: main.py]
       ↕
[LangGraph: graph.py]  →  [AgentState 브로드캐스트]
       ↕
[AI Engine Layer]
  ├── ClaudeEngine (claude-sonnet-4-6)
  └── GeminiEngine (gemini-2.5-pro)
       ↕
[Agent System Prompts: ~/.gemini/agents/*.md]
```

---

## 폴더 구조

```
agent-world/
├── docs/
│   ├── PLAN.md
│   └── SPEC.md
├── backend/
│   ├── main.py               # FastAPI + WebSocket 서버
│   ├── graph.py              # LangGraph 워크플로우
│   ├── engine/
│   │   ├── __init__.py
│   │   ├── base.py           # AIEngine 추상 클래스
│   │   ├── claude.py         # Claude API 구현
│   │   └── gemini.py         # Gemini API 구현
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base_agent.py     # BaseAgent 추상 클래스
│   │   ├── master.py
│   │   ├── planner.py
│   │   ├── developer.py
│   │   ├── reviewer.py
│   │   ├── qa.py
│   │   └── debugger.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   └── game/
│       ├── main.js           # Phaser 초기화
│       ├── WorldScene.js     # 맵 + 캐릭터 관리
│       ├── Agent.js          # 캐릭터 클래스
│       ├── DialogBubble.js   # 말풍선
│       ├── ChatBox.js        # Chris 입력창
│       └── TimerPanel.js     # 병목 타이머
└── config.json               # 엔진 선택, API 키 경로 등
```

---

## 데이터 구조

### AgentState (WebSocket 메시지 포맷)
```json
{
  "type": "agent_state",
  "agent": "developer",
  "status": "communicating",
  "message": "구현 완료. 검토 요청드립니다.",
  "target": "reviewer",
  "timestamp": 1234567890,
  "elapsed_ms": 12400
}
```

### 에이전트 상태값
| status | 의미 | 게임 표현 |
|---|---|---|
| `idle` | 대기 중 | 제자리 대기 |
| `working` | 작업 중 | 작업 이펙트 (깜빡임) |
| `communicating` | 다른 에이전트에게 전달 | target 위치로 이동 + 말풍선 |
| `waiting_approval` | Chris 승인 대기 | Chris 위치로 이동 + 말풍선 |
| `done` | 완료 | Master 위치로 이동 + 보고 |
| `error` | 오류 발생 | 빨간 이펙트 |

### ChatMessage (Chris 입출력)
```json
{
  "type": "chat",
  "from": "chris | master",
  "message": "로그인 기능 만들어줘",
  "timestamp": 1234567890
}
```

### EngineConfig (config.json)
```json
{
  "engine": "claude",
  "claude": {
    "model": "claude-sonnet-4-6",
    "api_key_env": "ANTHROPIC_API_KEY"
  },
  "gemini": {
    "model": "gemini-2.5-pro",
    "api_key_env": "GEMINI_API_KEY"
  },
  "agent_prompts_dir": "C:/Users/홍승한/.gemini/agents/"
}
```

---

## 백엔드 상세 사양

### AIEngine 추상 클래스 (base.py)
```python
class AIEngine(ABC):
    @abstractmethod
    async def chat(self, system_prompt: str, messages: list[dict]) -> str:
        """단일 응답 반환"""

    @abstractmethod
    async def stream(self, system_prompt: str, messages: list[dict]) -> AsyncGenerator[str, None]:
        """스트리밍 응답"""

    @property
    @abstractmethod
    def engine_name(self) -> str:
        """'claude' or 'gemini'"""
```

### BaseAgent (base_agent.py)
```python
class BaseAgent(ABC):
    name: str
    location: tuple[int, int]   # 게임 맵 좌표
    engine: AIEngine
    system_prompt: str          # .md 파일에서 로드
    broadcast: Callable         # WebSocket 브로드캐스트 함수

    async def run(self, task: str) -> AgentResult:
        await self.set_status("working")
        result = await self.engine.chat(self.system_prompt, [...])
        await self.set_status("done")
        return result

    async def set_status(self, status: str, message: str = "", target: str = ""):
        # WebSocket으로 상태 브로드캐스트
        await self.broadcast(AgentState(
            agent=self.name,
            status=status,
            message=message,
            target=target,
            timestamp=now(),
            elapsed_ms=self.elapsed()
        ))
```

### LangGraph 워크플로우 (graph.py)
```
노드: master_node, planner_node, developer_node,
      reviewer_node, qa_node, debugger_node

엣지:
  master → planner
  planner → master (승인 요청)
  master → developer (승인 후)
  developer → reviewer
  reviewer → developer (FAIL, iteration < 3)
  reviewer → qa (PASS)
  qa → debugger (FAIL)
  qa → master (PASS)
  debugger → developer
  master → END
```

### FastAPI 엔드포인트 (main.py)
```
GET  /              → index.html 서빙
WS   /ws            → WebSocket 연결 (게임 ↔ 서버)
POST /engine        → 엔진 전환 { "engine": "claude" | "gemini" }
GET  /status        → 현재 엔진 + 에이전트 상태
```

---

## 프론트엔드 상세 사양

### 게임 맵 좌표 (800x600 캔버스 기준)
```
Chris:     (400, 40)   — 상단 중앙 고정
Master:    (400, 300)  — 중앙
Planner:   (160, 180)  — 좌상단
Developer: (640, 180)  — 우상단
Reviewer:  (640, 420)  — 우하단
QA:        (160, 420)  — 좌하단
Debugger:  (400, 520)  — 하단 중앙
```

### 캐릭터 이동 로직 (Agent.js)
```javascript
moveTo(targetX, targetY, onArrival) {
  // Phaser tweens으로 이동
  // 도착 시 onArrival 콜백 → 말풍선 표시
}
```

### 말풍선 (DialogBubble.js)
- 표시 후 3초 유지
- 메시지 길이에 따라 자동 크기 조정
- 에이전트 캐릭터 위에 표시

### Chris 입력창 (ChatBox.js)
- 화면 하단 고정
- Enter 키 또는 전송 버튼
- Master 보고 메시지는 입력창 위 말풍선 형태로 표시

### 타이머 패널 (TimerPanel.js)
- 우측 상단 오버레이
- 에이전트별 현재 작업 소요시간 실시간 표시
- 30초 초과 시 빨간색 강조 (병목 경고)

---

## 의존성

### backend/requirements.txt
```
fastapi
uvicorn[standard]
anthropic
google-generativeai
langgraph
langchain-core
websockets
python-dotenv
```

### frontend (CDN)
```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
```

---

## 환경 변수 (.env)
```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...
```
