"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, CheckCircle2, Server, Zap, Shield, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/** Release history – factually accurate per CHANGELOG.md */
const RELEASE_HISTORY = [
  {
    version: "0.9.4",
    date: "2025-02-08",
    items: [
      "Advanced Device Type Detection: deviceType in SystemInfo (mobile, tablet, desktop, tv, unknown)",
      "8 detection techniques: Client Hints, Bowser, screen, touch/pointer, CSS media, hardware, heuristics, UA fallback",
      "Confidence scores and signal breakdown; handles iPad desktop mode, touchscreen laptops",
      "Bowser updated to 2.13.1",
    ],
  },
  {
    version: "0.9.3",
    date: "2025-01-21",
    items: [
      "Separate ipv4 and ipv6 fields in geolocation (legacy ip retained)",
      "Structured logging for proxy server (StructuredLogger)",
      "Shared IP utilities (isIPv4, isIPv6, extractIPv4FromMapped)",
      "Fixed: location validation in geo-worker, IPv6 fallback for primary ip",
    ],
  },
  {
    version: "0.9.2",
    date: "2025-01-20",
    items: [
      "Bowser integration: SystemInfo.browser with name and version",
      "98% browser accuracy, 100+ browsers supported",
      "Replaced regex detection with Bowser parser",
      "Integrated Bowser as internal module (no external dependency)",
    ],
  },
  {
    version: "0.9.0",
    date: "2025-07-01",
    items: [
      "First stable canary release",
      "Comprehensive fingerprinting, robust testing",
    ],
  },
  {
    version: "0.2.5-beta",
    date: "2025-04-30",
    items: ["Core fingerprinting, basic testing, initial hash generation"],
  },
  {
    version: "0.2.4",
    date: "2025-04-27",
    items: [
      "Basic VPN detection",
      "Improved incognito detection on Safari",
    ],
  },
  {
    version: "0.2.4-alpha",
    date: "2025-03-28",
    items: [
      "Hash implementation for unique device identifiers",
      "Improved hardware concurrency detection",
      "Playwright test suite",
    ],
  },
  {
    version: "0.2.3-alpha",
    date: "2025-03-15",
    items: [
      "GDPR compliance: config object (transparency, message)",
      "New os property in system info",
      "Enhanced bot and incognito detection, WebGL",
    ],
  },
  {
    version: "0.2.2",
    date: "2025-03-10",
    items: [
      "Major incognito detector",
      "Ethical Notice in LICENSE",
      "Enhanced confidence score",
      "Fixed plugin system issues",
    ],
  },
  {
    version: "0.2.2-beta",
    date: "2025-03-08",
    items: ["Confidence score for system info", "AdBlocker detector"],
  },
  {
    version: "0.2.2-alpha",
    date: "2025-03-08",
    items: ["GeoIP logger", "Versioning schema"],
  },
  {
    version: "0.0.2",
    date: "2025-03-06",
    items: ["System info logger", "Published build files"],
  },
  {
    version: "0.0.1",
    date: "2025-03-06",
    items: ["Initial release of user-info-logger fork"],
  },
];

const FUTURE_ROADMAP = [
  { version: "0.9.5", theme: "Robustness & DX", focus: ["Config validation", "Structured errors", "Geo timeout", "Low-compute minimal preset"] },
  { version: "0.9.6", theme: "Config & Extensibility", focus: ["Custom geo endpoint", "Feature flags", "Plugin hooks", "Lazy loading"] },
  { version: "0.9.7", theme: "Advanced & Hardening", focus: ["Connection type", "CSP-friendly", "SRI hashes", "Pre-1.0 audit"] },
];

/**
 * Roadmap page component showing release history (per CHANGELOG) and future plans.
 * Includes Cloudflare and Netlify support.
 */
export default function Roadmap() {
  return (
    <div className="w-full space-y-12">
      {/* Hero */}
      <section className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Map className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Roadmap & Achievements</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Track our journey from the initial fork to a production-ready fingerprinting library with 100K+ monthly hits.
        </p>
      </section>

      {/* Platform Support: Cloudflare & Netlify */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Server className="h-6 w-6 text-primary" />
          Platform Support
        </h2>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <Link href="https://cloudflare.com" target="_blank" className="flex-shrink-0">
                  <Image src="/cloudflare.png" alt="Cloudflare" width={140} height={48} className="h-12 w-auto hover:opacity-90 transition-opacity" />
                </Link>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Cloudflare</h3>
                  <p className="text-sm text-muted-foreground">
                    GEO-IP proxy and Workers for edge geolocation. Fingerprint OSS is backed by Cloudflare OSS infrastructure.
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <Link href="https://netlify.com" target="_blank" className="flex-shrink-0">
                  <Image src="/netlify-logo.png" alt="Netlify" width={120} height={48} className="h-12 w-auto hover:opacity-90 transition-opacity" />
                </Link>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Netlify</h3>
                  <p className="text-sm text-muted-foreground">
                    Documentation and demo hosting powered by Netlify. Open source projects supported.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Release History – per CHANGELOG.md */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          Release History (What We Shipped)
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Factually accurate per{" "}
          <Link href="https://github.com/IntegerAlex/fingerprint-oss/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            CHANGELOG.md
          </Link>
          .
        </p>
        <div className="space-y-4">
          {RELEASE_HISTORY.map((r) => (
            <Card key={r.version} className="border-border/50 hover:border-primary/20 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant={r.version.startsWith("0.9") ? "default" : "secondary"}>v{r.version}</Badge>
                  <span className="text-muted-foreground font-normal text-sm">{r.date}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Future Roadmap */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Upcoming: 0.9.5 → 0.9.7
        </h2>
        <div className="space-y-4">
          {FUTURE_ROADMAP.map((release) => (
            <Card key={release.version} className="border-dashed border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="secondary">v{release.version}</Badge>
                  {release.theme}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-2">
                  {release.focus.map((item) => (
                    <li key={item}>
                      <Badge variant="outline" className="font-normal">
                        {item}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          See the full{" "}
          <Link href="https://github.com/IntegerAlex/fingerprint-oss/blob/main/ROADMAP.md" target="_blank" className="underline hover:text-foreground">
            ROADMAP.md
          </Link>{" "}
          in the repository.
        </p>
      </section>

      {/* Stats callout */}
      <section>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
            <p className="text-lg font-medium text-foreground">
              Fingerprint OSS serves 100K+ monthly hits across production sites
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Backed by Cloudflare OSS, Netlify, and Neon. Free & open source under LGPL-3.0.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
