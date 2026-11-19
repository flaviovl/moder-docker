# syntax=docker/dockerfile:1
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
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD node server.js
