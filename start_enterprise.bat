@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

if not exist .env (
    echo [.env] file missing. Copying from .env.example...
    copy .env.example .env >nul
)

echo [1/2] Checking virtual environment and dependencies...
cd backend
if not exist venv (
    echo [ERROR] Virtual environment 'venv' not found.
    pause
    exit /b
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Missing dependencies check
python -c "import anthropic" 2>nul
if errorlevel 1 (
    echo [INFO] Installing missing dependency: anthropic...
    pip install anthropic -q
)

echo [2/2] Starting Chris AI Code-Forge Server...
echo.
echo ======================================================
echo  URL: http://localhost:8000
echo  Engine: Gemini Enterprise (OAuth)
echo ======================================================
echo.

:: Run the server
python main.py
