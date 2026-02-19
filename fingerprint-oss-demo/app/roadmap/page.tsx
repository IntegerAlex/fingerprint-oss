import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Roadmap from "@/components/roadmap";
import BackToTop from "@/components/back-to-top";

export const metadata: Metadata = {
  title: "Roadmap | Fingerprint OSS",
  description: "Fingerprint OSS roadmap, achievements, npm stats, and platform support. Backed by Cloudflare and Netlify.",
};

/**
 * Roadmap page showing project achievements, npm stats, platform support, and future plans.
 */
export default function RoadmapPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <Roadmap />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
