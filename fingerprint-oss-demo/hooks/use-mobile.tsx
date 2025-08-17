import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * React hook that reports whether the current viewport is considered "mobile".
 *
 * Uses a media-query tied to the MOBILE_BREAKPOINT constant (768) to track viewport width and updates on changes. The hook returns a boolean and subscribes to viewport changes while mounted, removing the listener on unmount. Note: the initial render may return `false` until the hook determines the actual viewport size.
 *
 * @returns `true` when window width is strictly less than `MOBILE_BREAKPOINT` (768), otherwise `false`.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
