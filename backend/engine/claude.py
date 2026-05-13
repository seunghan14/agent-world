import asyncio
import sys
import os
import traceback
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from anthropic import AsyncAnthropic
from .base import AIEngine
from tools import execute_tool_sync


def _safe_messages(messages: list[dict]) -> list[dict]:
    """메시지 content를 string으로 안전하게 변환"""
    result = []
    for m in messages:
        content = m["content"]
        if not isinstance(content, str):
            content = str(content)
        result.append({"role": m["role"], "content": content})
    return result


class ClaudeEngine(AIEngine):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        self.client = AsyncAnthropic(api_key=api_key)
        self.model  = model

    async def chat(self, system_prompt: str, messages: list[dict]) -> str:
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system_prompt,
                messages=_safe_messages(messages),
            )
            for block in response.content:
                if hasattr(block, "text") and block.text:
                    return block.text
            return ""
        except Exception:
            traceback.print_exc()
            return ""

    async def run_agent(self, system_prompt: str, messages: list[dict], tools: list[dict]) -> str:
        claude_tools = [
            {
                "name": t["name"],
                "description": t["description"],
                "input_schema": {
                    "type": "object",
                    "properties": t["params"],
                    "required": t.get("required", []),
                },
            }
            for t in tools
        ]
        msgs = list(_safe_messages(messages))

        try:
            for _ in range(20):
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=system_prompt,
                    messages=msgs,
                    tools=claude_tools,
                )

                if response.stop_reason != "tool_use":
                    for block in response.content:
                        if hasattr(block, "text") and block.text:
                            return block.text
                    return ""

                msgs.append({"role": "assistant", "content": response.content})

                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = await asyncio.to_thread(
                            execute_tool_sync, block.name, block.input or {}
                        )
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        })

                msgs.append({"role": "user", "content": tool_results})

            return "[ERROR] max tool iterations reached"
        except Exception:
            traceback.print_exc()
            return ""

    @property
    def engine_name(self) -> str:
        return "claude"
