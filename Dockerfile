FROM nginx:stable-alpine
LABEL app=page-intertouring

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Só o que é público entra na imagem (docs, tools e originais ficam de fora).
COPY index.html robots.txt sitemap.xml /usr/share/nginx/html/
COPY carnaval/ /usr/share/nginx/html/carnaval/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
