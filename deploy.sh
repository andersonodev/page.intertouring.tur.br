#!/usr/bin/env bash
# Publica a versão commitada. Nada é gerado nesta máquina: as páginas são geradas no build Docker do servidor.
#   ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

SERVER="root@76.13.66.63"
APP_DIR="/opt/page.intertouring.tur.br"

if [ -n "$(git status --porcelain)" ]; then
  echo "Há alterações sem commit. Faça o commit antes de publicar." >&2
  git status --short >&2
  exit 1
fi

git push origin main
# No servidor: atualiza o código, constrói a imagem (o container atual segue no ar), testa a
# configuração do nginx num container temporário e só então troca o container.
ssh "$SERVER" "set -e; cd $APP_DIR
  git pull --ff-only
  docker compose build --quiet
  docker run --rm page-intertouring:latest nginx -t
  docker compose up -d
  sleep 3
  docker exec nginx-proxy-manager curl -fsS -o /dev/null http://page-intertouring-web/ && echo 'Publicado: container no ar e visível para o proxy.'
  docker image prune -f --filter label=app=page-intertouring >/dev/null"
