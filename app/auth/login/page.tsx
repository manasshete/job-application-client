'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthFrame } from '@/components/pz/auth-frame'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Login failed')

      // Only follow same-site relative paths, never an external URL
      const redirectTo = params.get('redirectTo')
      router.push(redirectTo?.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/dashboard')
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthFrame title="Log in">
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <label className="fld">
          <span className="fl">Email</span>
          <input className="inp" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="fld">
          <span className="fl" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Password
            <Link href="/auth/forgot-password" className="link" style={{ fontWeight: 400 }}>Forgot password?</Link>
          </span>
          <input className="inp" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn btn-p" type="submit" style={{ minHeight: 44, width: '100%' }} disabled={isLoading}>
          {isLoading ? 'Logging in…' : 'Log in'}
        </button>
        <p className="muted" style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6 }}>
          By continuing you agree to our <Link href="/terms" className="link">Terms</Link> and <Link href="/privacy" className="link">Privacy Policy</Link>.
        </p>
        <p style={{ marginTop: 8, fontSize: 'var(--text-sm)' }}>
          <span className="muted">New to Pursuitz?</span> <Link href="/auth/sign-up" className="link">Create an account</Link>
        </p>
      </form>
    </AuthFrame>
  )
}

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
