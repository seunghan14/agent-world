import asyncio
import traceback
import json
import os
from pathlib import Path
from typing import Callable

WALK = 1.6

# ── 분류 프롬프트 (최근 대화 맥락 포함) ─────────────────────────
CLASSIFY_PROMPT = """최근 대화 내역:
{history}

새 메시지: "{message}"

위 새 메시지를 아래 기준으로 분류하세요:

TASK: 완전히 새로운 개발/코딩/구현/만들기/작성/수정 요청. 아직 시작하지 않은 작업.
CHAT: 이전 작업에 대한 확인/질문/불만/상태 문의, 일상 대화, 진행 여부 확인, 이미 요청한 것의 재확인.

주의: 이미 요청했던 작업에 대해 "왜 안 해?" "다시 해줘" "끝났어?" 같은 말은 CHAT.

TASK 또는 CHAT 중 하나만 출력:"""

# Zero-Trust 경로 설정
HANDOFF_DIR = Path(r"C:\Users\ChrisHong\.ai-shared\projects\agent-world\storage\projects\agent-world\handoffs")


async def _move(agent: str, target: str, message: str, broadcast: Callable):
    await broadcast({
        "type": "agent_state", "agent": agent,
        "status": "communicating", "message": message,
        "target": target, "elapsed_ms": 0,
    })
    await asyncio.sleep(WALK + 2.5) # 이동 + 대화 + 복귀 대기 시간 포함


async def _idle_all(broadcast: Callable):
    for name in ["master", "planner", "visionary", "red-team", "developer", "reviewer", "qa", "debugger"]:
        await broadcast({
            "type": "agent_state", "agent": name,
            "status": "idle", "message": "", "target": "", "elapsed_ms": 0,
        })

async def _waiting_all(broadcast: Callable):
    """작업 시작 시 모든 유관 에이전트를 대기 상태로 전환"""
    for name in ["planner", "visionary", "red-team", "developer", "reviewer", "qa", "debugger"]:
        await broadcast({
            "type": "agent_state", "agent": name,
            "status": "waiting", "message": "입무 대기 중...", "target": "", "elapsed_ms": 0,
        })


def _history_summary(chat_history: list, n: int = 8) -> str:
    recent = chat_history[-n:] if len(chat_history) >= n else chat_history
    lines = []
    for m in recent:
        role = "Chris" if m["role"] == "user" else "Master"
        content = str(m["content"])[:120].replace("\n", " ")
        lines.append(f"{role}: {content}")
    return "\n".join(lines) if lines else "(대화 없음)"


async def handle_message(
    message: str,
    agents: dict,
    broadcast: Callable,
    approval_event: asyncio.Event,
    approval_data: dict,
    chat_history: list,
):
    try:
        await broadcast({
            "type": "agent_state", "agent": "master",
            "status": "working", "message": "분류 및 맥락 파악 중...", "target": "", "elapsed_ms": 0,
        })

        history_ctx = _history_summary(chat_history)
        classify = await agents["master"].engine.chat(
            "당신은 메시지 분류기입니다. TASK 또는 CHAT 중 하나만 출력하세요.",
            [{"role": "user", "content": CLASSIFY_PROMPT.format(
                history=history_ctx,
                message=message,
            )}],
        )
        kind = "TASK" if "TASK" in (classify or "").upper() else "CHAT"

        if kind == "CHAT":
            chat_history.append({"role": "user", "content": message})
            reply = await agents["master"].engine.chat(agents["master"].full_prompt, chat_history[-30:])
            chat_history.append({"role": "assistant", "content": reply})
            await broadcast({"type": "agent_state", "agent": "master", "status": "idle"})
            await broadcast({"type": "chat", "from": "master", "message": reply})
        else:
            await _waiting_all(broadcast)
            chat_history.append({"role": "user", "content": f"[작업 요청] {message}"})
            success, summary = await run_dev_workflow(message, agents, broadcast, approval_event, approval_data)
            chat_history.append({"role": "assistant", "content": summary})
    except Exception as e:
        traceback.print_exc()
        await broadcast({"type": "chat", "from": "master", "message": f"❌ 시스템 오류: {e}"})
        await _idle_all(broadcast)


