import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    clearMocks: true,
    env: {
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_placeholder',
      STRIPE_PRICE_STARTER_MONTHLY: 'price_starter_test',
      STRIPE_PRICE_PRO_MONTHLY: 'price_pro_test',
      STRIPE_PRICE_FREE_MONTHLY: 'price_free_test',
    },
  },
});
