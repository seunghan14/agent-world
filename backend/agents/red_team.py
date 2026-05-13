from .base_agent import BaseAgent

class RedTeamAgent(BaseAgent):
    name = "red-team"
    working_msg = "잠재적 리스크 감점 및 취약점 공격 중..."
