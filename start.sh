#!/bin/bash

echo "Starting Blender AI Agent..."

echo "Starting backend server..."
cd backend && python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Opening browser..."
sleep 5
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
else
    echo "Browser could not be opened automatically. Please open http://localhost:3000 manually."
fi

echo "Blender AI Agent started successfully!"
echo "Please make sure Blender is running with the WebSocket add-on enabled."

# Handle cleanup on exit
function cleanup {
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

trap cleanup INT TERM

# Wait for user input
echo "Press Ctrl+C to stop all services"
wait
