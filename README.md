# carnaval.intertouring.tur.br

O endereço antigo, `page.intertouring.tur.br`, leva ao novo com o mesmo caminho (301, em `deploy/nginx.conf`). O repositório e a pasta no servidor mantêm o nome antigo.

Landing pages da **Intertouring Receptivo** (Rio de Janeiro), hoje em **modo temporada: Carnaval 2027**.

| Endereço | Arquivo | O que é |
|---|---|---|
| `/` | `index.html` | Página principal, com as experiências de Carnaval |
| `/carnaval/` | `carnaval/index.html` | Todos os serviços de Carnaval: noites de desfile, camarote, frisa e arquibancada, o que está incluso, bastidores, ensaios, agências e grupos, perguntas |
| `/servicos/` | `servicos/index.html` | Endereço antigo: o nginx redireciona para `/carnaval/` (as duas abas viraram uma, a pedido da cliente, em 11/11/2026) |
| `/sambodromo/` | `sambodromo/index.html` | Mapa 3D interativo do Sambódromo, setor por setor, e como chegar |
| `/historia-do-carnaval/` | `historia-do-carnaval/index.html` | História do Carnaval carioca (texto da Intertouring), com fotos e vídeos reais que acompanham a rolagem |

Site estático: HTML, CSS e JS puros, sem framework. Todas as animações funcionam em qualquer aparelho: os mais simples recebem versões mais leves, e com "reduzir movimento" elas ficam mais suaves (sem deslocamento), nunca desligadas. **Todas as imagens e vídeos são reais: nada é gerado por IA.** Todo contato vai para o **WhatsApp** ou o **e-mail**, com a mensagem já preenchida pelo planejador. Não há backend nem banco de dados.

## Estrutura

