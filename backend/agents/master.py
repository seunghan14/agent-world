from .base_agent import BaseAgent


class MasterAgent(BaseAgent):
    name = "master"

    async def run(self, task: str) -> str:
        self._start = __import__("time").time()
        await self.emit("working", f"작업 접수: {task[:50]}...")
        result = await self.engine.chat(
            self.system_prompt,
            [{"role": "user", "content": f"다음 개발 작업을 팀에게 지시하겠습니다. 간결하게 지시 내용을 정리해주세요: {task}"}],
        )
        result = result or ""
        await self.emit("done", result[:120])
        return result

    async def final_report(self, summary: str) -> str:
        self._start = __import__("time").time()
        await self.emit("working", "최종 보고 준비 중...")
        result = await self.engine.chat(
            self.system_prompt,
            [{"role": "user", "content": f"작업이 완료되었습니다. Chris에게 완료 보고를 작성해주세요: {summary}"}],
        )
        result = result or ""
        await self.emit("done", result[:120])
        return result
