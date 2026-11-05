#!/usr/bin/env bash
# ==============================================================================
# Structural Health Rover Backend Launcher (from backend/ directory)
# ==============================================================================

set -e
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$BACKEND_DIR")"

# Check root .venv or backend .venv
if [ -d "$PROJECT_ROOT/.venv" ]; then
    VENV_DIR="$PROJECT_ROOT/.venv"
elif [ -d "$BACKEND_DIR/.venv" ]; then
    VENV_DIR="$BACKEND_DIR/.venv"
else
    echo "[*] Creating virtual environment at $PROJECT_ROOT/.venv..."
    python3 -m venv "$PROJECT_ROOT/.venv"
    VENV_DIR="$PROJECT_ROOT/.venv"
fi

source "$VENV_DIR/bin/activate"

if ! python -c "import uvicorn, fastapi" &> /dev/null; then
    echo "[*] Installing backend dependencies from requirements.txt..."
    pip install --upgrade pip
    pip install -r "$BACKEND_DIR/requirements.txt"
fi

echo "[+] Starting FastAPI backend on http://127.0.0.1:8000..."
cd "$BACKEND_DIR"
exec python main.py

