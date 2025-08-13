import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  codeExample?: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Free & Open Source',
    description: (
      <>
        Fingerprint OSS is a <strong>fully open source</strong> browser
        fingerprinting service released under the <code>LGPL-3.0</code> license.
        Unlike commercial "source available" options, it is truly free to use
        and backed by Cloudflare OSS.
      </>
    ),
    codeExample: `npm install fingerprint-oss`,
  },
  {
    title: 'Privacy-Focused & Ethical',
    description: (
      <>
        Built with <strong>ethical guidelines</strong> at its core — supporting
        transparency, user privacy, and compliance with GDPR and other privacy
        regulations. Includes VPN, incognito, AdBlocker, and bot detection.
      </>
    ),
  },
  {
    title: 'Lightweight & Easy to Integrate',
    description: (
      <>
        100% client-side operation (except GeoLocation API) with simple
        integration. Collects comprehensive system, browser, and environment
        data in one call.
      </>
    ),
    codeExample: `import userInfo from 'fingerprint-oss';\nconst data = await userInfo();`,
  },
];

function Feature({ title, description, codeExample }: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureCard)}>
      <Heading as="h3" className={styles.featureTitle}>
        {title}
      </Heading>
      <p className={styles.featureDescription}>{description}</p>
      {codeExample && (
        <pre className={styles.codeBlock}>
          <code>{codeExample}</code>
        </pre>
      )}
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={clsx('row', styles.featureRow)}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