```
assets/css/styles.css             estilos (tokens do design system)
assets/js/main.js                 menu, planejador → WhatsApp/e-mail, animações
assets/js/sambodromo.js           mapa 3D do Sambódromo (WebGL2, sem dependências; monta a cena num Web Worker; quatro níveis de qualidade pelo aparelho, inclusive sem placa de vídeo, e desce sozinho se travar; a planta só aparece em navegador sem WebGL2)
assets/data/sambodromo.geo.json   contornos reais do Sambódromo e do entorno (OpenStreetMap, ODbL)
assets/js/historia.js             o filme da página de história (as cenas acompanham a rolagem)
assets/css/historia.css           estilos só da página de história
assets/video/historia/            as cenas em vídeo (1280 e 640 px), do acervo de vídeos da Intertouring
assets/img/historia/              a foto de cada capítulo, as fotos que fazem de cena e os pôsteres dos vídeos
assets/img, fonts, brand, video   mídia otimizada (AVIF/WebP/JPEG)
tools/build_pages.py              gera as páginas (no build Docker do servidor); os fatos dos setores estão em SAMB_*
tools/osm_sambodromo.py           refaz assets/data/sambodromo.geo.json a partir do OpenStreetMap (só quando o mapa mudar)
tools/build-images.mjs            recorte e exportação das fotos, do site e da história (lê assets-src/)
tools/encode_historia.sh          codifica as cenas em vídeo da história (roda num servidor, num container de ffmpeg)
tools/encode_hero.sh              codifica o vídeo do topo da página inicial (idem)
assets/video/hero-film-*.mp4      o filme do topo da página inicial: oito planos reais da Sapucaí, 28,8 s em loop (1920 e 1280 px; 720×1280 no celular). O 1920 só vai para telas largas e densas; em conexão 2G/3G, economia de dados ou aparelho com pouca memória vão as versões leves (`hero-film-640.mp4` e `hero-film-m-low.mp4`, ~2 MB). Toca em qualquer aparelho, com botão de pausa
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
3. Imagens: `node tools/build-images.mjs` (precisa dos originais em `assets-src/`, que ficam fora do repositório). Só fotos reais: as do documento da história e do Drive da Intertouring (Rio Carnaval, Riotur, domínio público) e quadros dos vídeos da Intertouring. Créditos em `docs/ASSET_SOURCES.md` e no fim da página de história. Ao trocar uma foto, suba `IMG_V` em `tools/build_pages.py` e em `assets/js/main.js`: o Cloudflare guarda as imagens em cache, e só um endereço novo garante a versão nova.
4. Mapa 3D: os textos dos setores vêm do mapa oficial da LIESA e ficam em `tools/build_pages.py` (`SAMB_*`). Os contornos vêm do OpenStreetMap: `python3 tools/osm_sambodromo.py` refaz o arquivo de dados (precisa de internet). O crédito ao OpenStreetMap fica sob o mapa, como pede a licença ODbL.
5. História do Carnaval: o texto é o do documento da Intertouring (21 páginas) e fica em `tools/build_pages.py` (`HIST`, `HIST_PARTS`), com as fotos e os créditos (`PHOTOS`, `HIST_SCENES`) e as leituras (`HIST_SOURCES`).
   - Fotos: originais em `assets-src/doc/` (fora do repositório); `node tools/build-images.mjs` gera a foto de cada capítulo (`HIST_FIGS`) e as que fazem de cena (`HIST_STILLS`).
   - Vídeos: trechos dos vídeos reais (`assets-src/doc/videos`), cortados sem recodificar e codificados no servidor por `tools/encode_historia.sh` (H.264 sem áudio, 30 fps, cada cena em loop sem emenda: o último segundo se dissolve no primeiro).
   - Ao trocar fotos ou vídeos da história, suba `HIST_MEDIA_V` em `tools/build_pages.py` para os navegadores buscarem os arquivos novos.

Pré-visualização local, opcional (gera as páginas nesta máquina):

```bash
python3 tools/build_pages.py && python3 -m http.server 8000
```

## Publicar

```bash
./deploy.sh
```

O script confere se está tudo commitado e envia ao GitHub. Depois, no servidor:
1. busca o commit publicado e fica nele (`git checkout --detach`);
2. guarda a imagem atual para reverter e constrói a nova (as páginas são geradas aqui), com o container antigo ainda no ar;
3. testa o nginx;
4. troca o container e confirma que o proxy o alcança.

### Servidor

- **IntertouringReceptivo-SV2** (Lightsail, São Paulo), `ubuntu@18.228.132.38`, chave `~/.ssh/id_ed25519`, desde 26/10/2026. O código fica em `/opt/page.intertouring.tur.br` (do root, fixo no commit publicado; use `sudo`). A cada publicação, a imagem anterior fica como `page-intertouring:rollback-<data>`.
- A VPS antiga, `76.13.66.63`, não recebe mais o tráfego do domínio. Não publique lá.
- O container `page-intertouring-web` (nginx:alpine) roda na rede Docker `nginx-proxy`, sem porta exposta no host. Na imagem entram só as páginas geradas, `assets/`, `robots.txt` e `sitemap.xml`.
- Entrada pelo **Nginx Proxy Manager**, com um Proxy Host:
  - Domains: `carnaval.intertouring.tur.br` e `page.intertouring.tur.br` (este só para redirecionar)
  - Scheme: `http`, Forward Hostname: `page-intertouring-web`, Port: `80`
  - Block Common Exploits: ligado
  - SSL: Let's Encrypt, Force SSL, HTTP/2

### DNS

O domínio `intertouring.tur.br` usa nameservers do Cloudflare. Os registros **A `carnaval`** e **A `page`** apontam para a SV2 (18.228.132.38), com proxy do Cloudflare, como os demais subdomínios. O Cloudflare guarda em cache os arquivos estáticos: depois de remover um arquivo, ele some do endereço público só quando o cache expira, ou com um "Purge" no painel do Cloudflare.

## Documentos internos

Ficam fora do repositório, que é público: o catálogo exportado do Softtur, o brief, o registro das rodadas de revisão e as capturas (`docs/renders`). Estão listados no `.gitignore`.
