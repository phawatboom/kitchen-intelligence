@echo off
TITLE Kitchen Intelligence Starter

echo ==========================================
echo   Starting Collective Kitchen OS
echo ==========================================

echo [1/2] Starting Backend (FastAPI)...
start "Kitchen Backend" cmd /c ".venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000"

echo [2/2] Starting Frontend (Vite)...
cd frontend
start "Kitchen Frontend" cmd /c "pnpm run dev"

echo.
echo ==========================================
echo   Ready! 
echo   API: http://localhost:8000
echo   App: http://localhost:5173
echo ==========================================
echo.
timeout /t 5
explorer "http://localhost:5173"
pause
