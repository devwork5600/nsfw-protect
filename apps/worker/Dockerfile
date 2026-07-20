# syntax=docker/dockerfile:1
# Build context: monorepo root (nsfw-protect-v2/)
# Railway: Root Directory = nsfw-protect-v2/  |  Dockerfile Path = apps/worker/Dockerfile

FROM node:22 AS base
WORKDIR /app

# ── 1. All dependencies (dev + prod) ─────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY packages/db/package.json      ./packages/db/
COPY packages/redis/package.json   ./packages/redis/
COPY packages/storage/package.json ./packages/storage/
COPY apps/worker/package.json      ./apps/worker/
RUN npm ci --ignore-scripts

# ── 2. Pre-download the NSFW model (separate stage for Docker layer caching) ──
# This layer is only invalidated when packages change, not source code.
FROM deps AS model-cache
ENV MODEL_CACHE_DIR=/app/.cache
RUN node --input-type=module <<'EOF'
import { pipeline, env } from '@xenova/transformers';
env.cacheDir = '/app/.cache';
env.allowRemoteModels = true;
console.log('[docker] Downloading AdamCodd/vit-base-nsfw-detector...');
await pipeline('image-classification', 'AdamCodd/vit-base-nsfw-detector');
console.log('[docker] Model cached.');
process.exit(0);
EOF

# ── 3. Build worker ───────────────────────────────────────────────────────────
FROM deps AS builder
ARG DATABASE_URL=postgresql://x:x@localhost/x
ENV DATABASE_URL=$DATABASE_URL

COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/

RUN npm run build --workspace=packages/db
RUN npm run build --workspace=packages/redis
RUN npm run build --workspace=packages/storage
RUN npm run build --workspace=apps/worker

# ── 4. Production dependencies only ──────────────────────────────────────────
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY packages/db/package.json      ./packages/db/
COPY packages/redis/package.json   ./packages/redis/
COPY packages/storage/package.json ./packages/storage/
COPY apps/worker/package.json      ./apps/worker/
RUN npm ci --omit=dev --ignore-scripts

# ── 5. Runtime image ──────────────────────────────────────────────────────────
FROM node:22 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV MODEL_CACHE_DIR=/app/.cache

# Production node_modules (with workspace symlinks intact)
COPY --from=prod-deps /app/node_modules            ./node_modules
# Generated Prisma client
COPY --from=builder   /app/node_modules/.prisma    ./node_modules/.prisma

# Pre-baked model (avoids cold-start download)
COPY --from=model-cache /app/.cache                ./.cache

# Package compiled artifacts
COPY --from=builder /app/packages/db/dist          ./packages/db/dist
COPY --from=builder /app/packages/db/package.json  ./packages/db/package.json
COPY --from=builder /app/packages/redis/dist       ./packages/redis/dist
COPY --from=builder /app/packages/redis/package.json ./packages/redis/package.json
COPY --from=builder /app/packages/storage/dist     ./packages/storage/dist
COPY --from=builder /app/packages/storage/package.json ./packages/storage/package.json

# Worker compiled output
COPY --from=builder /app/apps/worker/dist          ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json  ./apps/worker/package.json
COPY --from=builder /app/package.json              ./

CMD ["node", "apps/worker/dist/worker.js"]
