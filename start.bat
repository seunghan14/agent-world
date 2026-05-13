@echo off
cd /d "%~dp0"

if not exist .env (
  copy .env.example .env
)

cd backend
pip install -r requirements.txt -q

echo.
echo Agent World 시작 중... (엔진: Gemini)
echo 브라우저에서 http://localhost:8000 접속하세요.
echo.
python main.py
