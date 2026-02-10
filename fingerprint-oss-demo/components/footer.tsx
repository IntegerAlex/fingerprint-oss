import Link from "next/link"
import Image from "next/image"

/**
 * Site footer component displaying branding, partner logos, external links, and copyright.
 *
 * Renders a responsive footer with a left-aligned cluster of logos (site, GOSS, Cloudflare, Netlify) plus a "Buy Me A Coffee" button,
 * and a right-aligned information block that shows the current year, external links (GitHub profile and Enterprise Solution),
 * and an attribution line. All external links open in new tabs; images include alt text for accessibility.
 *
 * @returns JSX element representing the site footer.
 */
export default function Footer() {
  return (
    <footer className="bg-background border-t border-border/40">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <Image src="/logo.png" alt="Fingerprint Logo" width={40} height={40} className="h-10 w-10" />
          <Link href="https://gossorg.in" target="_blank">
            <Image src="/goss.png" alt="GOSS Logo" width={96} height={48} className="h-12 w-auto ml-4" />
          </Link>
          <Link href="https://cloudflare.com" target="_blank">
            <Image src="/cloudflare.png" alt="Cloudflare Logo" width={160} height={40} className="h-10 w-auto ml-4" />
          </Link>
          <Link href="https://netlify.com" target="_blank">
            <Image src="/netlify-logo.png" alt="Netlify Logo" width={120} height={40} className="h-10 w-auto ml-4" />
          </Link>
          <a
            href="https://www.buymeacoffee.com/IntegerAlex"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 flex items-center"
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              style={{ height: "40px", width: "145px" }}
            />
          </a>
        </div>

        <div className="text-center md:text-right">
          <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} Global Open Source Softwares. All rights reserved.</p>
          <div className="mt-2">
            <Link href="https://github.com/globalopensourcesoftwares" target="_blank" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub Profile
            </Link>
            <span className="mx-2 text-muted-foreground">|</span>
            <Link href="https://gossorg.in" target="_blank" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Enterprise Solution
            </Link>
          </div>
          <p className="text-muted-foreground text-sm mt-2">A product of <strong>Global Open Source Softwares (GOSS)</strong></p>
        </div>
      </div>
    </footer>
  )
}

