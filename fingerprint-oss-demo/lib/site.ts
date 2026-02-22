import type { MetadataRoute } from 'next'

/** Base URL for the site (no trailing slash). */
export const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fingerprint-oss.gossorg.in'

/**
 * Public routes included in the sitemap.
 * Add new pages here to have them appear in the sitemap automatically.
 */
export const siteRoutes: Array<{
  path: string
  changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']
  priority?: number
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/demo', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/roadmap', changeFrequency: 'monthly', priority: 0.8 },
]

/** Site name and short description for llms.txt and metadata. */
export const siteInfo = {
  name: 'Fingerprint OSS Demo',
  description:
    'Free, open-source browser fingerprinting library for identifying unique visitors. Device detection, geolocation, VPN detection, and visitor analytics.',
  repository: 'https://github.com/IntegerAlex/fingerprint-oss',
  npm: 'https://www.npmjs.com/package/fingerprint-oss',
  organization: 'Global Open Source Softwares (GOSS)',
  organizationUrl: 'https://gossorg.in',
}
