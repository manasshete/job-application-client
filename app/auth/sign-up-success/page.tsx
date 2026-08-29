import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrendingUp, MailCheck } from 'lucide-react'

const BG = '#08090c'

export default function Page() {
  return (
    <div
      className="dark relative flex min-h-svh w-full items-center justify-center overflow-hidden p-6 font-sans"
      style={{ background: BG, color: '#f3f4f6' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(circle at 50% 30%, black, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black, transparent 72%)',
        }}
      />
      <div
        aria-hidden="true"
        className="anim-glow pointer-events-none absolute left-1/2 top-[-8rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, oklch(0.72 0.16 250 / .28), transparent 65%)' }}
      />

      <div className="anim-rise relative z-10 w-full max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'oklch(0.72 0.16 250 / .14)', color: 'oklch(0.86 0.1 250)' }}
        >
          <MailCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Check your email</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: '#9aa0ac' }}>
          We&apos;ve sent a confirmation link to your email address. Click it to activate your account before signing in.
        </p>
        <div className="mt-8">
          <Link href="/auth/login">
            <Button
              className="rounded-full px-8 font-semibold text-[#08090c] hover:opacity-90"
              style={{ background: 'oklch(0.72 0.16 250)' }}
            >
              Go to Login
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'oklch(0.72 0.16 250)', color: BG }}
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold text-[#c7cbd4]">Pursuitz</span>
        </div>
      </div>
    </div>
  )
}
