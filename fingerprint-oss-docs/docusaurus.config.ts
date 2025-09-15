import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Fingerprint OSS',
  tagline: 'Free & Open Source Browser Fingerprinting',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://fingerprint-oss.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'fingerprint-oss', // Usually your GitHub org/user name.
  projectName: 'fingerprint-oss', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Add custom scripts to force dark mode
  scripts: [
    {
      src: '/js/force-dark-mode.js',
      async: true,
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/IntegerAlex/fingerprint-oss/tree/main/docs',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/IntegerAlex/fingerprint-oss/tree/main/docs',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Disable light mode toggle and set dark mode as default
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    // Replace with your project's social card
    image: 'img/logo.png',
    navbar: {
      title: 'Fingerprint OSS',
      logo: {
        alt: 'Fingerprint OSS Logo',
        src: '/img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {to: '/license', label: 'License', position: 'left'},
        {
          href: 'https://github.com/IntegerAlex/fingerprint-oss',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/introduction',
            },
            {
              label: 'API Reference',
              to: '/docs/api/reference',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture/overview',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/IntegerAlex/fingerprint-oss',
            },
            {
              label: 'License',
              href: 'https://github.com/IntegerAlex/fingerprint-oss/blob/main/LICENSE',
            },
          ],
        },
        {
          title: 'Our Supporters',
          items: [
            {
              label: 'Documentation Hosted by Netlify',
              href: 'https://www.netlify.com',
              description: 'Documentation Hosted on Netlify',
            },
            {
              label: 'GEO-IP Hosted by Cloudflare',
              href: 'https://www.cloudflare.com',
              description: 'GEO-IP Hosted on Cloudflare',
            },
            {
              label: 'Open-telemetry Data Hosted on Neon',
              href: 'https://neon.tech',
              description: 'Open-telemetry Data Hosted on Neon',
            }
            
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Fingerprint OSS`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
