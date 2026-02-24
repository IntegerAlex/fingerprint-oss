import type { MetadataRoute } from 'next'
import { siteBaseUrl, siteRoutes } from '@/lib/site'

/**
 * Build the sitemap for the site from the shared route config.
 * Add or remove routes in `lib/site.ts` to update the sitemap automatically.
 *
 * @returns The generated MetadataRoute.Sitemap for the site.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return siteRoutes.map((route) => ({
    url: `${siteBaseUrl}${route.path === '/' ? '' : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency ?? 'weekly',
    priority: route.priority ?? 0.7,
  }))
}
