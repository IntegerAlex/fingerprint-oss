import { MetadataRoute } from 'next'

/**
 * Build the sitemap for the site.
 *
 * Returns a sitemap array containing three entries: the site root and two fragment anchors (`#demo`, `#installation`).
 * Each entry includes `url`, `lastModified` (set to the time the function runs), `changeFrequency`, and `priority`.
 *
 * @returns The generated MetadataRoute.Sitemap for the site.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://fingerprint-oss.gossorg.in'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/#demo`,
      lastModified: new Date(),
      changeFrequency: 'weekly', 
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#installation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }
  ]
} 