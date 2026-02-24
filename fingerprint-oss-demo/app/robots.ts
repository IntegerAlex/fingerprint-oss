import type { MetadataRoute } from 'next'
import { siteBaseUrl } from '@/lib/site'

/**
 * Provides robots metadata for Next.js to generate robots.txt.
 * Sitemap URL is generated automatically from the site base URL.
 *
 * @returns The MetadataRoute.Robots object describing rules, sitemap, and host.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/_next/',
        '/private/',
        '*.json$',
      ],
    },
    sitemap: `${siteBaseUrl}/sitemap.xml`,
    host: siteBaseUrl,
  }
}
