# page.intertouring.tur.br

Landing pages da **Intertouring Receptivo** (Rio de Janeiro), hoje em **modo temporada: Carnaval 2027**.

| Endereço | Arquivo | O que é |
|---|---|---|
| `/` | `index.html` | Página principal, com as experiências de Carnaval |
| `/carnaval/` | `carnaval/index.html` | Página dedicada: noites de desfile, camarote, frisa e arquibancada, bastidores, ensaios, B2B |

Site estático: HTML, CSS e JS puros, sem framework. Todo contato vai para o **WhatsApp** ou o **e-mail**, com a mensagem já preenchida pelo planejador. Não há backend nem banco de dados.

## Estrutura

```
index.html, carnaval/index.html   páginas geradas (não editar à mão)
assets/css/styles.css             estilos (tokens do design system)
assets/js/main.js                 menu, planejador → WhatsApp/e-mail, animações
assets/js/territory.js            mapa 3D do Carnaval e globo
assets/img, fonts, brand, video   mídia otimizada (AVIF/WebP/JPEG)
tools/build_pages.py              gera as duas páginas a partir de componentes
tools/build-images.mjs            tratamento e exportação das fotos (lê assets-src/)
tools/shoot.py                    capturas de tela para revisão (Playwright)
design-system.md, bar.md          sistema visual e critérios de acabamento
docs/ASSET_SOURCES.md             origem e licença de cada imagem
deploy/, Dockerfile, docker-compose.yml, deploy.sh   publicação
```

## Editar

1. Textos e estrutura: edite `tools/build_pages.py` e rode `python3 tools/build_pages.py`.
   - Os fatos vêm do catálogo do Softtur.
   - Não publicar preços.
2. Estilo: edite `assets/css/styles.css` e rode o gerador de novo. Ele atualiza o `?v=` que invalida o cache.
3. Imagens: `node tools/build-images.mjs` (precisa dos originais em `assets-src/`, que ficam fora do repositório).

Pré-visualização local:

```bash
python3 -m http.server 8000
```

## Publicar

```bash
./deploy.sh
```

O script:
1. gera as páginas e confere se está tudo commitado;
2. envia ao GitHub;
3. no servidor, faz `git pull` e reconstrói o container.

### Servidor

- VPS `76.13.66.63` (Ubuntu 24.04). O código fica em `/opt/page.intertouring.tur.br`.
- O container `page-intertouring-web` (nginx:alpine) roda na rede Docker `nginx-proxy`, sem porta exposta no host. Na imagem entram só `index.html`, `carnaval/`, `assets/`, `robots.txt` e `sitemap.xml`.
- Entrada pelo **Nginx Proxy Manager**, com um Proxy Host:
  - Domain: `page.intertouring.tur.br`
  - Scheme: `http`, Forward Hostname: `page-intertouring-web`, Port: `80`
  - Block Common Exploits: ligado
  - SSL: Let's Encrypt, Force SSL, HTTP/2

### DNS

O domínio `intertouring.tur.br` usa nameservers do Cloudflare. O subdomínio precisa de um registro **A `page` → `76.13.66.63`**, com proxy do Cloudflare, como os demais subdomínios.

## Documentos internos

Ficam fora do repositório, que é público: o catálogo exportado do Softtur, o brief, o registro das rodadas de revisão e as capturas (`docs/renders`). Estão listados no `.gitignore`.
