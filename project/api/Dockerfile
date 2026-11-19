# syntax=docker/dockerfile:1
# Um Dockerfile, três alvos: dev, test e runtime (produção, o último e o padrão). Base: python:3.15.2-slim.

FROM python:3.15.2-slim AS base
COPY --from=ghcr.io/astral-sh/uv:0.13.9 /uv /bin/
ENV UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=0
WORKDIR /app

FROM base AS build-tools
# Sem o docker-clean, o apt guarda os pacotes baixados e o cache mount passa a ter efeito.
RUN rm -f /etc/apt/apt.conf.d/docker-clean
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked,id=api-apt-cache \
    --mount=type=cache,target=/var/lib/apt,sharing=locked,id=api-apt-lib \
    apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev

# Dependências completas, com as de desenvolvimento: base comum de dev e test.
FROM build-tools AS deps-dev
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project
ENV PATH="/app/.venv/bin:$PATH"

FROM deps-dev AS dev
# O Watch só sincroniza o que muda depois da subida: o código já precisa estar na imagem.
COPY . .
CMD ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]

FROM deps-dev AS test
COPY . .
# Testes de unidade no build: se falharem, a imagem nem é gerada.
RUN pytest -m unit -q
CMD ["pytest", "-m", "integration", "-q"]

FROM build-tools AS build
ENV UV_COMPILE_BYTECODE=1
# O token do índice privado entra por secret mount, que existe só durante este RUN.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=secret,id=pypi,env=UV_INDEX_PRIVADO_PASSWORD \
    uv sync --frozen --no-install-project --no-dev

FROM python:3.15.2-slim AS runtime
# A slim não traz a libpq: o runtime instala só a biblioteca, sem compilador nem cabeçalhos.
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 10001 app
WORKDIR /app
COPY --from=build /app/.venv /app/.venv
# O contexto é o mesmo dos três alvos (inclui os testes): o runtime copia só o que roda.
COPY app ./app
COPY config ./config
ENV PATH="/app/.venv/bin:$PATH"
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --start-period=20s --start-interval=1s --timeout=3s \
    CMD ["python", "-m", "app.health"]
# Exec form: o uvicorn é o PID 1 e recebe o SIGTERM do docker stop (no shell form, o sh não repassa).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
