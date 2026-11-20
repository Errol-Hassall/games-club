# syntax=docker/dockerfile:1

FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1 AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/data/games-club.db
WORKDIR /app
RUN mkdir -p /data
COPY --from=build /app/.output /app/.output
EXPOSE 3000
VOLUME ["/data"]
CMD ["bun", "run", "/app/.output/server/index.mjs"]
