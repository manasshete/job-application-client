import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle error callback (e.g., email already exists, etc.)
  if (error) {
    const errorMessage = error_description || error
    const url = new URL('/auth/error', request.url)
    url.searchParams.set('message', errorMessage)
    return NextResponse.redirect(url)
  }

  // If no code, redirect to home (shouldn't happen, but just in case)
  if (!code) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  // Exchange the code for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    // Redirect to error page if session exchange fails
    const url = new URL('/auth/error', request.url)
    url.searchParams.set('message', exchangeError.message)
    return NextResponse.redirect(url)
  }

  // Success! Redirect to home page
  return NextResponse.redirect(new URL('/', request.url))
}
