import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import Typewriter from "typewriter-effect";
import styles from './index.module.css';
import { motion, Variants } from 'framer-motion'; // Import framer-motion

// Animation variants
const containerVariants : Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const itemVariants : Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 120
    }
  }
};

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <div>
      <motion.header 
        className={clsx('hero hero--primary', styles.heroBanner)}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="container">
          {/* Project Logo */}
          <motion.div variants={itemVariants}>
            <img
              src="/img/logo.png"
              alt={`${siteConfig.title} logo`}
              className={styles.heroLogo}
            />
          </motion.div>

          {/* Documentation + Netlify Badge */}
          <motion.div variants={itemVariants} className={styles.netlifyWrapper}>
            <span className={styles.docLabel}>Documentation is now powered by</span>
            <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">
              <img
                src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg"
                alt="Deploys by Netlify"
                className={styles.netlifyBadge}
              />
            </a>
          </motion.div>

          {/* Title + Tagline */}
          <motion.div variants={itemVariants}>
            <Heading as="h1" className="hero__title">
              <div style={{textDecoration:'uppercase'}}>
                <Typewriter
                  options={{
                    strings: [siteConfig.title],
                    autoStart: true,
                    loop: true,
                    delay: 50,
                    deleteSpeed: 20,
                  }}
                />
              </div>
            </Heading>
          </motion.div>

          <motion.p variants={itemVariants} className="hero__subtitle">
            {siteConfig.tagline}
          </motion.p>

          {/* CTA Button */}
          <motion.div variants={itemVariants} className='getStartedButton'>
            <Link
              className="button button--secondary button--lg"
              to="/docs/introduction"
            >
              Get Started →
            </Link>
          </motion.div>
        </div>
      </motion.header>
    </div>
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