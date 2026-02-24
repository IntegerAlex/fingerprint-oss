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

/** What fingerprint-oss does: features and use cases for llms.txt. */
export const siteWhatWeDo = [
  'Browser fingerprinting: generate a stable visitor ID from device and browser signals.',
  'Device detection: device type, OS, browser, screen resolution, and hardware hints.',
  'Geolocation: approximate location (country/region) from IP when permitted.',
  'VPN and proxy detection: flag likely VPN or proxy usage for fraud or analytics.',
  'Canvas and WebGL fingerprinting: additional signals for uniqueness and bot detection.',
  'Privacy-focused: runs client-side; no PII required; configurable transparency and data retention.',
  'Use cases: fraud prevention, analytics, A/B testing, rate limiting, and anonymous visitor identification.',
]

/** How to use fingerprint-oss: install and basic API for llms.txt. */
export const siteHowToUse = {
  install: 'npm install fingerprint-oss@latest',
  usage: `import userInfo from 'fingerprint-oss';
const data = await userInfo({ transparency: true });
// data: visitorId, device, location, vpn, canvas, webgl, etc.`,
  docs: 'Full API and options: see the Live Demo and Installation Guide on the site.',
}
