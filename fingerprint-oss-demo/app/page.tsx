"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import userInfo from "fingerprint-oss";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import FingerprintDisplay from "@/components/fingerprint-display";
import InstallationGuide from "@/components/installation-guide";

export default function Home() {
  const [fingerprintData, setFingerprintData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState(1);

  // Memoized fingerprint fetching function
  const fetchFingerprintData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userInfo({
        transparency: true,
        message: "Data is being collected for demo purposes.",
      });

        if (typeof window !== "undefined" && data.hash) {
          const storedHash = localStorage.getItem("fingerprint_visitor_hash");
          const storedCount = Number.parseInt(
            localStorage.getItem("fingerprint_visit_count") || "0",
          );

          if (storedHash === data.hash) {
            const newCount = storedCount + 1;
            localStorage.setItem(
              "fingerprint_visit_count",
              newCount.toString(),
            );
            setVisitCount(newCount);
          } else {
            localStorage.setItem("fingerprint_visitor_hash", data.hash);
            localStorage.setItem("fingerprint_visit_count", "1");
            setVisitCount(1);
          }
        }

        if (data.geolocation && !data.geolocation.vpnStatus) {
          data.geolocation.vpnStatus = {
            status: data.geolocation.traits?.isAnonymousVpn || false,
            probability: data.geolocation.traits?.isAnonymousVpn ? 0.85 : 0.15,
          };
        }

        setFingerprintData(data);
      } catch (err) {
        console.error("Error fetching fingerprint data:", err);

        const demoData = {
          confidenceAssessment: {
            system: {
              score: 0.75,
              rating: "Medium-High Confidence",
              description:
                "The data appears mostly consistent with some minor discrepancies.",
              reliability:
                "Data is generally reliable but may have some inconsistencies worth investigating.",
              level: "medium-high",
              factors: "No bot signals detected",
            },
            combined: {
              score: 0.6,
              rating: "Medium Confidence",
              description:
                "The data shows a moderate level of consistency, but with some concerning signals.",
              reliability:
                "Data should be treated with caution and verified through additional means.",
              level: "medium",
              factors: "No suspicious network factors detected",
            },
          },
          geolocation: {
            ip: "192.168.1.1",
            city: "New York",
            region: {
              isoCode: "NY",
              name: "New York",
            },
            country: {
              isoCode: "US",
              name: "United States",
            },
            continent: {
              code: "NA",
              name: "North America",
            },
            location: {
              accuracyRadius: 100,
              latitude: 40.7128,
              longitude: -74.006,
              timeZone: "America/New_York",
            },
            traits: {
              isAnonymous: false,
              isAnonymousProxy: false,
              isAnonymousVpn: false,
              network: "192.168.1.0/24",
            },
            vpnStatus: {
              status: false,
              probability: 0.15,
            },
          },
          systemInfo: {
            incognito: {
              isPrivate: false,
              browserName: "Chrome",
            },
            adBlocker: {
              isBrave: false,
              adBlocker: false,
            },
            userAgent:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            platform: "Win32",
            languages: ["en-US"],
            cookiesEnabled: true,
            doNotTrack: null,
            screenResolution: [1920, 1080],
            colorDepth: 24,
            colorGamut: "srgb",
            touchSupport: {
              maxTouchPoints: 0,
              touchEvent: false,
              touchStart: false,
            },
            hardwareConcurrency: 8,
            deviceMemory: 8,
            os: {
              os: "Windows",
              version: "10",
            },
            localStorage: true,
            sessionStorage: true,
            indexedDB: true,
            webGL: {
              vendor: "Google Inc. (NVIDIA)",
              renderer:
                "ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0)",
            },
            canvas: {
              winding: false,
              geometry: "data:image/png;base64,demo",
              text: "14px Arial",
            },
            plugins: [],
            timezone: "America/New_York",
            vendor: "Google Inc.",
            vendorFlavors: ["chrome"],
            confidenceScore: 0.75,
            bot: {
              isBot: false,
              signals: [],
              confidence: 0.5,
            },
          },
          hash: "demo" + Math.random().toString(36).substring(2, 15),
        };

        if (typeof window !== "undefined") {
          const storedHash = localStorage.getItem("fingerprint_visitor_hash");
          const storedCount = Number.parseInt(
            localStorage.getItem("fingerprint_visit_count") || "0",
          );

          if (storedHash && storedHash.startsWith("demo")) {
            const newCount = storedCount + 1;
            localStorage.setItem(
              "fingerprint_visit_count",
              newCount.toString(),
            );
            setVisitCount(newCount);
          } else {
            localStorage.setItem("fingerprint_visitor_hash", demoData.hash);
            localStorage.setItem("fingerprint_visit_count", "1");
            setVisitCount(1);
          }
        }

        setFingerprintData(demoData);
        setError(
          "Using demo data. The fingerprint-oss package couldn't be initialized.",
        );
      } finally {
        setLoading(false);
      }
    }, []); // Empty dependency array for useCallback

    useEffect(() => {
      fetchFingerprintData();
    }, [fetchFingerprintData]);

    // Memoized loading spinner for better performance
    const LoadingSpinner = useMemo(() => (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <span className="mt-4 text-muted-foreground text-lg">
          Generating your unique browser fingerprint...
        </span>
      </div>
    ), []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <section className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center rounded-lg bg-secondary text-sm font-medium py-1 px-3 mb-4">
              Backed by Cloudflare OSS
            </div>
            <h1 className="text-5xl font-bold text-primary mb-4">
              Fingerprint OSS Demo
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Explore how `fingerprint-oss` library identifies unique visitors
              with high accuracy, even when they attempt to conceal their
              identity.
            </p>
          </div>

          {loading ? (
            LoadingSpinner
          ) : error ? (
            <div>
              <div
                className="bg-destructive/10 border border-destructive/20 text-destructive-foreground px-4 py-3 rounded-lg relative mb-6"
                role="alert"
              >
                <strong className="font-bold">Note: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
              <FingerprintDisplay
                data={fingerprintData}
                visitCount={visitCount}
              />
            </div>
          ) : (
            <FingerprintDisplay
              data={fingerprintData}
              visitCount={visitCount}
            />
          )}
        </section>

        <InstallationGuide />
      </main>
      <Footer />
    </div>
  );
}
