import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * React hook that reports whether the current viewport is considered "mobile".
 *
 * Uses a media query (viewport width < 768px) and a window-width check to initialize
 * and update state on viewport changes. Adds a `change` listener to the MediaQueryList
 * on mount and removes it on unmount.
 *
 * Note: on the very first render this hook returns `false` (state is initialized after mount).
 *
 * @returns `true` when window.innerWidth is less than 768 pixels, otherwise `false`.
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
