# syntax=docker/dockerfile:1
# A limpeza num RUN separado: a lista de pacotes já ficou gravada na camada do update.
FROM python:3.15.2-slim
RUN apt-get update
RUN apt-get install -y --no-install-recommends build-essential libpq-dev
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
