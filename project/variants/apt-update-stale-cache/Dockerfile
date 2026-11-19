# syntax=docker/dockerfile:1
# O texto do RUN do update não muda: no segundo build ele vem do cache, com a lista de pacotes do primeiro.
FROM python:3.15.2-slim
RUN apt-get update && date -u +%Y-%m-%dT%H:%M:%SZ > /apt-lists-updated-at
# Mudar este RUN (por exemplo, com --build-arg EXTRA=jq) não faz o update rodar de novo.
ARG EXTRA=""
RUN apt-get install -y --no-install-recommends curl $EXTRA
