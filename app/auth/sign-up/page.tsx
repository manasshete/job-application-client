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
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      // 1. Validate email and check rate limits
      const validateRes = await fetch('/api/auth/validate-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const validateData = await validateRes.json()
      if (!validateData.valid) {
        setError(validateData.error || 'Signup validation failed')
        setIsLoading(false)
        return
      }

      const clientIp = validateData.ip

      // 2. Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError
      if (!authData.user?.id) throw new Error('No user ID returned')

      // 3. Log signup IP for abuse detection (fire-and-forget; never blocks signup)
      try {
        await fetch('/api/auth/log-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authData.user.id,
            ip: clientIp,
          }),
        })
      } catch {
        console.warn('[v0] Failed to log signup IP, but user was created')
      }

      // Supabase sends a native confirmation email; user must confirm before login.
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      kicker="Get started free"
      headline={
        <>
          Run your job search{' '}
          <span className="italic" style={{ color: 'oklch(0.82 0.12 250)' }}>
            smarter
          </span>
          .
        </>
      }
      subhead="Join thousands of job seekers who track applications, tailor CVs, and land more interviews."
      highlights={[
        { label: 'Free to start — no credit card needed' },
        { label: 'AI job extraction from any URL' },
        { label: 'Tailored resumes & cover letters' },
      ]}
    >
      <div
        className="anim-rise rounded-2xl border p-6 backdrop-blur-xl sm:p-8"
        style={AUTH_CARD_STYLE}
      >
        <h2 className="text-2xl font-semibold tracking-tight text-white">Create your account</h2>
        <p className="mb-8 mt-1.5 text-sm" style={{ color: '#767d8b' }}>
          Get started free — no credit card required.
        </p>

        <form onSubmit={handleSignUp} className="flex flex-col gap-5">
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
          <div className="grid gap-2">
            <Label htmlFor="repeat-password" className="text-[#c7cbd4]">Confirm Password</Label>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
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
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
          <p className="text-center text-sm" style={{ color: '#767d8b' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium" style={{ color: 'oklch(0.82 0.12 250)' }}>
              Login
            </Link>
          </p>
        </form>
      </div>

      <p className="mt-6 text-center text-xs" style={{ color: '#4b515e' }}>
        By signing up you agree to our{' '}
        <Link href="/terms" className="underline hover:text-[#9aa0ac]">Terms</Link> and{' '}
        <Link href="/privacy" className="underline hover:text-[#9aa0ac]">Privacy Policy</Link>.
      </p>
    </AuthShell>
  )
}
