'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthFrame } from '@/components/pz/auth-frame'
import { Note } from '@/components/pz/ui'
import { PLANS } from '@/lib/pz/plans'

function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  const chosen = params.get('plan') ?? params.get('tier')
  const plan = PLANS.find((p) => p.tier === chosen && p.tier !== 'free')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validates the email, checks IP limits, creates the account and logs in
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Sign up failed')

      router.push(plan ? `/dashboard/settings?checkout=${plan.tier}` : '/dashboard')
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthFrame title="Create your account">
      {plan && (
        <Note style={{ marginTop: 20 }}>
          You chose {plan.name} ({plan.price} {plan.per}). You will go to checkout after signing up.
        </Note>
      )}
      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <label className="fld">
          <span className="fl">Email</span>
          <input className="inp" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="fld">
          <span className="fl">Password</span>
          <input className="inp" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn btn-p" type="submit" style={{ minHeight: 44, width: '100%' }} disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
        <p className="muted" style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6 }}>
          By continuing you agree to our <Link href="/terms" className="link">Terms</Link> and <Link href="/privacy" className="link">Privacy Policy</Link>.
        </p>
        <p style={{ marginTop: 8, fontSize: 'var(--text-sm)' }}>
          <span className="muted">Already have an account?</span> <Link href="/auth/login" className="link">Log in</Link>
        </p>
      </form>
    </AuthFrame>
  )
}

export default function Page() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
