# syntax=docker/dockerfile:1
# Base da API nos três Dockerfiles (Dockerfile, Dockerfile.dev e Dockerfile.test): python:3.15.2-slim.

FROM python:3.15.2-slim AS build
COPY --from=ghcr.io/astral-sh/uv:0.13.9 /uv /bin/
WORKDIR /app
# Sem o docker-clean, o apt guarda os pacotes baixados e o cache mount passa a ter efeito.
RUN rm -f /etc/apt/apt.conf.d/docker-clean
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked,id=api-apt-cache \
    --mount=type=cache,target=/var/lib/apt,sharing=locked,id=api-apt-lib \
    apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=0
# Os pacotes baixados ficam no cache mount (fora da imagem); o lockfile entra por bind mount
# e o token do índice privado por secret mount, que existe só durante este RUN.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=secret,id=pypi,env=UV_INDEX_PRIVADO_PASSWORD \
    uv sync --frozen --no-install-project --no-dev

# O runtime recebe só a venv pronta; compilador e cabeçalhos ficam no estágio de build.
FROM python:3.15.2-slim AS runtime
# A slim não traz a libpq: o runtime instala só a biblioteca, sem compilador nem cabeçalhos.
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 10001 app
WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY . .
ENV PATH="/app/.venv/bin:$PATH"
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --start-period=20s --start-interval=1s --timeout=3s \
    CMD ["python", "-m", "app.health"]
# Exec form: o uvicorn é o PID 1 e recebe o SIGTERM do docker stop (no shell form, o sh não repassa).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
