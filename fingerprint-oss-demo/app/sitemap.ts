import { MetadataRoute } from 'next'

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