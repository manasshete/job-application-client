'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthFrame } from '@/components/pz/auth-frame'

function ResetForm() {
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const token = params.get('token') ?? ''
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      router.push('/auth/login')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthFrame title="Choose a new password">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <label className="fld">
          <span className="fl">New password</span>
          <input className="inp" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="fld">
          <span className="fl">Confirm password</span>
          <input className="inp" type="password" autoComplete="new-password" required value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
        </label>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn btn-p" type="submit" style={{ minHeight: 44, width: '100%' }} disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
      <p style={{ marginTop: 24, fontSize: 'var(--text-sm)' }}>
        Link expired? <Link href="/auth/forgot-password" className="link">Request a new one</Link>
      </p>
    </AuthFrame>
  )
}

export default function Page() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
