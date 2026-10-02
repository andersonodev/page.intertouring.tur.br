# page.intertouring.tur.br

Landing pages da **Intertouring Receptivo** (Rio de Janeiro), hoje em **modo temporada: Carnaval 2027**.

| Endereço | Arquivo | O que é |
|---|---|---|
| `/` | `index.html` | Página principal, com as experiências de Carnaval |
| `/carnaval/` | `carnaval/index.html` | Página dedicada: noites de desfile, camarote, frisa e arquibancada, o que está incluso, perguntas |
| `/servicos/` | `servicos/index.html` | Todos os serviços: a Sapucaí (leva a `/carnaval/`), bastidores, ensaios, B2B |
| `/sambodromo/` | `sambodromo/index.html` | Mapa 3D interativo do Sambódromo, setor por setor, e como chegar |
| `/historia-do-carnaval/` | `historia-do-carnaval/index.html` | História do Carnaval no mundo e no Rio, em cenas de vídeo que acompanham a rolagem |

Site estático: HTML, CSS e JS puros, sem framework. Todo contato vai para o **WhatsApp** ou o **e-mail**, com a mensagem já preenchida pelo planejador. Não há backend nem banco de dados.

## Estrutura

```
assets/css/styles.css             estilos (tokens do design system)
assets/js/main.js                 menu, planejador → WhatsApp/e-mail, animações
assets/js/sambodromo.js           mapa 3D do Sambódromo (WebGL2, sem dependências; monta a cena num Web Worker)
assets/data/sambodromo.geo.json   contornos reais do Sambódromo e do entorno (OpenStreetMap, ODbL)
assets/js/historia.js             o filme da página de história (as cenas acompanham a rolagem)
assets/css/historia.css           estilos só da página de história
assets/video/historia/            as 20 cenas em MP4 (1280 e 640 px, reconstituições feitas com IA)
assets/img/historia/              os quadros de cada cena (pôsteres e versão sem JavaScript)
assets/img, fonts, brand, video   mídia otimizada (AVIF/WebP/JPEG)
tools/build_pages.py              gera as páginas (no build Docker do servidor); os fatos dos setores estão em SAMB_*
tools/osm_sambodromo.py           refaz assets/data/sambodromo.geo.json a partir do OpenStreetMap (só quando o mapa mudar)
tools/build-images.mjs            tratamento e exportação das fotos (lê assets-src/)
tools/shoot.py                    capturas de tela para revisão (Playwright)
design-system.md, bar.md          sistema visual e critérios de acabamento
docs/ASSET_SOURCES.md             origem e licença de cada imagem
deploy/, Dockerfile, docker-compose.yml, deploy.sh   publicação
```

## Editar

1. Textos e estrutura: edite `tools/build_pages.py`. As páginas são geradas no build do servidor.
   - Os fatos vêm do catálogo do Softtur.
   - Não publicar preços.
2. Estilo: edite `assets/css/styles.css`. No build, o gerador atualiza o `?v=` que invalida o cache.
3. Imagens: `node tools/build-images.mjs` (precisa dos originais em `assets-src/`, que ficam fora do repositório).
4. Mapa 3D: os textos dos setores vêm do mapa oficial da LIESA e ficam em `tools/build_pages.py` (`SAMB_*`). Os contornos vêm do OpenStreetMap: `python3 tools/osm_sambodromo.py` refaz o arquivo de dados (precisa de internet). O crédito ao OpenStreetMap fica sob o mapa, como pede a licença ODbL.
5. História do Carnaval: os textos e as fontes ficam em `tools/build_pages.py` (`HIST_*`). Cada cena é uma imagem do Higgsfield (GPT Image 2.5) animada em 5 s (Kling 3.0). Os vídeos são codificados no servidor, nunca no Mac: ffmpeg, H.264 sem áudio, cada cena em loop sem emenda (o último segundo se dissolve no primeiro). Ao recodificar, suba `HIST_MEDIA_V` em `tools/build_pages.py` para os navegadores buscarem os arquivos novos.

Pré-visualização local, opcional (gera as páginas nesta máquina):

```bash
python3 tools/build_pages.py && python3 -m http.server 8000
```

## Publicar

```bash
./deploy.sh
```

O script confere se está tudo commitado e envia ao GitHub. Depois, no servidor:
1. faz `git pull`;
2. constrói a imagem (as páginas são geradas aqui), com o container antigo ainda no ar;
3. testa o nginx;
4. troca o container e confirma que o proxy o alcança.

### Servidor

- VPS `76.13.66.63` (Ubuntu 24.04). O código fica em `/opt/page.intertouring.tur.br`.
- O container `page-intertouring-web` (nginx:alpine) roda na rede Docker `nginx-proxy`, sem porta exposta no host. Na imagem entram só as páginas geradas, `assets/`, `robots.txt` e `sitemap.xml`.
- Entrada pelo **Nginx Proxy Manager**, com um Proxy Host:
  - Domain: `page.intertouring.tur.br`
  - Scheme: `http`, Forward Hostname: `page-intertouring-web`, Port: `80`
  - Block Common Exploits: ligado
  - SSL: Let's Encrypt, Force SSL, HTTP/2

### DNS

O domínio `intertouring.tur.br` usa nameservers do Cloudflare. O subdomínio precisa de um registro **A `page` → `76.13.66.63`**, com proxy do Cloudflare, como os demais subdomínios.

## Documentos internos

Ficam fora do repositório, que é público: o catálogo exportado do Softtur, o brief, o registro das rodadas de revisão e as capturas (`docs/renders`). Estão listados no `.gitignore`.
