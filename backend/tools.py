"""
에이전트가 사용하는 실제 도구 구현
CLI와 동일한 read_file / write_file / run_shell_command
"""
import subprocess
import os
from pathlib import Path

MAX_OUTPUT = 8000   # 셸 출력 최대 길이
SHELL_TIMEOUT = 60  # 초
PROJECT_ROOT = Path(r"C:\Users\ChrisHong")

# 전역 작업 디렉토리 상태 (CLI 세션 유지용)
CURRENT_CWD = PROJECT_ROOT

# ── 도구 정의 (Claude / Gemini 공통 메타) ────────────────────────
TOOL_DEFS = [
    {
        "name": "cd",
        "description": "작업 디렉토리를 변경합니다. (예: cd projects/my-app)",
        "params": {
            "path": {"type": "string", "description": "이동할 경로 (절대 또는 상대)"}
        },
        "required": ["path"],
    },
    {
        "name": "read_file",
        "description": "로컬 파일을 읽어 내용을 반환합니다.",
        "params": {
            "path": {"type": "string", "description": "읽을 파일의 경로 (현재 CWD 기준 또는 절대)"}
        },
        "required": ["path"],
    },
    {
        "name": "write_file",
        "description": "로컬 파일에 내용을 씁니다. 부모 폴더가 없으면 자동 생성합니다.",
        "params": {
            "path":    {"type": "string", "description": "쓸 파일 경로 (현재 CWD 기준 또는 절대)"},
            "content": {"type": "string", "description": "파일에 저장할 내용"},
        },
        "required": ["path", "content"],
    },
    {
        "name": "run_shell_command",
        "description": "쉘 명령을 실행합니다. 현재 CWD에서 실행됩니다.",
        "params": {
            "command": {"type": "string", "description": "실행할 쉘 명령"}
        },
        "required": ["command"],
    },
    {
        "name": "pwd",
        "description": "현재 작업 디렉토리 경로를 확인합니다.",
        "params": {},
        "required": [],
    },
]


# ── 도구 실행 (동기 — asyncio.to_thread 에서 호출) ───────────────
def execute_tool_sync(name: str, inputs: dict) -> str:
    global CURRENT_CWD
    try:
        if name == "pwd":
            return str(CURRENT_CWD)

        elif name == "cd":
            new_path = Path(inputs["path"])
            if not new_path.is_absolute():
                new_path = (CURRENT_CWD / new_path).resolve()
            
            if new_path.exists() and new_path.is_dir():
                CURRENT_CWD = new_path
                return f"[OK] CWD changed to: {CURRENT_CWD}"
            else:
                return f"[ERROR] Directory not found: {new_path}"

        # 경로 정규화 (CWD 기준)
        raw_path = inputs.get("path", "")
        if raw_path:
            p = Path(raw_path)
            if not p.is_absolute():
                p = (CURRENT_CWD / p).resolve()
            target_path = str(p)
        else:
            target_path = ""

        if name == "read_file":
            p = Path(target_path)
            if not p.exists():
                return f"[ERROR] 파일 없음: {target_path}"
            return p.read_text(encoding="utf-8")

        elif name == "write_file":
            p = Path(target_path)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(inputs["content"], encoding="utf-8")
            return f"[OK] 저장 완료: {target_path}"

        elif name == "run_shell_command":
            res = subprocess.run(
                inputs["command"],
                shell=True, capture_output=True, text=True,
                timeout=SHELL_TIMEOUT,
                cwd=str(CURRENT_CWD)
            )
            out = (res.stdout + res.stderr).strip() or "(출력 없음)"
            return out[:MAX_OUTPUT]

        else:
            return f"[ERROR] 알 수 없는 도구: {name}"

    except subprocess.TimeoutExpired:
        return f"[ERROR] 시간 초과 ({SHELL_TIMEOUT}s): {inputs.get('command','')}"
    except Exception as e:
        return f"[ERROR] {e}"
