import { notFound } from 'next/navigation'

// Design mock-ups for local development only; not served in production.
export default function DesignPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound()
  return children
}
