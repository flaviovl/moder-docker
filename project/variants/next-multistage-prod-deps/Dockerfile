# syntax=docker/dockerfile:1
FROM node:26.13.1 AS deps
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
RUN pnpm build

# O runtime leva só as dependências de produção: o build precisa das de desenvolvimento, o runtime não.
FROM deps AS prod-deps
RUN pnpm prune --prod

FROM node:26.13.1 AS runtime
ENV PNPM_HOME=/pnpm
RUN npm install -g pnpm@12.21.0
WORKDIR /app
COPY package.json next.config.ts ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD pnpm start
