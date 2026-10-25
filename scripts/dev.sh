#!/usr/bin/env bash
# Start backend (uvicorn, :8000) and frontend (vite, :5173+) together.
# Ctrl+C stops both. Run ./scripts/setup.sh first if you haven't.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [ ! -d "$ROOT_DIR/.venv" ]; then
  echo ".venv not found — run ./scripts/setup.sh first." >&2
  exit 1
fi

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo
  echo "==> Stopping dev servers..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "==> Starting backend on :8000"
(
  cd "$ROOT_DIR"
  # shellcheck disable=SC1091
  source .venv/bin/activate
  exec uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

echo "==> Starting frontend (vite)"
(
  cd "$FRONTEND_DIR"
  exec npm run dev
) &
FRONTEND_PID=$!

echo
echo "Backend:  http://localhost:8000"
echo "Frontend: see Vite's own output above for its port (5173, or the next free one)"
echo "Press Ctrl+C to stop both."

wait
