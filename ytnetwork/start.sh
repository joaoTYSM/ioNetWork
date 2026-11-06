#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
say(){ printf '\033[1;35m[ytnetwork]\033[0m %s\n' "$*"; }
warn(){ printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
SUDO=""; [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1 && SUDO="sudo"
pm_install(){
  if command -v pkg >/dev/null 2>&1 && [ -n "$PREFIX" ]; then pkg install -y "$@" || warn "pkg failed: $*"
  elif command -v apt-get >/dev/null 2>&1; then $SUDO apt-get install -y "$@" || warn "apt failed: $*"
  elif command -v brew >/dev/null 2>&1; then brew install "$@" || warn "brew failed: $*"
  elif command -v dnf >/dev/null 2>&1; then $SUDO dnf install -y "$@" || warn "dnf failed: $*"
  elif command -v pacman >/dev/null 2>&1; then $SUDO pacman -S --noconfirm "$@" || warn "pacman failed: $*"
  else warn "no package manager found for: $*"; fi; }

PY="$(command -v python3 || command -v python)"
[ -z "$PY" ] && { say "Installing python..."; pm_install python3 python; PY="$(command -v python3 || command -v python)"; }
[ -z "$PY" ] && { echo "Python is required and could not be installed."; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { say "Installing ffmpeg (optional, for 1080p downloads)..."; pm_install ffmpeg; }
if ! command -v node >/dev/null 2>&1 && ! command -v deno >/dev/null 2>&1 && ! command -v bun >/dev/null 2>&1; then
  say "Installing nodejs (optional, fewer YouTube errors)..."; pm_install nodejs; fi

if [ ! -d .venv ]; then "$PY" -m venv .venv >/dev/null 2>&1 || { warn "venv unavailable, using system python"; rm -rf .venv; }; fi
[ -x .venv/bin/python ] && PY=".venv/bin/python"

pipi(){ "$PY" -m pip install -q "$@" 2>/dev/null || "$PY" -m pip install -q --break-system-packages "$@" 2>/dev/null \
  || "$PY" -m pip install -q --user --break-system-packages "$@" 2>/dev/null; }
"$PY" -m pip --version >/dev/null 2>&1 || { "$PY" -m ensurepip --upgrade >/dev/null 2>&1 || pm_install python3-pip; }
if ! "$PY" -c "import flask,requests,yt_dlp" >/dev/null 2>&1; then
  say "Installing Python packages..."
  pipi -r requirements.txt || for p in flask requests yt-dlp; do pipi "$p" || warn "could not install $p"; done
fi
(timeout 25 "$PY" -m pip install -q -U yt-dlp >/dev/null 2>&1 || true)
"$PY" -c "import flask,requests,yt_dlp" 2>/dev/null || { echo "Missing Python packages. Try: $PY -m pip install flask requests yt-dlp"; exit 1; }

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
say "Open http://localhost:${PORT:-8765}/  ${IP:+(LAN: http://$IP:${PORT:-8765}/)}"
while true; do "$PY" server.py; c=$?; [ $c -eq 130 ] || [ $c -eq 143 ] && break; warn "server stopped ($c), restarting in 2s (Ctrl+C to quit)"; sleep 2; done
