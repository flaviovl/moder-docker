#!/usr/bin/env bash
# Adiciona uma biblioteca a um serviço, mudando só o manifesto e o lockfile no host, com o gerenciador
# de pacotes rodando num contêiner (sem Node, uv ou Go instalados). Com o Watch ligado, o lockfile novo
# dispara o rebuild do serviço. Uso: scripts/add-lib.sh <api|frontend|worker> <pacote>
set -euo pipefail
raiz=$(cd "$(dirname "$0")/.." && pwd)
[[ $# -eq 2 ]] || { echo "uso: $0 <api|frontend|worker> <pacote>" >&2; exit 1; }
servico=$1 pacote=$2
rodar() {
  docker run --rm --user "$(id -u):$(id -g)" --tmpfs /tmp:exec,mode=1777 -e HOME=/tmp \
    -v "$raiz/$servico:/src" -w /src "$@"
}
case $servico in
  api)
    rodar -e UV_CACHE_DIR=/tmp/uv -e UV_PYTHON_DOWNLOADS=0 ghcr.io/astral-sh/uv:0.13.9-python3.15-trixie-slim \
      uv add --no-sync "$pacote" ;;
  frontend)
    rodar node:26.13.1-slim sh -c \
      'npm install -g --prefix /tmp/npm pnpm@12.21.0 >/dev/null && /tmp/npm/bin/pnpm add --lockfile-only "$0"' "$pacote" ;;
  worker)
    rodar -e GOPATH=/tmp/go -e GOCACHE=/tmp/go-build golang:1.27.4 go get "$pacote" ;;
  *)
    echo "serviço desconhecido: $servico" >&2; exit 1 ;;
esac
