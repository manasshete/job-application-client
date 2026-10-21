import type { ReactNode } from 'react'

/** Narrow centred column used by every sign-in screen. */
export function AuthFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fade pub-in" style={{ maxWidth: 496, paddingTop: 64, paddingBottom: 80 }}>
      <h1 className="h1">{title}</h1>
      {children}
    </div>
  )
}
