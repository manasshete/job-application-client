import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase, AlertCircle } from 'lucide-react'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
        {params?.error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Error: {params.error}
          </p>
        ) : (
          <p className="mt-3 text-slate-500">An unspecified error occurred. Please try again.</p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/auth/login">
            <Button className="rounded-full bg-blue-600 px-6 hover:bg-blue-700">Back to Login</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="rounded-full px-6 border-slate-200">Home</Button>
          </Link>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <Briefcase className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-700">HireFlow</span>
        </div>
      </div>
    </div>
  )
}
