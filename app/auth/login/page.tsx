'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Briefcase } from 'lucide-react'

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
    <div className="flex min-h-svh w-full bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40">
      {/* Left branding panel */}
      <div className="animate-fade-in hidden flex-col items-center justify-center bg-blue-600 px-12 text-white lg:flex lg:w-1/2">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-balance">Welcome back</h1>
          <p className="mt-4 text-lg leading-relaxed text-blue-100">
            Your job search is waiting. Log in to pick up right where you left off.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center p-6 sm:p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Pursuitz</span>
          </div>

          <div className="animate-scale-in rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-1 text-2xl font-bold text-slate-900">Login</h2>
            <p className="mb-8 text-sm text-slate-500">Enter your email and password to access your account</p>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-slate-200 focus-visible:ring-blue-500"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">{error}</p>
              )}
              <Button
                type="submit"
                className="h-11 w-full rounded-full bg-blue-600 font-semibold hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link href="/auth/sign-up" className="font-medium text-blue-600 hover:text-blue-700">
                  Sign up free
                </Link>
              </p>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By logging in you agree to our{' '}
            <Link href="/terms" className="underline hover:text-slate-600">Terms</Link> and{' '}
            <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
