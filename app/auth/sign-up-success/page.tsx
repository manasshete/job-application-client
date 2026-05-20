import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase, MailCheck } from 'lucide-react'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
          <MailCheck className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
        <p className="mt-3 text-slate-500">
          We&apos;ve sent a confirmation link to your email address. Please click it to activate your account before signing in.
        </p>
        <div className="mt-8">
          <Link href="/auth/login">
            <Button className="rounded-full bg-blue-600 px-8 hover:bg-blue-700">
              Go to Login
            </Button>
          </Link>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <Briefcase className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-700">JobTracker</span>
        </div>
      </div>
    </div>
  )
}
