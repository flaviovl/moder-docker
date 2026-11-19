# syntax=docker/dockerfile:1
FROM node:26.13.1 AS deps
ENV PNPM_HOME=/pnpm
RUN npm install -g pnpm@12.21.0
WORKDIR /app
# Só os arquivos de dependências: mudar o código não invalida esta camada.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

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
