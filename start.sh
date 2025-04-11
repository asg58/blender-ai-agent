#!/bin/bash

echo "🚀 Starten van Blender AI Agent stack..."

# Start frontend (Next.js)
echo "🟢 Start frontend..."
cd frontend
npm install
npm run dev &
cd ..

# Start backend (FastAPI)
echo "🟡 Start backend..."
cd backend
source ../venv/bin/activate 2>/dev/null || echo "⚠️  Vergeet niet je venv te activeren!"
uvicorn main:app --reload --port 8000 &
cd ..

# Start Blender WebSocket Agent
echo "🔵 Start Blender WebSocket-agent..."
blender -b -P blender_agent/websocket_server.py &

echo "✅ Alles draait! Frontend: http://localhost:3000 – Backend: http://localhost:8000"
