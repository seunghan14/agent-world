from .base_agent import BaseAgent


class QAAgent(BaseAgent):
    name = "qa"
    working_msg = "블랙박스 실행 테스트 중..."

    def is_passed(self, result: str) -> bool:
        upper = (result or "").upper()
        return "PASS" in upper and "FAIL" not in upper
