import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import time
from pathlib import Path
from typing import Callable

from config import settings
from tools import TOOL_DEFS

# TASK 모드: Zero-Trust 원칙 주입 (물리 증거 중심)
TASK_PREFIX = (
    "당신은 'Chris AI Code-Forge' 시스템의 전문 개발 에이전트입니다.\n"
    "### 🛡️ Zero-Trust 행동 수칙 ###\n"
    "1. 절대 메모리상의 설명이나 이전 대화만을 믿지 마십시오.\n"
    "2. 반드시 전달받은 '파일 경로'를 'read_file'로 읽어 물리적 증거를 직접 확인하십시오.\n"
    "3. 모든 작업 결과는 'write_file'을 통해 지정된 핸드오프 경로에 물리적으로 기록하십시오.\n"
    "4. '읽지 않은 파일은 검토한 것이 아니다'라는 원칙을 지키십시오.\n\n"
    "필요시 read_file, write_file, run_shell_command 도구를 사용하세요. "
    "결과는 한국어로 응답하세요.\n\n"
)


class BaseAgent:
    name: str = ""
    working_msg: str = "작업 중..."

    def __init__(self, engine, prompts_dir: str, broadcast: Callable):
        self.engine    = engine
        self.broadcast = broadcast
        self._start: float = 0
        raw = self._load_raw(prompts_dir)
        # 대화용: 원본 그대로 (맥락 유지)
        self.full_prompt = raw
        # 작업용: 간소화 접두어 추가
        self.system_prompt = TASK_PREFIX + raw

    def _load_raw(self, prompts_dir: str) -> str:
        path = Path(prompts_dir) / f"{self.name}.md"
        if path.exists():
            content = path.read_text(encoding="utf-8")
            # 동적 경로 플레이스홀더 치환 (배포 유연성 확보)
            content = content.replace("{{AI_SHARED_DIR}}", str(settings.AI_SHARED_DIR))
            content = content.replace("{{PROJECT_DIR}}", str(settings.BASE_DIR))
            return content
        return f"당신은 {self.name} 에이전트입니다."

    def _elapsed(self) -> int:
        return int((time.time() - self._start) * 1000) if self._start else 0

    async def emit(self, status: str, message: str = "", target: str = ""):
        await self.broadcast({
            "type": "agent_state",
            "agent": self.name,
            "status": status,
            "message": message,
            "target": target,
            "elapsed_ms": self._elapsed(),
        })

    async def run(self, task: str) -> str:
        self._start = time.time()
        await self.emit("working", self.working_msg)
        result = await self.engine.run_agent(
            self.system_prompt,
            [{"role": "user", "content": task}],
            TOOL_DEFS,
        )
        result = result or ""
        await self.emit("done", result[:120])
        return result
