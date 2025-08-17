'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * Client-side wrapper that re-exports `next-themes`' ThemeProvider.
 *
 * Forwards all received ThemeProviderProps to `NextThemesProvider` and renders its `children` within.
 *
 * @returns A React element that provides theme context to its children.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
