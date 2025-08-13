// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'introduction',
      label: 'Introduction',
    },
    {
      type: 'doc',
      id: 'getting-started',
      label: 'Getting Started',
    },
    {
      type: 'doc',
      id: 'faq',
      label: 'FAQs',
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/fingerprinting-techniques',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/reference',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
      ],
    },
  ],
};

module.exports = sidebars;