async def run_dev_workflow(
    task: str,
    agents: dict,
    broadcast: Callable,
    approval_event: asyncio.Event,
    approval_data: dict,
) -> tuple[bool, str]:
    try:
        HANDOFF_DIR.mkdir(parents=True, exist_ok=True)
        
        # 1. Master: Task 정의 및 Handoff 초기화
        await broadcast({"type": "agent_state", "agent": "master", "status": "working", "message": "Zero-Trust 인수인계 준비 중..."})
        initial_task_path = HANDOFF_DIR / "initial_task.md"
        initial_task_path.write_text(f"# Project Task\n\n{task}", encoding="utf-8")
        
        # ── 1단계: 계획 수립 (Zero-Trust Tiki-Taka) ──
        iteration = 0
        current_context_desc = f"초기 작업 요청({initial_task_path})을 확인하십시오."
        
        while iteration < 5:
            iteration += 1
            await _move("master", "planner", "기술 설계 초안 작성을 시작합니다.", broadcast)
            # Planner는 이전 컨텍스트를 읽고 계획 작성 후 handoffs/plan.md에 저장해야 함
            plan_handoff = HANDOFF_DIR / "plan.md"
            await agents["planner"].run(
                f"{current_context_desc}\n\n"
                f"요구사항을 분석하여 기술 설계안을 작성하고, 반드시 {plan_handoff} 경로에 'write_file'로 저장하십시오."
            )

            debate_round = 0
            while debate_round < 1: # Zero-Trust 시연을 위해 1회로 단축
                debate_round += 1
                await _move("planner", "visionary", f"계획({plan_handoff})을 검토하고 혁신적 제안을 추가하세요.", broadcast)
                visionary_handoff = HANDOFF_DIR / "visionary_suggestions.md"
                await agents["visionary"].run(
                    f"현재 설계안({plan_handoff})을 읽으십시오. "
                    f"더 나은 아키텍처나 기능을 제안하고 {visionary_handoff}에 저장하십시오."
                )

                await _move("visionary", "red-team", f"설계 및 제안을 감사하여 취약점을 지적하세요.", broadcast)
                audit_handoff = HANDOFF_DIR / "redteam_audit.md"
                await agents["red-team"].run(
                    f"기본 설계({plan_handoff})와 추가 제안({visionary_handoff})을 모두 읽고 리스크를 분석하십시오. "
                    f"보안/성능 취약점을 찾아 {audit_handoff}에 기록하십시오."
                )

                await _move("red-team", "planner", f"감사 결과({audit_handoff})를 반영하여 최종안을 확정하세요.", broadcast)
                final_plan_path = HANDOFF_DIR / "final_plan.md"
                await agents["planner"].run(
                    f"Red-Team의 감사 결과({audit_handoff})를 수용하여 설계를 수정하십시오. "
                    f"최종 합의된 설계안을 {final_plan_path}에 저장하십시오."
                )

            # Master가 최종 계획을 읽어서 Chris에게 보고
            final_plan_content = final_plan_path.read_text(encoding="utf-8") if final_plan_path.exists() else "계획 생성 실패"
            await _move("planner", "master", "물리적 인수인계가 완료된 최종안을 보고합니다.", broadcast)
            await broadcast({"type": "approval_request", "message": f"📋 [Zero-Trust 브레인 팀 최종 합의안]\n\n{final_plan_content}"})
            
            approval_event.clear()
            await approval_event.wait()
            if not approval_data["approved"]:
                await broadcast({"type": "chat", "from": "master", "message": "작업이 취소되었습니다."})
                return False, "[작업 취소]"

            if approval_data.get("feedback"):
                feedback_path = HANDOFF_DIR / "user_feedback.md"
                feedback_path.write_text(approval_data["feedback"], encoding="utf-8")
                current_context_desc = f"이전 계획({final_plan_path})과 사용자 피드백({feedback_path})을 반영하십시오."
                continue
            break

        # ── 2단계: 구현 및 품질 검증 (강제적 물리 검증) ──
        await _move("master", "developer", "승인된 계획에 따라 구현을 개시합니다.", broadcast)
        
        dev_handoff = HANDOFF_DIR / "dev_report.md"
        # Developer는 final_plan.md를 읽고 코딩 후 dev_report.md 작성
        await agents["developer"].run(
            f"최종 설계안({final_plan_path})을 'read_file'로 읽고 구현을 시작하십시오. "
            f"작업 완료 후, 변경된 파일 목록과 수정 내용을 {dev_handoff}에 기록하십시오."
        )

        for i in range(1, 3):
            await _move("developer", "reviewer", f"코드 리뷰를 수행합니다. (시도 {i}회)", broadcast)
            # Reviewer는 developer의 설명을 믿지 않고 실제 파일을 읽어야 함
            review_path = HANDOFF_DIR / f"review_report_{i}.md"
            review_result = await agents["reviewer"].run(
                f"개발자 보고서({dev_handoff})를 읽고, 실제 수정된 파일들의 내용을 'read_file'로 직접 확인하십시오. "
                f"원칙(GEMINI.md) 준수 여부와 버그를 체크하여 {review_path}에 기록하고 PASS/FAIL 여부를 포함하십시오."
            )
            
            if "PASS" in review_result.upper(): break
            
            await _move("reviewer", "developer", "리뷰 피드백에 따른 수정을 요청합니다.", broadcast)
            await agents["developer"].run(f"리뷰 보고서({review_path})를 읽고 지적된 사항을 수정하십시오. 수정 후 {dev_handoff}를 갱신하십시오.")

        await _move("reviewer", "qa", "물리적 파일 기반 QA 테스트를 수행합니다.", broadcast)
        qa_handoff = HANDOFF_DIR / "qa_report.md"
        await agents["qa"].run(
            f"최종 구현된 결과물을 실제 실행하여 검증하십시오. "
            f"이전 보고서가 아닌, 실제 파일 상태와 테스트 실행 로그를 근거로 {qa_handoff}를 작성하십시오."
        )

        # 최종 보고 (Master가 모든 물리적 증거 취합)
        qa_summary = qa_handoff.read_text(encoding="utf-8") if qa_handoff.exists() else "QA 결과 없음"
        final_report = await agents["master"].final_report(
            f"과제: {task}\n"
            f"물리적 증거 위치: {HANDOFF_DIR}\n"
            f"QA 요약: {qa_summary[:500]}"
        )
        
        await broadcast({"type": "chat", "from": "master", "message": f"🏆 Zero-Trust 프로젝트 완수 보고\n\n{final_report}"})
        return True, f"성공: {task}"

    except Exception as e:
        traceback.print_exc()
        return False, f"오류: {e}"
    finally:
        await _idle_all(broadcast)
