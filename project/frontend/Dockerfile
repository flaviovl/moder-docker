# syntax=docker/dockerfile:1
# Base do frontend nos três Dockerfiles (Dockerfile, Dockerfile.dev e Dockerfile.test): node:26.13.1-slim.

FROM node:26.13.1-slim AS deps
# Com PNPM_HOME=/pnpm, o store do pnpm fica em /pnpm/store (conferido com pnpm store path).
ENV PNPM_HOME=/pnpm
RUN npm install -g pnpm@12.21.0
WORKDIR /app
# O fetch só precisa do lockfile; os pacotes ficam no cache mount, fora da imagem.
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm/store,id=pnpm-store pnpm fetch
COPY package.json ./
RUN --mount=type=cache,target=/pnpm/store,id=pnpm-store pnpm install --frozen-lockfile --offline

FROM deps AS build
COPY . .
# standalone: o Next copia para .next/standalone só o servidor e as dependências que ele usa.
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
RUN pnpm build

FROM node:26.13.1-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --start-period=20s --start-interval=1s --timeout=3s \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
# Exec form chamando o node direto: com npm start, o npm ficaria como PID 1 e não repassaria o SIGTERM.
CMD ["node", "server.js"]
