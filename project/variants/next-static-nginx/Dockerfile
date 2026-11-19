# syntax=docker/dockerfile:1
FROM node:26.13.1-slim AS build
ENV PNPM_HOME=/pnpm NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@12.21.0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm/store,id=pnpm-store pnpm install --frozen-lockfile
COPY . .
# O export estático não tem servidor: saem as rotas de API, a rota de saúde e a página renderizada no servidor.
RUN rm -rf src/app/api src/app/healthz src/app/status
ENV NEXT_OUTPUT=export
RUN pnpm build

# Só HTML, CSS e JS servidos pelo Nginx, sem root; o /api é repassado para a API.
FROM nginxinc/nginx-unprivileged:1.31-alpine AS runtime
COPY --from=variant nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
