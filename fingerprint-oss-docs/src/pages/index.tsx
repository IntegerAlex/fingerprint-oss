import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        {/* Project Logo */}
        <img
          src="/img/logo.png"
          alt={`${siteConfig.title} logo`}
          className={styles.heroLogo}
        />

        {/* Documentation + Netlify Badge */}
        <div className={styles.netlifyWrapper}>
          <span className={styles.docLabel}>Documentation is now powered by</span>
          <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">
            <img
              src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg"
              alt="Deploys by Netlify"
              className={styles.netlifyBadge}
            />
          </a>
        </div>

        {/* Title + Tagline */}
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>

        {/* CTA Button */}
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/introduction"
          >
            Get Started →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description="Free & Open Source Browser Fingerprinting - Comprehensive device and browser fingerprinting library with privacy and compliance features."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
