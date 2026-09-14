# 1) Gera as duas páginas a partir de tools/build_pages.py (roda no servidor, durante o build).
FROM python:3.12-alpine AS pages
WORKDIR /src
COPY tools/build_pages.py tools/build_pages.py
COPY assets/css assets/css
COPY assets/js assets/js
RUN python3 tools/build_pages.py

# 2) Serve o site estático.
FROM nginx:stable-alpine
LABEL app=page-intertouring

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Só o que é público entra na imagem (docs, tools e originais ficam de fora).
COPY robots.txt sitemap.xml /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/
COPY --from=pages /src/index.html /usr/share/nginx/html/index.html
COPY --from=pages /src/carnaval/index.html /usr/share/nginx/html/carnaval/index.html
COPY --from=pages /src/servicos/index.html /usr/share/nginx/html/servicos/index.html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
