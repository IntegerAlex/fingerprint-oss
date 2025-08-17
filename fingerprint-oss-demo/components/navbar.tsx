import type React from "react"
import Link from "next/link"
import { Fingerprint } from "lucide-react"
import Image from "next/image"

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-8 w-8" />
            <Image src="/cloudflare.png" alt="Cloudflare Logo" width={120} height={40} className="h-8 w-auto ml-2" />
            <span className="ml-2 text-xl font-semibold text-foreground">Fingerprint OSS</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <NavLink href="https://github.com/IntegerAlex/fingerprint-oss?tab=readme-ov-file#usage">Docs</NavLink>
            <NavLink href="https://github.com/IntegerAlex/fingerprint-oss" target="_blank">
              GitHub
            </NavLink>
            <a
              href="https://www.buymeacoffee.com/IntegerAlex"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <img
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                alt="Buy Me A Coffee"
                style={{ height: "40px", width: "145px" }}
              />
            </a>
          </div>
          <div className="md:hidden">
            <button className="text-foreground hover:text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, children, target }: { href: string; children: React.ReactNode; target?: string }) {
  return (
    <Link
      href={href}
      target={target}
      className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  )
}
