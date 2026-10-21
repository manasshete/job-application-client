/** The Pursuitz mark and wordmark. */
export function Brand({ small = false }: { small?: boolean }) {
  const box = small ? 22 : 26
  const inner = small ? 8 : 9
  return (
    <>
      <span aria-hidden="true" style={{ width: box, height: box, flex: 'none', borderRadius: small ? 6 : 7, background: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
        <span style={{ width: inner, height: inner, borderRadius: 1, background: 'var(--on-accent)', transform: 'rotate(45deg)' }} />
      </span>
      <span className="brand-name" style={{ fontSize: small ? 16 : 17, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--text)' }}>Pursuitz</span>
    </>
  )
}
