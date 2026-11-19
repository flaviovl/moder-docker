# syntax=docker/dockerfile:1
# A mesma API da python-pip sobre Alpine (musl): mudam a base e o gerenciador de pacotes do sistema.
FROM ghcr.io/astral-sh/uv:0.13.9-python3.15-trixie-slim AS requirements
WORKDIR /src
COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev --no-hashes --no-emit-project -o /requirements.txt

FROM python:3.15.2-alpine AS build
RUN apk add --no-cache build-base libpq-dev
RUN python -m venv /venv
COPY --from=requirements /requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip /venv/bin/pip install -r requirements.txt

FROM python:3.15.2-alpine AS runtime
RUN apk add --no-cache libpq
COPY --from=build /venv /venv
WORKDIR /app
COPY app ./app
COPY config ./config
COPY benchmark.py ./
ENV PATH="/venv/bin:$PATH"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
