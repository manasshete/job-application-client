'use client'

import { useEffect } from 'react'

/**
 * Applies the dark editorial theme to the whole document while any dashboard
 * route is mounted, then reverts on unmount. Toggling the class on
 * `documentElement` (not a wrapper div) ensures Radix dialogs/popovers — which
 * portal to `document.body` — also render in the dark theme.
 */
export function DashboardTheme() {
  useEffect(() => {
    const root = document.documentElement
    const hadDark = root.classList.contains('dark')
    root.classList.add('dark')
    return () => {
      if (!hadDark) root.classList.remove('dark')
    }
  }, [])

  return null
}
