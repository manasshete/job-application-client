import Link from 'next/link'
import { AuthFrame } from '@/components/pz/auth-frame'

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return (
    <AuthFrame title="Something went wrong">
      <div role="alert" style={{ marginTop: 20 }}>
        {params?.error ? <p className="err">Error: {params.error}</p> : <p className="muted">An unspecified error occurred. Please try again.</p>}
      </div>
      <div className="row-actions" style={{ marginTop: 24 }}>
        <Link href="/auth/login" className="btn btn-p">Back to log in</Link>
        <Link href="/" className="btn btn-q">Home</Link>
      </div>
    </AuthFrame>
  )
}
