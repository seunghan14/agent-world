import os
import json
import requests
import time
import traceback
import asyncio
import sys
from pathlib import Path

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from .base import AIEngine
from tools import execute_tool_sync
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Constants from Master Constitution
PROJECT_ID = "prd-ai-prj"
LOCATION = "global"
ENGINE_ID = "prd-agsp-engine-01_1745833724131"
SCOPES = ['https://www.googleapis.com/auth/cloud-platform']
URL = f"https://discoveryengine.googleapis.com/v1alpha/projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/engines/{ENGINE_ID}/assistants/default_assistant:streamAssist"

# Common token file
TOKEN_FILE = r"C:\Users\ChrisHong\.gemini\oauth_creds.json"
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

class GeminiEngine(AIEngine):
    def __init__(self, api_key: str, model: str = "gemini-2.5-pro"):
        self.model_name = model
        self.creds = self._get_credentials()

    def _get_credentials(self):
        if not os.path.exists(TOKEN_FILE): return None
        try:
            with open(TOKEN_FILE, 'r') as f: token_data = json.load(f)
            if 'access_token' in token_data and 'token' not in token_data: token_data['token'] = token_data['access_token']
            token_data['client_id'] = CLIENT_ID
            token_data['client_secret'] = CLIENT_SECRET
            return Credentials.from_authorized_user_info(token_data, SCOPES)
        except: return None

    def _refresh_creds(self):
        if self.creds and self.creds.expired:
            try: self.creds.refresh(Request())
            except: pass

    def _call_api(self, prompt: str, retry_count=0) -> str:
        if not self.creds: return "[ERROR] No valid credentials."
        self._refresh_creds()
        headers = {"Authorization": f"Bearer {self.creds.token}", "Content-Type": "application/json", "x-goog-user-project": PROJECT_ID}
        payload = {"query": {"text": prompt}}
        try:
            response = requests.post(URL, headers=headers, json=payload, timeout=120, proxies={"http":None, "https":None}, verify=False)
            
            # 401 Unauthorized 처리: 토큰 강제 갱신 후 재시도
            if response.status_code == 401 and retry_count < 1:
                print("[INFO] 401 Unauthorized detected. Force refreshing token...")
                self.creds.refresh(Request())
                return self._call_api(prompt, retry_count + 1)
                
            if response.status_code != 200: return f"[API ERROR] {response.status_code}: {response.text}"
            
            raw_text = response.text.replace('][', ',')
            if not raw_text.startswith('['): raw_text = '[' + raw_text + ']'
            ai_text = ""
            try:
                items = json.loads(raw_text)
                for item in items:
                    if 'answer' in item and 'replies' in item['answer']:
                        for reply in item['answer']['replies']:
                            ai_text += reply.get('groundedContent', {}).get('content', {}).get('text', '')
                return ai_text.strip()
            except: return response.text
        except Exception as e: return f"[CONNECTION ERROR] {e}"

    async def chat(self, system_prompt: str, messages: list[dict]) -> str:
        import uuid
        turn_id = str(uuid.uuid4())[:8]
        from tools import CURRENT_CWD
        
        # ── [CLI Standard] Load Core Artifacts ──
        # 에이전트가 항상 설계도(PLAN.md)와 맥락(CONTEXT.md)을 먼저 읽도록 강제
        global_md = r"C:\Users\ChrisHong\.gemini\GEMINI.md"
        
        core_instructions = f"\n[CORE PROTOCOL]\n1. ALWAYS use ABSOLUTE PATHS.\n2. CWD: {CURRENT_CWD}\n3. SESSION_ID: {turn_id}\n"
        try:
            if os.path.exists(global_md):
                with open(global_md, 'r', encoding='utf-8') as f: core_instructions += f"\n[GLOBAL CONSTITUTION]\n{f.read()}\n"
        except: pass

        combined = f"## System Instruction\n{system_prompt}\n{core_instructions}\n\n"
        combined += "## Chat History\n"
        for msg in messages:
            role = "User" if msg["role"] == "user" else "Assistant"
            combined += f"{role}: {msg['content']}\n"
        combined += "\nAssistant: "
        
        # Logging for transparency (CLI-like audit trail)
        log_dir = Path("logs/sessions")
        log_dir.mkdir(parents=True, exist_ok=True)
        with open(log_dir / f"turn_{turn_id}.txt", "w", encoding="utf-8") as f: f.write(combined)
        
        return await asyncio.to_thread(self._call_api, combined)

    async def run_agent(self, system_prompt: str, messages: list[dict], tools: list[dict]) -> str:
        tool_hint = (
            "\n\n[MANDATORY STARTUP]\n"
            "Before performing any task, use 'read_file' to check if 'PLAN.md' and 'CONTEXT.md' exist in your storage folder. "
            "Always align your actions with the established PLAN.\n\n"
            "[TOOL USE RULES]\n"
            "If you need to use a tool, output JSON only:\n"
            "```json\n"
            '{"tool": "tool_name", "args": {"arg1": "val1", ...}}\n'
            "```\n"
            "Available tools: " + ", ".join([t["name"] for t in tools])
        )
        current_system = system_prompt + tool_hint
        current_messages = messages.copy()
        for iteration in range(12):
            res = await self.chat(current_system, current_messages)
            try:
                json_str = None
                if "```json" in res: json_str = res.split("```json")[1].split("```")[0].strip()
                elif "{" in res and "}" in res: json_str = res[res.find("{"):res.rfind("}")+1]
                if json_str:
                    call = json.loads(json_str)
                    if "tool" in call:
                        print(f"Executing: {call['tool']}")
                        out = execute_tool_sync(call["tool"], call["args"])
                        current_messages.append({"role": "assistant", "content": res})
                        current_messages.append({"role": "user", "content": f"[TOOL RESULT] {out}"})
                        continue
            except: pass
            return res
        return "[ERROR] Iteration limit."

    @property
    def engine_name(self) -> str: return "gemini"
