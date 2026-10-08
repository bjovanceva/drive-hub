FROM node:24-bookworm-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
# Client generation needs a URL, but neither step connects to a database.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run db:generate \
    && NITRO_PRESET=node-server npm run build

# Prisma CLI and administrator commands are kept out of the app image.
FROM dependencies AS tooling
ENV NODE_ENV=production
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY scripts ./scripts
COPY docker/entrypoint.sh /usr/local/bin/drivehub-entrypoint
USER node
ENTRYPOINT ["sh", "/usr/local/bin/drivehub-entrypoint"]
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/.output ./.output
COPY docker/entrypoint.sh /usr/local/bin/drivehub-entrypoint
USER node
EXPOSE 3000
ENTRYPOINT ["sh", "/usr/local/bin/drivehub-entrypoint"]
CMD ["node", ".output/server/index.mjs"]
