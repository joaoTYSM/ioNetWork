#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
SOURCE=""
for p in \
  "$HOME/Download/cookies.txt" \
  "/storage/emulated/0/Download/cookies.txt" \
  "/sdcard/Download/cookies.txt" \
  "/storage/emulated/0/cookies.txt" \
  "$HOME/cookies.txt"; do
  if [ -s "$p" ]; then SOURCE="$p"; break; fi
done
if [ -z "$SOURCE" ]; then
  echo "cookies.txt was not found. Export a Netscape-format cookies.txt and place it in Download."
  exit 1
fi
cp "$SOURCE" "cookies.txt"
chmod 600 "cookies.txt" 2>/dev/null || true
printf 'Cookies installed: %s\n' "$PWD/cookies.txt"
