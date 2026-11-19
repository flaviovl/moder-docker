# syntax=docker/dockerfile:1
FROM python:3.15.2 AS build
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
FROM python:3.15.2 AS runtime
WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY . .
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port 8000
