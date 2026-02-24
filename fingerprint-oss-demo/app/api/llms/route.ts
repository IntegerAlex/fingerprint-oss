import { NextResponse } from 'next/server'
import { siteBaseUrl, siteInfo, siteWhatWeDo, siteHowToUse } from '@/lib/site'

/** Prerender at build time so /llms.txt is static like sitemap and robots. */
export const dynamic = 'force-static'

/**
 * Serves llms.txt at /llms.txt (via rewrite in next.config).
 * Follows the llms.txt specification for AI/LLM discovery.
 * Content-Type: text/plain; charset=utf-8
 */
export async function GET() {
  const body = [
    `# ${siteInfo.name}`,
    '',
    `> ${siteInfo.description}`,
    '',
    '## What We Do',
    '',
    ...siteWhatWeDo.map((line) => `- ${line}`),
    '',
    '## How To Use',
    '',
    'Install the library:',
    `\`\`\`\n${siteHowToUse.install}\n\`\`\``,
    '',
    'Basic usage in JavaScript/TypeScript:',
    `\`\`\`\n${siteHowToUse.usage}\n\`\`\``,
    '',
    siteHowToUse.docs,
    '',
    '## Services',
    '',
    `- [Live Demo](${siteBaseUrl}/demo): Interactive browser fingerprinting demo`,
    `- [Roadmap](${siteBaseUrl}/roadmap): Product roadmap and planned features`,
    `- [Home](${siteBaseUrl}): Overview and installation guide`,
    '',
    '## Key Information',
    '',
    `- [NPM Package](${siteInfo.npm}): Install fingerprint-oss from npm`,
    `- [Source Code](${siteInfo.repository}): GitHub repository`,
    `- [Organization](${siteInfo.organizationUrl}): ${siteInfo.organization}`,
    '',
    '## AI Discovery Files',
    '',
    `- [Sitemap](${siteBaseUrl}/sitemap.xml): Site structure`,
    `- [Robots](${siteBaseUrl}/robots.txt): Crawler directives`,
    '',
    '## Contact',
    '',
    `- Organization: ${siteInfo.organization}`,
    `- Website: ${siteInfo.organizationUrl}`,
    `- Repository: ${siteInfo.repository}`,
  ].join('\n')

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
