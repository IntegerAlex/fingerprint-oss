import { MetadataRoute } from 'next'

/**
 * Provides robots metadata for Next.js to generate a robots.txt-like response.
 *
 * Returns crawler directives allowing all user agents to access the site root while
 * disallowing API, Next.js internals, a private folder, and JSON files. Also exposes
 * the site's sitemap and host based on the configured base URL.
 *
 * @returns The MetadataRoute.Robots object describing rules, sitemap, and host.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://fingerprint-oss.gossorg.in'
  
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
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
} 