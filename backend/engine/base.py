from abc import ABC, abstractmethod


class AIEngine(ABC):
    @abstractmethod
    async def chat(self, system_prompt: str, messages: list[dict]) -> str:
        pass

    async def run_agent(self, system_prompt: str, messages: list[dict], tools: list[dict]) -> str:
        """Agentic loop with tool calling. Subclasses override for native tool support."""
        return await self.chat(system_prompt, messages)

    @property
    @abstractmethod
    def engine_name(self) -> str:
        pass
