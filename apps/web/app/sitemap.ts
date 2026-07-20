import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/billing', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/support', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/docs', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/docs/intro', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/docs/quickstart', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/docs/keys', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/docs/image', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/docs/batch', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/docs/security', changeFrequency: 'monthly' as const, priority: 0.7 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
