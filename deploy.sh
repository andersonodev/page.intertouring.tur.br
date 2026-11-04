#!/usr/bin/env bash
# Publica a versão commitada. Nada é gerado nesta máquina: as páginas são geradas no build Docker do servidor.
#   ./deploy.sh
# Servidor de produção: IntertouringReceptivo-SV2 (Lightsail, São Paulo), desde 26/10/2026.
# A VPS antiga (76.13.66.63) não recebe mais o tráfego do domínio.
set -euo pipefail
cd "$(dirname "$0")"

SERVER="ubuntu@18.228.132.38"
SSH_KEY="$HOME/.ssh/id_ed25519"
APP_DIR="/opt/page.intertouring.tur.br"

if [ -n "$(git status --porcelain)" ]; then
  echo "Há alterações sem commit. Faça o commit antes de publicar." >&2
  git status --short >&2
  exit 1
fi

git push origin main
REV="$(git rev-parse --short HEAD)"
STAMP="$(date +%Y%m%d-%H%M)"
# No servidor (o repositório é do root e fica fixo num commit): busca o commit publicado, guarda a imagem atual para
# reverter, constrói a nova (o container atual segue no ar), testa o nginx num container temporário e só então troca.
# Reverter: sudo docker tag page-intertouring:rollback-<data> page-intertouring:latest && sudo docker compose up -d
ssh -i "$SSH_KEY" "$SERVER" "set -e; cd $APP_DIR
  sudo git fetch -q origin main
  sudo git checkout -q --detach $REV
  sudo docker tag page-intertouring:latest page-intertouring:rollback-$STAMP
  sudo docker compose build --quiet
  sudo docker run --rm page-intertouring:latest nginx -t
  sudo docker compose up -d
  sleep 3
  sudo docker exec nginx-proxy-manager curl -fsS -o /dev/null http://page-intertouring-web/ && echo 'Publicado: container no ar e visível para o proxy.'
  sudo docker image prune -f --filter label=app=page-intertouring >/dev/null"
