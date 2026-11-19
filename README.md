# Docker moderno: repositório de demonstração

Um painel de leituras de sensores com três serviços, cada um numa stack diferente. Os Dockerfiles e o compose evoluem do "jeito ingênuo" até o jeito atual, uma tag Git por passo. O repositório serve para três coisas:

1. **Fonte dos números** de uma apresentação sobre Docker moderno: tempo de build, tamanho de imagem, camadas, CVEs, tempo de feedback e comportamento em execução saem de medições feitas aqui.
2. **Guia de reprodução:** quem clona consegue refazer cada passo e conferir os números.
3. **Exemplo de referência:** Dockerfiles e compose para Next.js, Python e Go.

**Tese: a imagem é consequência de como a stack faz o build.** Por isso cada serviço mostra o maior ganho numa dimensão diferente:

| Serviço | Stack | Onde o ganho é maior |
|---|---|---|
| `frontend` | Next.js com pnpm | Tamanho da imagem |
| `api` | FastAPI com uv, pandas e `psycopg[c]` | Tempo de build e uso de cache |
| `worker` | Go com pgx | Imagem mínima e build multiplataforma |

## A aplicação

- **worker** (Go): grava leituras sintéticas (sensor, valor, data e hora) no Postgres a cada poucos segundos. O driver pgx é Go puro, o que permite `CGO_ENABLED=0` e binário estático.
- **api** (Python): FastAPI com `/health` (não consulta o banco), `/readings`, `/stats` (estatísticas com pandas) e `/info`. O `psycopg[c]` compila contra a libpq, o que justifica um estágio de build com `build-essential`.
- **frontend** (Next.js): tabela e gráfico das estatísticas, com busca de dados no cliente. A página `/status` é renderizada no servidor e `/healthz` é a rota de saúde. O formato de saída vem de `NEXT_OUTPUT` (`standalone` ou `export`), em `project/frontend/next.config.ts`.
- **db**: Postgres 18, com o schema em `project/db/init.sql`.

## Estrutura

Tudo o que roda fica em `project/`. Os comandos abaixo partem de lá, salvo indicação.

```
project/
├── compose.yaml            # produção (inclui compose.debug.yaml)
├── compose.debug.yaml      # pgAdmin, só com --profile debug
├── compose.dev.yaml        # desenvolvimento, com Compose Watch
├── compose.test.yaml       # testes, com banco descartável em tmpfs
├── .env.example            # token falso para as demonstrações de segredo
├── .devcontainer/
├── api/                    # Dockerfile com alvos dev, test e runtime
├── frontend/               # idem
├── worker/                 # idem
├── db/init.sql
├── secrets/                # db_password.txt (fora do Git)
├── scripts/add-lib.sh      # adiciona dependência sem ter a ferramenta no host
└── variants/               # comparações isoladas, fora da sequência de tags
```

## Pré-requisitos

