import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

const BG = '#08090c'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

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
        className="pointer-events-none absolute left-1/2 top-[-8rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,.16), transparent 65%)' }}
      />

      <div className="anim-rise relative z-10 w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Something went wrong</h1>
        {params?.error ? (
          <p className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Error: {params.error}
          </p>
        ) : (
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: '#9aa0ac' }}>
            An unspecified error occurred. Please try again.
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/auth/login">
            <Button
              className="rounded-full px-6 font-semibold text-[#08090c] hover:opacity-90"
              style={{ background: 'oklch(0.72 0.16 250)' }}
            >
              Back to Login
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              className="rounded-full border-white/15 bg-transparent px-6 text-[#c7cbd4] hover:bg-white/5 hover:text-white"
            >
              Home
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex justify-center">
          <BrandLogo markClassName="h-7 w-7" wordmarkClassName="text-sm text-[#c7cbd4]" />
        </div>
      </div>
    </div>
  )
}
