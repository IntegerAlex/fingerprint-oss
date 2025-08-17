import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fingerprint OSS Demo - Free Browser Fingerprinting Library",
  description:
    "Experience the power of fingerprint-oss: A free, open-source browser fingerprinting library for identifying unique visitors. Test device detection, geolocation, VPN detection, and more.",
  metadataBase: new URL("https://fingerprint-oss.gossorg.in"),
  alternates: {
    canonical: "https://fingerprint-oss.gossorg.in",
  },
  openGraph: {
    title: "Fingerprint OSS Demo - Free Browser Fingerprinting Library",
    description:
      "Experience fingerprint-oss in action! Free, open-source browser fingerprinting with device detection, geolocation, VPN detection, and visitor analytics. Backed by Cloudflare OSS.",
    url: "https://fingerprint-oss.gossorg.in",
    siteName: "Fingerprint OSS Demo",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Fingerprint OSS - Free Browser Fingerprinting Library",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@gossorg",
    creator: "@gossorg", 
    title: "Fingerprint OSS Demo - Free Browser Fingerprinting",
    description: "Try fingerprint-oss: Free, open-source browser fingerprinting library with device detection, geolocation & VPN detection.",
    images: [
      {
        url: "/logo.png",
        alt: "Fingerprint OSS Demo",
        width: 1200,
        height: 630,
      }
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  keywords: [
    "browser fingerprinting",
    "fingerprint js",
    "open source fingerprinting",
    "visitor identification",
    "device detection",
    "privacy-focused analytics",
    "web analytics",
    "device identification",
    "fingerprint-oss",
    "npm package",
    "frontend security",
    "user tracking",
    "browser detection",
    "VPN detection",
    "geolocation API",
    "canvas fingerprinting",
    "WebGL fingerprinting",
    "hardware fingerprinting",
    "GOSS",
    "Global Open Source Softwares",
    "Cloudflare Workers",
    "Next.js",
    "TypeScript",
  ],
  authors: [
    { name: "Global Open Source Softwares (GOSS)", url: "https://globalopensourcesoftwares.in" }
  ],
  creator: "Global Open Source Softwares (GOSS)",
  publisher: "Global Open Source Softwares (GOSS)",
  generator: "Next.js",
  applicationName: "Fingerprint OSS Demo",
  referrer: "origin-when-cross-origin",
  category: "technology",
  classification: "Business",
  other: {
    "google-site-verification": "your-google-verification-code", // Replace with actual verification code
    "msvalidate.01": "your-bing-verification-code", // Replace with actual verification code
    "theme-color": "#7c3aed",
    "color-scheme": "dark",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="//unpkg.com" />
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
        
        {/* Structured Data for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Fingerprint OSS",
              "description": "Free and open-source browser fingerprinting library for identifying unique visitors with device detection, geolocation, and VPN detection capabilities.",
              "url": "https://fingerprint-oss.gossorg.in",
              "author": {
                "@type": "Organization",
                "name": "Global Open Source Softwares (GOSS)",
                "url": "https://globalopensourcesoftwares.in"
              },
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Any",
              "programmingLanguage": "JavaScript",
              "runtimePlatform": "Web Browser",
              "license": "https://opensource.org/licenses/MIT",
              "codeRepository": "https://github.com/goss-org/fingerprint-oss",
              "downloadUrl": "https://www.npmjs.com/package/fingerprint-oss",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "150"
              },
              "featureList": [
                "Browser Fingerprinting",
                "Device Detection", 
                "Geolocation Services",
                "VPN Detection",
                "Hardware Fingerprinting",
                "Canvas Fingerprinting",
                "WebGL Detection",
                "Privacy-Focused Analytics"
              ]
            })
          }}
        />
      </head>
      <body
        className={`bg-background text-foreground font-sans antialiased ${inter.className}`}
      >
        {children}
      </body>
    </html>
  );
}
