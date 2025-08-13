// @ts-check

import {themes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'fingerprint-oss',
  tagline: 'Open-source browser fingerprinting library',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'gossorg',
  projectName: 'fingerprint-oss',

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/gossorg/fingerprint-oss/edit/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'fingerprint-oss',
        logo: {
          alt: 'fingerprint-oss Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'introduction',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: '/api/reference',
            label: 'API Reference',
            position: 'left',
          },
          {
            href: 'https://github.com/gossorg/fingerprint-oss',
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
                label: 'Introduction',
                to: '/introduction',
              },
              {
                label: 'Getting Started',
                to: '/getting-started',
              },
              {
                label: 'API Reference',
                to: '/api/reference',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/gossorg/fingerprint-oss',
              },
              {
                label: 'Issues',
                href: 'https://github.com/gossorg/fingerprint-oss/issues',
              },
              {
                label: 'Discussions',
                href: 'https://github.com/gossorg/fingerprint-oss/discussions',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Fingerprint-OSS. Built with Docusaurus.`,
      },
      prism: {
        theme: themes.vsDark,
        darkTheme: themes.vsDark,
        additionalLanguages: ['typescript', 'javascript', 'bash', 'json'],
      },
    }),
};

export default config;
