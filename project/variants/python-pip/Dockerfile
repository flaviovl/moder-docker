# syntax=docker/dockerfile:1
# A API com pip e venv sobre a slim (glibc); o requirements.txt sai do mesmo uv.lock do projeto.
FROM ghcr.io/astral-sh/uv:0.13.9-python3.15-trixie-slim AS requirements
WORKDIR /src
COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev --no-hashes --no-emit-project -o /requirements.txt

FROM python:3.15.2-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*
RUN python -m venv /venv
COPY --from=requirements /requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip /venv/bin/pip install -r requirements.txt

FROM python:3.15.2-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && rm -rf /var/lib/apt/lists/*
COPY --from=build /venv /venv
WORKDIR /app
COPY app ./app
COPY config ./config
COPY benchmark.py ./
ENV PATH="/venv/bin:$PATH"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