- Docker Engine com BuildKit, o plugin Docker Compose e o Buildx. Testado com Engine 29.9.3, Compose 5.7.1 e Buildx 0.39.0.
- Git.
- Opcionais: [dive](https://github.com/wagoodman/dive) e [Trivy](https://trivy.dev).

## Preparação

```sh
cd project
cp .env.example .env
printf 'troque-esta-senha' > secrets/db_password.txt
```

O `PYPI_TOKEN` do `.env.example` é falso. Ele existe só para mostrar a diferença entre passar segredo por `ARG` e por secret mount. O `.env` e o `secrets/db_password.txt` ficam fora do Git e continuam no lugar quando você troca de tag.

Para não medir o download das imagens base junto com o build, baixe-as antes:

```sh
for img in python:latest node:latest golang:latest postgres:18 \
  python:3.15.2 python:3.15.2-slim python:3.15.2-alpine \
  node:26.13.1 node:26.13.1-slim golang:1.27.4 \
  ghcr.io/astral-sh/uv:0.13.9 ghcr.io/astral-sh/uv:0.13.9-python3.15-trixie-slim \
  gcr.io/distroless/static-debian13:nonroot@sha256:aafe993665bf6200db38a02c11a9351e782a84b6a45e7f33b6695638c88e3931 \
  nginxinc/nginx-unprivileged:1.31-alpine postgres:18.7 dpage/pgadmin4:9.19 docker/dockerfile:1; do
  docker pull "$img"
done
```

Um build a frio continua precisando de rede para baixar os pacotes de pnpm, uv, Go e apt.

## As três linhas

No estado final (branch `main`), cada serviço tem um único Dockerfile multi-stage com os alvos `dev`, `test` e `runtime`, e cada compose escolhe o seu com `target:`.

### Produção

```sh
docker compose up --wait
```

Sobe o banco, a API, o worker e o frontend. `--wait` só retorna quando todos estão `healthy`. O painel fica em http://127.0.0.1:3000. A API e o banco não publicam porta. A senha do banco chega aos serviços via `secrets`.

Para depurar o banco com o pgAdmin (http://127.0.0.1:5050, usuário `admin@example.com`, senha igual à do banco):

```sh
docker compose --profile debug up --wait
```

### Desenvolvimento

```sh
docker compose -f compose.dev.yaml watch
```

O Watch sincroniza o código para dentro dos contêineres: o `uvicorn --reload` e o `next dev` aplicam a mudança sem rebuild, e o worker reinicia com `go run`. Mudar o lockfile refaz a imagem do serviço. As regras estão em `develop.watch` de cada serviço em `compose.dev.yaml`. A API fica em http://127.0.0.1:8000 e o frontend em http://127.0.0.1:3000.

Para adicionar uma dependência sem ter Node, uv ou Go no host (o Watch pega o lockfile novo e refaz a imagem):

```sh
scripts/add-lib.sh api httpx
```

O `.devcontainer/devcontainer.json` abre o projeto com Node e pnpm, Python e uv, Go e acesso ao Docker do host. Quem usa o Dev Container só precisa do Docker e do editor.

### Teste

```sh
docker compose -f compose.test.yaml up --abort-on-container-exit --exit-code-from tests
docker compose -f compose.test.yaml down
```

O banco de teste guarda os dados em `tmpfs` e não publica porta. O serviço `tests` espera o banco ficar saudável e roda os testes de integração da API. Os testes de unidade rodam antes, no build (`RUN pytest -m unit`): se falharem, a imagem nem é gerada. O código de saída do comando é o da suíte.

O frontend (lint e checagem de tipos) e o worker (`go test`) também têm alvo `test`:

```sh
docker build --target test -t frontend-test frontend && docker run --rm frontend-test
docker build --target test -t worker-test worker && docker run --rm worker-test
```

### Arquivos separados ou alvos

As tags `09-linha-dev` e `10-linha-teste` usam um arquivo por ambiente (`Dockerfile`, `Dockerfile.dev`, `Dockerfile.test`). A `11-targets` junta os três num Dockerfile por serviço, com os estágios herdando de um estágio comum de dependências. Para comparar:

```sh
git diff 10-linha-teste 11-targets -- api compose.dev.yaml compose.test.yaml
```

## Evolução em etapas

Cada passo é uma tag. Para percorrer, a partir da raiz do repositório:

```sh
git switch --detach 00-inicial
# ... build, medição ...
git switch main
```

Este README só existe na `main`. Ao trocar de tag, acompanhe por aqui no GitHub.

| Tag | O que muda | O que observar |
|---|---|---|
| `base-sem-docker` | Só o código da aplicação, sem Dockerfile nem compose. | Ponto de partida para gerar Dockerfiles do zero, por exemplo com uma IA. |
| `00-inicial` | Os defeitos típicos de arquivos herdados: `FROM ...:latest`, estágio único, `COPY . .` antes das dependências, sem `.dockerignore`, `apt-get update`, `install` e limpeza em três `RUN`, token por `ARG`, execução como root, `CMD` em shell form, `npm install` e `npm start` no frontend. No compose: `docker-compose.yml` com `version:`, senha no YAML, porta 5432 publicada, `depends_on` sem condição e o volume do Postgres no caminho antigo. | O token aparece em `docker history --no-trunc`. O banco para logo depois de iniciar, por causa do volume em `/var/lib/postgresql/data`. |
| `01-sintaxe-e-contexto` | `# syntax=docker/dockerfile:1`, bases fixadas por versão, lockfile copiado antes do código e `.dockerignore` em cada serviço. A API passa para uv e o frontend para pnpm. | Mudar só o código não reinstala dependências (`CACHED` no `--progress=plain`). O contexto enviado ao builder encolhe. |
| `02-multi-stage` | Build e runtime separados, ainda sobre a mesma base. | O runtime da API perde o compilador; o worker ainda roda sobre a imagem inteira do Go. |
| `03-camadas-limpas` | Na API, apt num `RUN` só, com `--no-install-recommends`. | A camada do apt diminui. Limpar num `RUN` separado não reduz nada (ver a variante `apt-cleanup-separate-run`). |
| `04-cache-mounts` | Cache mounts para apt, uv, pnpm e Go; lockfile e código do Go entram por bind mount. | Adicionar uma dependência não baixa tudo de novo. O código do worker não vira camada. |
| `05-secret-mount` | O token sai do `ARG` e entra por `RUN --mount=type=secret`. O compose passa o segredo em `build.secrets`. | O token some do `docker history`. |
| `06-imagem-base` | API em `python:3.15.2-slim`, Next.js em `output: "standalone"`, worker em distroless `static:nonroot` com compilação cruzada a partir de `$BUILDPLATFORM`. | A maior queda de tamanho da sequência, diferente em cada stack. |
| `07-seguranca-e-sinais` | Usuário não-root, `CMD` em exec form chamando o processo direto, `HEALTHCHECK` e `docker build --check` sem avisos. | `docker compose stop` termina rápido, porque o SIGTERM chega ao processo. |
| `08-producao` | `compose.yaml` de produção: sem `version:`, healthcheck no banco, `depends_on` com `condition: service_healthy`, volume em `/var/lib/postgresql`, senha via `secrets`, banco sem porta, pgAdmin no profile `debug` e `include`. | Primeira tag em que `docker compose up --wait` sobe tudo saudável. |
| `09-linha-dev` | `Dockerfile.dev` por serviço, `compose.dev.yaml` com Watch, Dev Container e `scripts/add-lib.sh`. | `docker compose -f compose.dev.yaml watch` aplica a mudança de código sem rebuild. |
| `10-linha-teste` | `Dockerfile.test` por serviço e `compose.test.yaml` com banco descartável e serviço `tests`. | O comando da linha Teste termina com código 0. |
| `11-targets` | Um Dockerfile por serviço com alvos `dev`, `test` e `runtime`; os composes apontam para eles. | Mesmo comportamento das tags 08 a 10, com menos arquivos. |

Depois da `11-targets`, a `main` acrescenta as variantes e o `api/benchmark.py`.

Até a `07`, o banco do compose não fica de pé (ver `00-inicial`), então compare os passos pelo build das imagens:

```sh
cd project
docker compose build
docker image inspect project-api -f '{{ .Size }}'
docker history project-api
```

O compose dá às imagens o nome da pasta (`project-api`, `project-frontend`, `project-worker`). Para comparar tags lado a lado, dê uma tag própria a cada build, por exemplo `docker build -t api:00-inicial api`.

Para medir um rebuild depois de mudar só o código:

```sh
echo '# mudança' >> api/app/main.py
time docker build -t api:teste api
git checkout -- api/app/main.py
```

Para um build a frio, limpe o cache do builder antes com `docker builder prune -af` e use `--no-cache`.

## Como investigar antes de otimizar

- `docker build --progress=plain <contexto>`: mostra o tempo de cada passo. Procure passos lentos sem `CACHED`; a linha `transferring context` mostra o tamanho do contexto.
- `docker history --no-trunc <imagem>`: o comando que criou cada camada e o tamanho dela.
- `dive <imagem>`: navega pelas camadas e mostra o que cada uma acrescentou.
- `docker build --check <contexto>`: avisos de boas práticas sem fazer o build.

## Variantes

Comparações isoladas, cada uma com seu Dockerfile, em `project/variants/`. A lista e o que cada uma demonstra estão em [`project/variants/README.md`](project/variants/README.md). Para buildar, de dentro de `project/`:

```sh
docker buildx bake -f variants/docker-bake.hcl              # todas, menos python-dhi
docker buildx bake -f variants/docker-bake.hcl python-pip   # uma
```

## Manutenção

O cache do BuildKit cresce sem limite se ninguém limpar.

```sh
docker system df                                 # espaço usado por imagens, contêineres, volumes e cache
docker buildx prune --filter until=48h           # remove cache sem uso há mais de 48 h
docker buildx prune --reserved-space 10GB        # mantém até 10 GB de cache
docker build --no-cache-filter runtime api       # refaz só o estágio runtime, sem cache
```

Um `RUN apt-get update` que não mudou vem do cache com a lista de pacotes antiga (variante `apt-update-stale-cache`). Por isso: `update` e `install` no mesmo `RUN`, e de tempos em tempos um build com `--pull --no-cache`.

## Referências

- Docker Docs, Dockerfile reference: https://docs.docker.com/reference/dockerfile/
- Docker Docs, Multi-stage builds: https://docs.docker.com/build/building/multi-stage/
- Docker Docs, Cache storage backends: https://docs.docker.com/build/cache/backends/
- Docker Docs, Build garbage collection: https://docs.docker.com/build/cache/garbage-collection/
- Docker Docs, guias por linguagem: https://docs.docker.com/guides/
- Astral, Using uv in Docker: https://docs.astral.sh/uv/guides/integration/docker/
- iximiuz Labs, Docker Multi-Stage Builds: https://labs.iximiuz.com/tutorials/docker-multi-stage-builds
- iximiuz Labs, What's Inside Distroless Container Images: https://labs.iximiuz.com/tutorials/gcr-distroless-container-images
- Python Speed, Using Alpine can make Python Docker builds 50× slower: https://pythonspeed.com/articles/alpine-docker-python/
- Depot, Optimal Dockerfiles: https://depot.dev/docs/container-builds/optimal-dockerfiles/overview
- Depot, The ultimate guide to Docker build cache: https://depot.dev/blog/ultimate-guide-to-docker-build-cache
- Depot, How to use cache mounts to speed up Docker builds: https://depot.dev/blog/how-to-use-cache-mount-to-speed-up-docker-builds
- Depot, How to reduce your Docker image size: https://depot.dev/blog/how-to-reduce-your-docker-image-size
- dive: https://github.com/wagoodman/dive
- Dev Containers: https://containers.dev

O blog da Depot é de uma plataforma paga; o repositório usa só o conteúdo técnico. Alguns exemplos desses artigos têm erros (comentário no fim da linha, cache mount em `node_modules`, apt em cache mount sem remover o `docker-clean`), corrigidos aqui.
