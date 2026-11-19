# syntax=docker/dockerfile:1
FROM python:3.15.2 AS build
COPY --from=ghcr.io/astral-sh/uv:0.13.9 /uv /bin/
WORKDIR /app
ARG PYPI_TOKEN
# Instalar e limpar no mesmo RUN: apagar num RUN seguinte não tira nada da camada anterior.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*
# Só os arquivos de dependências: mudar o código não invalida esta camada.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# O runtime recebe só a venv pronta; compilador e cabeçalhos ficam no estágio de build.
FROM python:3.15.2 AS runtime
WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY . .
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port 8000
