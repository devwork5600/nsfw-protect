# syntax=docker/dockerfile:1
# Build context: monorepo root (nsfw-protect-v2/)
# Railway: Root Directory = nsfw-protect-v2/  |  Dockerfile Path = apps/api/Dockerfile

FROM node:22-slim AS base
WORKDIR /app

# ── 1. All dependencies (dev + prod) ─────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY packages/db/package.json      ./packages/db/
COPY packages/redis/package.json   ./packages/redis/
COPY packages/storage/package.json ./packages/storage/
COPY apps/api/package.json         ./apps/api/
RUN npm ci --ignore-scripts

# ── 2. Build packages + API ───────────────────────────────────────────────────
FROM deps AS builder
# Dummy DATABASE_URL so prisma generate doesn't complain during codegen
ARG DATABASE_URL=postgresql://x:x@localhost/x
ENV DATABASE_URL=$DATABASE_URL

COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build in dependency order
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=packages/redis
RUN npm run build --workspace=packages/storage
RUN npm run build --workspace=apps/api

# ── 3. Production dependencies only ──────────────────────────────────────────
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY packages/db/package.json      ./packages/db/
COPY packages/redis/package.json   ./packages/redis/
COPY packages/storage/package.json ./packages/storage/
COPY apps/api/package.json         ./apps/api/
RUN npm ci --omit=dev --ignore-scripts

# ── 4. Runtime image ──────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Production node_modules (with workspace symlinks intact)
COPY --from=prod-deps /app/node_modules            ./node_modules
# Generated Prisma client (produced by prisma generate in builder)
COPY --from=builder   /app/node_modules/.prisma    ./node_modules/.prisma

# Package compiled artifacts — workspace symlinks resolve through these
COPY --from=builder /app/packages/db/dist          ./packages/db/dist
COPY --from=builder /app/packages/db/package.json  ./packages/db/package.json
COPY --from=builder /app/packages/redis/dist       ./packages/redis/dist
COPY --from=builder /app/packages/redis/package.json ./packages/redis/package.json
COPY --from=builder /app/packages/storage/dist     ./packages/storage/dist
COPY --from=builder /app/packages/storage/package.json ./packages/storage/package.json

# API compiled output
COPY --from=builder /app/apps/api/dist             ./apps/api/dist
COPY --from=builder /app/apps/api/package.json     ./apps/api/package.json
COPY --from=builder /app/package.json              ./

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
