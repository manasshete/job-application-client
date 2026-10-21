'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthFrame } from '@/components/pz/auth-frame'

export default function Page() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSent(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthFrame title="Forgot password">
      {sent ? (
        <p role="status" style={{ marginTop: 20 }}>
          If an account exists for <b>{email}</b>, a reset link is on its way. It expires in 1 hour.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          <p className="muted" style={{ margin: 0 }}>Enter the email you signed up with.</p>
          <label className="fld">
            <span className="fl">Email</span>
            <input className="inp" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="btn btn-p" type="submit" style={{ minHeight: 44, width: '100%' }} disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
      <p style={{ marginTop: 24, fontSize: 'var(--text-sm)' }}>
        <Link href="/auth/login" className="link">Back to log in</Link>
      </p>
    </AuthFrame>
  )
}
