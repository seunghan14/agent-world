import os
from .base import AIEngine
from .gemini import GeminiEngine

def create_engine(config: dict) -> AIEngine:
    # Enterprise requirement: Only Gemini is used. Claude is disabled.
    cfg = config["gemini"]
    return GeminiEngine(api_key=os.getenv(cfg["api_key_env"], ""), model=cfg["model"])
