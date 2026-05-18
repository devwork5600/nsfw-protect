import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let _prisma: PrismaClient | null = null;
let _pool: pg.Pool | null = null;

export const getDb = () => {
  if (!_prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(_pool);
    _prisma = new PrismaClient({ adapter });
  }
  return { prisma: _prisma, pool: _pool };
};

// Proxies for backward compatibility
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getDb().prisma as any)[prop];
  },
});

export const pool = new Proxy({} as pg.Pool, {
  get(_, prop) {
    return (getDb().pool as any)[prop];
  },
});

export * from '@prisma/client';
