# syntax=docker/dockerfile:1
FROM golang:1.27.4
WORKDIR /app
# Só os arquivos de dependências: mudar o código não invalida esta camada.
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o worker .
CMD ./worker
