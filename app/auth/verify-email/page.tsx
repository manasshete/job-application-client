'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    const verify = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('verify_email', {
          p_token: token,
        })

        if (error || !data?.success) {
          setStatus('error')
          setMessage(data?.error || 'Verification failed. The link may have expired.')
        } else {
          setStatus('success')
          setMessage('Email verified successfully!')
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } catch (err) {
        setStatus('error')
        setMessage('An error occurred during verification')
        console.error('[v0] Verification error:', err)
      }
    }

    verify()
  }, [token, router])

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {status === 'loading' && (
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900">Verifying email...</h2>
              <p className="mt-2 text-slate-500">Please wait while we confirm your email address</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900">Email verified!</h2>
              <p className="mt-2 text-slate-500 mb-6">{message}</p>
              <p className="text-sm text-slate-400">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900">Verification failed</h2>
              <p className="mt-2 text-slate-500 mb-6">{message}</p>
              <Button
                onClick={() => router.push('/auth/sign-up')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Try signing up again
              </Button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Having issues?{' '}
          <a href="mailto:support@pursuitz.com" className="underline hover:text-slate-600">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
