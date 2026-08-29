# Render Dockerfile — alternative to native Node service.
# Use this if you prefer Docker deploys: `render.yaml` type: web + env: docker

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
COPY vendor ./vendor
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts
COPY tsconfig*.json tsdown.config.ts ./
# pnpm postinstall tries to install lefthook (needs git) and spawn helper;
# git is now available, and scripts/ is present for install-lefthook.mjs.
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:22-bookworm-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
COPY --from=build /app .
EXPOSE 10000
ENV DSH_HOME=/data/.dsh
# Render provides $PORT at runtime; harness binds 0.0.0.0:$PORT automatically
CMD ["pnpm", "dsh", "web", "--no-open"]
