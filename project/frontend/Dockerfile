# syntax=docker/dockerfile:1
FROM node:26.13.1
ENV PNPM_HOME=/pnpm
RUN npm install -g pnpm@12.21.0
WORKDIR /app
# Só os arquivos de dependências: mudar o código não invalida esta camada.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD pnpm start
