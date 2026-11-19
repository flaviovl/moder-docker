# Variantes

Comparações isoladas, fora da sequência de tags. Para buildar, de dentro de `project/`:

```sh
docker buildx bake -f variants/docker-bake.hcl            # todas (menos python-dhi)
docker buildx bake -f variants/docker-bake.hcl python-pip # uma
```

| Variante | Demonstra | Igual a |
|---|---|---|
| `next-single-stage` | Next.js em estágio único, com as dependências de desenvolvimento | frontend da tag `01` |
| `next-multistage-prod-deps` | Multi-stage com só as dependências de produção: menor, mas ainda grande | frontend da tag `04` |
| `next-standalone` | `output: "standalone"` sobre `node:26-slim` | frontend da tag `07` |
| `next-static-nginx` | Export estático servido por Nginx; as partes de servidor ficam de fora | |
| `go-golang-image` | O binário rodando sobre a própria imagem do Go | |
| `go-distroless-static` | Multi-stage com `distroless/static:nonroot` | worker da tag `07` |
| `apt-cleanup-separate-run` | Limpeza do apt num `RUN` separado: a imagem não diminui | |
| `apt-cleanup-same-run` | Limpeza no mesmo `RUN` do install | |
| `apt-update-stale-cache` | `apt-get update` inalterado vem do cache, com a lista velha | |
| `python-pip` | A API com pip e venv sobre a slim (glibc) | |
| `python-alpine` | A mesma API sobre Alpine (musl), para comparar build, tamanho e `benchmark.py` | |
| `python-uv` | A API com uv sobre a slim, o padrão do projeto | API da tag `07` |
| `python-dhi` | A API sobre a Docker Hardened Image de Python; exige `docker login dhi.io`, e a DHI não tem apt para a `libpq5` | |
| `postgres-anonymous-volume` | Postgres sem volume nomeado, para ver o que acontece com os dados ao trocar a versão | |

O `benchmark.py` da API roda dentro das imagens `python-pip` e `python-alpine`:

```sh
docker run --rm variant/python-pip python benchmark.py
```
