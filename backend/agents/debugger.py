from .base_agent import BaseAgent


class DebuggerAgent(BaseAgent):
    name = "debugger"
    working_msg = "오류 원인 분석 중..."
