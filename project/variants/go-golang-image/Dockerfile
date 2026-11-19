# syntax=docker/dockerfile:1
# O binário roda sobre a própria imagem do Go: compilador e ferramentas vão junto para produção.
FROM golang:1.27.4
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /usr/local/bin/worker .
CMD ["worker"]
