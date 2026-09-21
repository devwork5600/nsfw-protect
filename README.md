# NSFW Protect

[![CI](https://github.com/devwork5600/nsfw-protect/actions/workflows/ci.yml/badge.svg)](https://github.com/devwork5600/nsfw-protect/actions/workflows/ci.yml)

Real-time NSFW image classification as an API, with a dashboard for API keys, usage, and
billing. Live at [nsfw-protect.com](https://nsfw-protect.com).

> Portfolio/demo project. Stripe runs in test mode in production on purpose — see
> [Payments](#payments-stripe-test-mode) below.

## Architecture

A monorepo (npm workspaces + Turborepo) with three deployable apps and five shared packages:

```
apps/
  web     — Next.js 16 (App Router): marketing site, auth, dashboard, billing. Deploys to Vercel.
  api     — Fastify: the public /classify endpoint, API-key auth, rate limiting, billing checks.
            Deploys to Railway.
  worker  — BullMQ worker: pulls jobs off the queue, runs the NSFW classifier, publishes results
            to Redis. Deploys to Railway.

packages/
  db      — Prisma schema + client (Postgres), shared by all three apps.
  auth    — Better Auth config (magic-link + Google/GitHub OAuth), used by apps/web.
  redis   — ioredis connection factory (Upstash-aware TLS detection), used by api/worker.
  storage — Cloudflare R2 (S3-compatible) client, used by api/worker.
  email   — Transactional email via Resend, used by packages/auth.
```

**Request flow for `/classify`:** the client uploads an image to the API → the API validates
the API key and quota, resizes the image, uploads it to R2, and enqueues a job on Redis
(BullMQ) → the worker picks up the job, downloads the image, runs it through
[`AdamCodd/vit-base-nsfw-detector`](https://huggingface.co/AdamCodd/vit-base-nsfw-detector)
(via `@xenova/transformers`, in-process — no external ML API), and writes the result back to
Redis → the API, which has been polling that Redis key, returns the result to the client. From
the caller's point of view it's a single synchronous HTTP call; internally it's a queue.

## Getting started locally

Requires Node 22 (pinned in `.nvmrc`; `engines` allows >=20) and a Postgres + Redis instance
(a local `docker run` of both works fine — no docker-compose file is checked in yet).

```bash
npm install                    # also builds packages/* (postinstall)
cp .env.example .env           # see Environment variables below — one shared .env at the repo root
npm run -w packages/db db:push # create the schema (or `prisma migrate deploy` in prod)
npm run dev                    # runs web + api + worker together via Turborepo
```

Default ports: `apps/web` on 3000, `apps/api` on 3001 (`PORT` env var to change it), `apps/worker`
has none — it's a queue consumer, not an HTTP server.

`apps/web` reads `apps/web/.env` if present, but `apps/api` and `apps/worker` load a single
`.env` at the **repo root** (`dotenv.config({ path: '../../.env' })`) — see
`apps/api/src/index.ts` / `apps/worker/src/worker.ts`.

## Environment variables

No `.env.example` is checked in yet — worth adding. Grouped by what actually reads each one:

**Database & queue (shared)**

| Variable       | Used by                            |
| -------------- | ---------------------------------- |
| `DATABASE_URL` | all three apps (via `packages/db`) |
| `REDIS_URL`    | `api`, `worker`                    |

**`apps/api`**

| Variable                                                                    | Purpose                                                           |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `PORT`                                                                      | listen port                                                       |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | uploaded-image storage                                            |
| `RATE_LIMIT_IP_PER_MIN`                                                     | global per-IP cap on `/classify` (default 300/min)                |
| `DEMO_RATE_LIMIT_MAX`                                                       | per-visitor cap on the homepage demo key (default 10/hour)        |
| `HOME_PAGE_API_KEY`                                                         | the shared key the homepage demo uses, bypassing per-user billing |
| `CLASSIFY_WAIT_TIMEOUT_MS`, `CLASSIFY_WAIT_POLL_MS`                         | how long `/classify` waits for the worker before returning 202    |

**`apps/worker`**

| Variable             | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `R2_*`               | same bucket as the API                       |
| `MODEL_CACHE_DIR`    | where the classifier model is cached on disk |
| `WORKER_CONCURRENCY` | BullMQ concurrent job count                  |
| `LOG_LEVEL`          | pino log level                               |

**`apps/web`**

| Variable                                                                                                 | Purpose                                                          |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`                                   | Better Auth                                                      |
| `GOOGLE_CLIENT_ID`/`_SECRET`, `GITHUB_CLIENT_ID`/`_SECRET`                                               | OAuth sign-in                                                    |
| `RESEND_API_KEY`, `EMAIL_FROM`                                                                           | transactional email (magic link, billing)                        |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY` | billing — **test-mode keys in production**, see below            |
| `INTERNAL_API_URL` / `NEXT_PUBLIC_API_URL`                                                               | where the web app finds `apps/api`                               |
| `HOME_PAGE_API_KEY`                                                                                      | same value as the API's, used by the homepage demo server action |
| `APP_URL` / `NEXT_PUBLIC_APP_URL`                                                                        | canonical site URL (metadata, email links)                       |
| `SUPPORT_EMAIL`                                                                                          | shown on the support page                                        |

## Payments (Stripe test mode)

Stripe is intentionally run in **test mode in production**. This is a portfolio piece, not a
business collecting real payments — test mode lets visitors run the full checkout/subscription
flow with Stripe's test cards while still exercising the real integration (Checkout Sessions,
webhooks, subscription lifecycle). If you're testing checkout, use one of
[Stripe's test card numbers](https://docs.stripe.com/testing#cards).

## Testing & CI

```bash
npx turbo lint build test   # what CI runs on every push/PR
```

Every workspace (all 3 apps, all 5 packages) has real unit tests — no untested app or package.
Test dependencies (ioredis, `@prisma/client`, Resend, `better-auth`, S3, sharp, etc.) are all
mocked, so the suite runs without any live credentials or a real database/Redis.

## Deployment

- **`apps/web`** → Vercel, from `main`.
- **`apps/api`** / **`apps/worker`** → Railway, built from their own `Dockerfile`s (Railway
  root directory = repo root, Dockerfile path = `apps/api/Dockerfile` /
  `apps/worker/Dockerfile` — see the comment at the top of each). The API's container runs
  `prisma migrate deploy` before starting, applying any pending migration on boot.

  **Check this if a migration doesn't seem to apply:** Railway's per-service "Builder" setting
  has to actually be set to _Dockerfile_. Left on auto-detect, Railway builds and runs the app
  directly (`npm run build` / `npm run start`) and silently skips the whole `migrate deploy`
  step baked into the Dockerfile's `CMD` — the app comes up fine, but any endpoint touching a
  table from an unapplied migration starts failing with a DB error.

## Security notes for anyone auditing this repo

- `/classify` is rate-limited per IP and per API key (`apps/api/src/app.ts`); the homepage demo
  key is separately capped per visitor.
- Client IP resolution reads the leftmost `X-Forwarded-For` entry — verified against both
  Railway's and Vercel's edges, which each fully rewrite that header rather than pass through a
  caller-supplied one (see the comments in `apps/api/src/app.ts` and
  `packages/auth/src/server.ts` for how that was confirmed, and why a naive "trust a proxy
  range" approach broke on Railway specifically).
- Better Auth's own rate limiting is backed by Postgres (`storage: 'database'`), not its
  in-memory default, which wouldn't be shared across Vercel's concurrent serverless
  invocations.
