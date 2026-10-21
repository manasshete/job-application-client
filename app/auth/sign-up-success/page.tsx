import Link from 'next/link'
import { AuthFrame } from '@/components/pz/auth-frame'

export default function Page() {
  return (
    <AuthFrame title="Check your email">
      <p className="muted" style={{ marginTop: 12 }}>We’ve sent a confirmation link to your email address. Click it to activate your account before signing in.</p>
      <div style={{ marginTop: 24 }}>
        <Link href="/auth/login" className="btn btn-p">Go to log in</Link>
      </div>
    </AuthFrame>
  )
}
