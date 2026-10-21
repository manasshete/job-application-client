import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session'

// Protect dashboard, settings and admin routes. Admin authorization itself
// (the is_admin check) is enforced server-side in the /admin page and in
// every /api/admin route; this only ensures unauthenticated users are sent
// to login first.
const protectedRoutes = ['/dashboard', '/settings', '/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  if (!isProtectedRoute) return NextResponse.next()

  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  if (user) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = '/auth/login'
  url.searchParams.set('redirectTo', pathname)
  const response = NextResponse.redirect(url)
  // Drop an expired or tampered cookie
  response.cookies.delete(SESSION_COOKIE)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
