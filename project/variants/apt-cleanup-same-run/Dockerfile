# syntax=docker/dockerfile:1
# Instalar e limpar no mesmo RUN: a lista de pacotes nunca chega a uma camada.
FROM python:3.15.2-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
