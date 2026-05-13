from .base_agent import BaseAgent


class ReviewerAgent(BaseAgent):
    name = "reviewer"
    working_msg = "L1~L4 코드 검토 중..."

    def is_passed(self, result: str) -> bool:
        upper = (result or "").upper()
        return "PASS" in upper and "FAIL" not in upper
