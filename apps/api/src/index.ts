import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env'),
  override: true,
});

process.env.HOST = '0.0.0.0';

import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3001');

const start = async () => {
  try {
    const fastify = await buildApp({ logger: true });

    const shutdown = async () => {
      console.log('Shutting down server...');
      await fastify.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    const address = await fastify.listen({ port: PORT, host: '::' });
    console.log(`[NSFW API V5] SUCCESS! Server listening at: ${address}`);
  } catch (err) {
    console.error('[NSFW API V5] FATAL: Server failed to start:', err);
    process.exit(1);
  }
};

start();
