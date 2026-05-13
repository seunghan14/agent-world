import asyncio
import json
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

with open(ROOT / "config.json", encoding="utf-8") as f:
    config = json.load(f)

from engine import create_engine
from agents import MasterAgent, PlannerAgent, VisionaryAgent, RedTeamAgent, DeveloperAgent, ReviewerAgent, QAAgent, DebuggerAgent
from workflow import handle_message
from project_manager import project_manager

app = FastAPI()

FRONTEND = ROOT / "frontend"
app.mount("/game", StaticFiles(directory=str(FRONTEND / "game")), name="game")

@app.get("/")
def index():
    return FileResponse(str(FRONTEND / "index.html"))


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        msg = json.dumps(data, ensure_ascii=False)
        dead = []
        for ws in list(self.active):
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in self.active:
                self.active.remove(ws)


manager = ConnectionManager()

approval_event = asyncio.Event()
approval_data  = {"approved": False, "feedback": None}
chat_history: list = []
current_project_id: str = None

# ── 동시 워크플로우 방지 ──────────────────────────────────────────
_workflow_lock = asyncio.Lock()


def _make_agents():
    engine = create_engine(config)
    d = str((ROOT / config["agent_prompts_dir"]).resolve())
    b = manager.broadcast
    return {
        "master":    MasterAgent(engine, d, b),
        "planner":   PlannerAgent(engine, d, b),
        "visionary": VisionaryAgent(engine, d, b),
        "red-team":  RedTeamAgent(engine, d, b),
        "developer": DeveloperAgent(engine, d, b),
        "reviewer":  ReviewerAgent(engine, d, b),
        "qa":        QAAgent(engine, d, b),
        "debugger":  DebuggerAgent(engine, d, b),
    }


async def _run_workflow(message: str, agents: dict):
    """워크플로우를 lock으로 보호해 동시 실행 방지"""
    global current_project_id, chat_history
    
    # 프로젝트가 없으면 생성
    if not current_project_id:
        current_project_id = project_manager.create_project(message)
        chat_history = []

    async with _workflow_lock:
        await handle_message(
            message, agents,
            manager.broadcast,
            approval_event, approval_data,
            chat_history,
        )
        
        # 작업 종료 후 상태 저장
        state = project_manager.load_project(current_project_id)
        if state:
            state["chat_history"] = chat_history
            project_manager.save_project(current_project_id, state)
            # 리스트 갱신 브로드캐스트
            await manager.broadcast({
                "type": "project_list",
                "projects": project_manager.list_projects()
            })


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    global current_project_id, chat_history
    await manager.connect(ws)
    
    # 초기 로드 시 프로젝트 목록 전송
    await ws.send_text(json.dumps({
        "type": "status",
        "engine": config["engine"],
        "projects": project_manager.list_projects()
    }, ensure_ascii=False))

    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            if data["type"] == "chat":
                if _workflow_lock.locked():
                    await manager.broadcast({
                        "type": "chat", "from": "master",
                        "message": "⏳ 현재 작업이 진행 중입니다. 완료 후 새 요청을 받겠습니다.",
                    })
                else:
                    agents = _make_agents()
                    asyncio.create_task(_run_workflow(data["message"], agents))

            elif data["type"] == "load_project":
                pid = data.get("project_id")
                state = project_manager.load_project(pid)
                if state:
                    current_project_id = pid
                    chat_history = state.get("chat_history", [])
                    # 프론트엔드에 히스토리 전송
                    await ws.send_text(json.dumps({
                        "type": "project_loaded",
                        "project_id": pid,
                        "chat_history": chat_history
                    }, ensure_ascii=False))

            elif data["type"] == "new_project":
                current_project_id = None
                chat_history = []
                await ws.send_text(json.dumps({"type": "project_reset"}))

            elif data["type"] == "approval":
                approval_data["approved"] = data.get("approved", False)
                approval_data["feedback"] = data.get("feedback")
                approval_event.set()

            elif data["type"] == "delete_project":
                pid = data.get("project_id")
                if project_manager.delete_project(pid):
                    if current_project_id == pid:
                        current_project_id = None
                        chat_history = []
                        await ws.send_text(json.dumps({"type": "project_reset"}))
                    # 전체 클라이언트에 리스트 갱신 알림
                    await manager.broadcast({
                        "type": "project_list",
                        "projects": project_manager.list_projects()
                    })

            elif data["type"] == "get_agent_profile":
                name = data.get("agent")
                p = ROOT / config["agent_prompts_dir"] / f"{name}.md"
                content = ""
                if p.exists():
                    content = p.read_text(encoding="utf-8")
                await ws.send_text(json.dumps({
                    "type": "agent_profile",
                    "agent": name,
                    "profile": content
                }, ensure_ascii=False))

    except WebSocketDisconnect:
        manager.disconnect(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
