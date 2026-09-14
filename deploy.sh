#!/usr/bin/env bash
# Publica a versão atual: gera as páginas, envia ao GitHub e atualiza o servidor.
#   ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

SERVER="root@76.13.66.63"
APP_DIR="/opt/page.intertouring.tur.br"

python3 tools/build_pages.py
if [ -n "$(git status --porcelain)" ]; then
  echo "Há alterações sem commit. Faça o commit antes de publicar." >&2
  git status --short >&2
  exit 1
fi

git push origin main
ssh "$SERVER" "cd $APP_DIR && git pull --ff-only && docker compose up -d --build \
  && docker image prune -f --filter label=app=page-intertouring >/dev/null \
  && docker exec nginx-proxy-manager wget -q -O /dev/null http://page-intertouring-web/ && echo 'Container no ar e visível para o proxy.'"
