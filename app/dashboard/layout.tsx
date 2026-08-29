import type React from 'react'
import { DashboardTheme } from './dashboard-theme'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Apply the dark theme before first paint to avoid a light flash. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('dark')`,
        }}
      />
      <DashboardTheme />
      {children}
    </>
  )
}
