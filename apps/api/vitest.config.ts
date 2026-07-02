import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    clearMocks: true,
    env: {
      REDIS_URL: 'redis://localhost:6379',
      HOME_PAGE_API_KEY: 'home-page-key-test',
      STRIPE_PRICE_STARTER_MONTHLY: 'price_starter_test',
      STRIPE_PRICE_PRO_MONTHLY: 'price_pro_test',
      R2_ENDPOINT: 'https://fake.r2.dev',
      R2_ACCESS_KEY_ID: 'fake-access-key',
      R2_SECRET_ACCESS_KEY: 'fake-secret-key',
      R2_BUCKET_NAME: 'fake-bucket',
    },
  },
});
