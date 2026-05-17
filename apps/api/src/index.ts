import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
// import fs from 'node:fs/promises'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import sharp from 'sharp'
import 'dotenv/config'
import { prisma, pool } from '@nsfw/db'

const PORT = parseInt(process.env.PORT || '3001')
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const RESULT_PREFIX = 'nsfw:result:'

// API Key hashing helpers
const hashApiKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex')
const getPrefix = (key: string) => key.substring(0, 7)

const fastify = Fastify({
  logger: true
})

// Redis connection
const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null })

// Queue
const nsfwQueue = new Queue('nsfw-queue', { connection })

// Plugins
fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['x-api-key', 'Content-Type']
})

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// Health check
fastify.get('/', async () => {
  return 'NSFW service (Fastify) running'
})

// Get result
fastify.get('/result/:jobId', async (request, reply) => {
  const { jobId } = request.params as { jobId: string }
  
  const data = await connection.get(`${RESULT_PREFIX}${jobId}`)
  if (!data) {
    return reply.status(404).send({ error: 'Not found' })
  }

  return JSON.parse(data)
})

// Classify
fastify.post('/classify', async (request, reply) => {
  const apiKeyRaw = request.headers['x-api-key'] as string
  if (!apiKeyRaw) {
    return reply.status(401).send({ error: 'API key missing' })
  }

  const keyPrefix = getPrefix(apiKeyRaw)
  const keyHash = hashApiKey(apiKeyRaw)

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true }
  })

  if (!apiKey || apiKey.revoked || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
    return reply.status(401).send({ error: 'Invalid or expired API key' })
  }

  // Get plan and limits
  const PLAN_LIMITS: Record<string, number> = {
    'FREE': 1000,
    'STARTER': 25000,
    'PRO': 250000,
    'ENTERPRISE': 1000000000 // Effectively unlimited
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: apiKey.userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        take: 1
      }
    }
  })

  const plan = customer?.subscriptions[0]?.plan || 'FREE'
  const limit = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() }
  })

  // Skip usage limiting for unlimited keys
  if (!apiKey.isUnlimited) {
    // Atomic usage check + increment via Redis to prevent race conditions
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`
    const usageCounterKey = `usage:${apiKey.userId}:${monthKey}`

    const currentCount = await connection.incr(usageCounterKey)

    // Set expiry on first use (auto-cleanup after 35 days)
    if (currentCount === 1) {
      await connection.expire(usageCounterKey, 35 * 24 * 60 * 60)
    }

    if (currentCount > limit) {
      // Undo the increment since we're rejecting
      await connection.decr(usageCounterKey)
      return reply.status(403).send({
        error: 'Monthly scan limit reached',
        plan,
        limit,
        currentUsage: currentCount - 1
      })
    }
  }

  // Persist usage to Postgres (non-blocking for the request, but awaited for data integrity)
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  let usageRecordId: string | undefined

  const usage = await prisma.usageRecord.findFirst({
    where: {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      periodStart: { lte: now },
      periodEnd: { gte: now }
    }
  })

  if (usage) {
    await prisma.usageRecord.update({
      where: { id: usage.id },
      data: {
        requestCount: { increment: 1 },
        imageCount: { increment: 1 }
      }
    })
    usageRecordId = usage.id
  } else {
    const newUsage = await prisma.usageRecord.create({
      data: {
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        requestCount: 1,
        imageCount: 1,
        periodStart,
        periodEnd
      }
    })
    usageRecordId = newUsage.id
  }

  const fileData = await request.file()
  if (!fileData) {
    return reply.status(400).send({ error: 'No image provided' })
  }

  const jobId = crypto.randomUUID()
  const tempPath = path.join(os.tmpdir(), `nsfw-${jobId}.jpg`)

  try {
    const buffer = await fileData.toBuffer()
    console.log(`[NSFW API FASTIFY] Processing image ${jobId}, size: ${buffer.length} bytes`)

    await sharp(buffer)
      .resize(224, 224)
      .removeAlpha()
      .jpeg()
      .toFile(tempPath)
  } catch (error) {
    console.error(`[NSFW API FASTIFY] Sharp processing failed for ${jobId}:`, error)
    return reply.status(500).send({ error: 'Failed to process image' })
  }

  // Mark as pending in Redis
  await connection.set(
    `${RESULT_PREFIX}${jobId}`,
    JSON.stringify({ status: 'pending' })
  )

  // Add job to queue
  await nsfwQueue.add('nsfw-job', { jobId, tempPath, usageRecordId }, { attempts: 2 })

  return { jobId }
})

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down server...')
  await fastify.close()
  await nsfwQueue.close()
  await connection.quit()
  await prisma.$disconnect()
  await pool.end()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`NSFW API (Fastify) running on http://localhost:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
