'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthShell, AUTH_CARD_STYLE } from '@/components/auth/auth-shell'

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      kicker="Welcome back"
      headline={
        <>
          Pick up right where{' '}
          <span className="italic" style={{ color: 'oklch(0.82 0.12 250)' }}>
            you left off
          </span>
          .
        </>
      }
      subhead="Log back into your workspace to keep every application, interview, and offer moving forward."
    >
      <div
        className="anim-rise rounded-2xl border p-6 backdrop-blur-xl sm:p-8"
        style={AUTH_CARD_STYLE}
      >
        <h2 className="text-2xl font-semibold tracking-tight text-white">Log in</h2>
        <p className="mb-8 mt-1.5 text-sm" style={{ color: '#767d8b' }}>
          Enter your email and password to access your account.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-[#c7cbd4]">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-[#5b616e]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-[#c7cbd4]">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-white/10 bg-white/5 text-white placeholder:text-[#5b616e]"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="h-11 w-full rounded-full font-semibold text-[#08090c] hover:opacity-90"
            style={{ background: 'oklch(0.72 0.16 250)' }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-center text-sm" style={{ color: '#767d8b' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="font-medium" style={{ color: 'oklch(0.82 0.12 250)' }}>
              Sign up free
            </Link>
          </p>
        </form>
      </div>

      <p className="mt-6 text-center text-xs" style={{ color: '#4b515e' }}>
        By logging in you agree to our{' '}
        <Link href="/terms" className="underline hover:text-[#9aa0ac]">Terms</Link> and{' '}
        <Link href="/privacy" className="underline hover:text-[#9aa0ac]">Privacy Policy</Link>.
      </p>
    </AuthShell>
  )
}
