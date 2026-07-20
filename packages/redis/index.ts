import { Redis, type RedisOptions } from 'ioredis';

export type BullmqConnection = {
  host: string;
  port: number;
  password?: string;
  tls?: { rejectUnauthorized: false };
  maxRetriesPerRequest: null;
};

// Upstash serves TLS on the plain redis:// port 6379, so hostname is checked too.
const isTlsUrl = (url: string, hostname: string) =>
  url.startsWith('rediss://') || hostname.endsWith('.upstash.io');

export function createRedisConnection(redisUrl: string, options: RedisOptions = {}) {
  const redisParsed = new URL(redisUrl);
  const useTls = isTlsUrl(redisUrl, redisParsed.hostname);

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    ...options,
    ...(useTls && { tls: { rejectUnauthorized: false } }),
  });

  const { hostname, port, password } = redisParsed;
  const bullmqConnection: BullmqConnection = {
    host: hostname,
    port: Number(port || 6379),
    ...(password && { password: decodeURIComponent(password) }),
    ...(useTls && { tls: { rejectUnauthorized: false } }),
    maxRetriesPerRequest: null,
  };

  return { connection, bullmqConnection };
}
