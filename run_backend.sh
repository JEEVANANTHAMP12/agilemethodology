#!/usr/bin/env bash
# ==============================================================================
# Structural Health & Crack Detection Rover System - Linux Backend Launcher
# ==============================================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$PROJECT_ROOT/.venv"

echo "============================================================"
echo "  Starting Autonomous Rover Inspection Backend"
echo "============================================================"

# 1. Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "[*] Creating Python virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
fi

# 2. Activate virtual environment
source "$VENV_DIR/bin/activate"

# 3. Ensure dependencies are installed
if ! python -c "import uvicorn, fastapi" &> /dev/null; then
    echo "[*] Installing backend dependencies from requirements.txt..."
    pip install --upgrade pip
    pip install -r "$PROJECT_ROOT/backend/requirements.txt"
fi

# 4. Start Uvicorn backend server
echo "[+] Starting FastAPI backend on http://127.0.0.1:8000..."
cd "$PROJECT_ROOT/backend"
exec python main.py
