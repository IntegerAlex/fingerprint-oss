import type { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
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
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: '-100px' });
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      whileHover={{ 
        scale: 1.05, 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: { duration: 0.3 }
      }}
      className={clsx('col col--4', styles.featureCard)}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
      >
        <Heading as="h3" className={styles.featureTitle}>
          {title}
        </Heading>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={isInView ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className={styles.featureDescription}
        >
          {description}
        </motion.div>
        {codeExample && (
          <motion.pre 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            whileHover={{
              scale: 1.03,
              boxShadow: '0 4px 14px rgba(0, 123, 255, 0.2)',
              transition: { duration: 0.2 }
            }}
            className={styles.codeBlock}
          >
            <code>{codeExample}</code>
          </motion.pre>
        )}
      </motion.div>
      
      {/* Background elements with animations */}
      <motion.div 
        className={styles.cardBackground}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      />
      
      {/* Hover effect elements */}
      <motion.div 
        className={styles.hoverEffect}
        initial={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

export default function HomepageFeatures(): ReactNode {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-50px' });
  
  return (
    <motion.section 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.7 }}
      className={styles.features}
    >
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
          className={clsx('row', styles.featureRow)}
        >
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}