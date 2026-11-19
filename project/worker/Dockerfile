# syntax=docker/dockerfile:1
FROM golang:1.27.4 AS build
WORKDIR /app
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=bind,source=go.mod,target=go.mod \
    --mount=type=bind,source=go.sum,target=go.sum \
    go mod download
# O código entra por bind mount, nunca vira camada; os caches do Go ficam fora da imagem.
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=bind,target=. \
    go build -o /out/worker .

# O runtime recebe só o binário, mas continua sobre a imagem inteira do Go.
FROM golang:1.27.4 AS runtime
COPY --from=build /out/worker /usr/local/bin/worker
CMD worker
