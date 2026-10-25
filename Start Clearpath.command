#!/bin/zsh
set -eu
cd "$(dirname "$0")"
if curl -fsS http://127.0.0.1:4173/api/status >/dev/null 2>&1; then
  open http://127.0.0.1:4173
else
  open http://127.0.0.1:4173
  npm run dev
fi
