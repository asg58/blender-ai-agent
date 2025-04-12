@echo off
echo Starting Blender AI Agent...

echo Starting backend server...
start cmd /k "cd backend && .\venv\Scripts\python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

echo Starting frontend server...
start cmd /k "cd frontend && npm run dev"

echo Opening browser...
timeout /t 5
start http://localhost:3000

echo Blender AI Agent started successfully!
echo Please make sure Blender is running with the WebSocket add-on enabled. 