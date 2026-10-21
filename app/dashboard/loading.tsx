import { SkeletonRows } from '@/components/pz/ui'

// Rendered inside the dashboard shell (which already carries the .pz scope) while a page loads.
export default function Loading() {
  return (
    <div className="pg" aria-busy="true">
      <div className="sk" style={{ width: 160, height: 14 }} />
      <div className="sk" style={{ width: 'min(360px, 70%)', height: 28, marginTop: 12 }} />
      <SkeletonRows label="Loading" />
    </div>
  )
}
