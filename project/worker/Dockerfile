# syntax=docker/dockerfile:1
# Um Dockerfile, três alvos: dev, test e runtime (produção, o último e o padrão). Build: golang:1.27.4.

# O build roda na arquitetura da máquina e compila para a de destino, sem emulação.
FROM --platform=$BUILDPLATFORM golang:1.27.4 AS base
WORKDIR /src

# Sem cache mount aqui: os módulos precisam ficar na imagem, porque go run e go test rodam no contêiner.
FROM base AS deps
COPY go.mod go.sum ./
RUN go mod download

FROM deps AS dev
COPY . .
CMD ["go", "run", "."]

FROM deps AS test
COPY . .
CMD ["go", "test", "./..."]

FROM base AS build
ARG TARGETOS TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=bind,source=go.mod,target=go.mod \
    --mount=type=bind,source=go.sum,target=go.sum \
    go mod download
# O código entra por bind mount, nunca vira camada; os caches do Go ficam fora da imagem.
# CGO_ENABLED=0 gera um binário estático, que roda sem libc.
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=bind,target=. \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /out/worker .

# Distroless static: só certificados, fuso horário e /etc/passwd, sem shell; nonroot roda como 65532.
FROM gcr.io/distroless/static-debian13:nonroot@sha256:aafe993665bf6200db38a02c11a9351e782a84b6a45e7f33b6695638c88e3931 AS runtime
COPY --from=build /out/worker /worker
# Sem shell na imagem, o shell form nem funcionaria: o exec form é obrigatório aqui.
CMD ["/worker"]
