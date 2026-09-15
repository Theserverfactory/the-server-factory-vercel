import type { MetadataRoute } from 'next';
import { COMING_SOON_DISALLOWED, isComingSoon } from '@/lib/coming-soon';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const ALWAYS_DISALLOWED = ['/admin/', '/account/', '/api/', '/checkout/', '/login', '/cart'];

export default function robots(): MetadataRoute.Robots {
  // While gated the store sections only 307 back to "/", so keep crawlers off
  // them rather than having them discover a site full of redirects. The holding
  // page and /about stay crawlable so the brand can start ranking.
  const disallow = isComingSoon()
    ? [...new Set([...ALWAYS_DISALLOWED, ...COMING_SOON_DISALLOWED])]
    : ALWAYS_DISALLOWED;

  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
