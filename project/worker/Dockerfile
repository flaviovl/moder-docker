# syntax=docker/dockerfile:1
FROM golang:1.27.4 AS build
WORKDIR /app
# Só os arquivos de dependências: mudar o código não invalida esta camada.
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /out/worker .

# O runtime recebe só o binário, mas continua sobre a imagem inteira do Go.
FROM golang:1.27.4 AS runtime
COPY --from=build /out/worker /usr/local/bin/worker
CMD worker
