# syntax=docker/dockerfile:1
# Estágio único: o node_modules inteiro, com as dependências de desenvolvimento, vai para a imagem.
FROM node:26.13.1
ENV PNPM_HOME=/pnpm NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@12.21.0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
