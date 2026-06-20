import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all crawlers (including AI crawlers like GPTBot,
        // PerplexityBot, Google-Extended) to index public marketing pages,
        // but keep private app routes out of the index.
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/auth', '/api'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
