import { SignJWT, jwtVerify } from 'jose'

/**
 * JWT session shared by the app and the database.
 *
 * The token is signed with the Supabase project's JWT secret and carries
 * role 'authenticated' + sub = user id, so it doubles as the Supabase access
 * token: PostgREST accepts it and auth.uid() resolves to the logged-in user,
 * keeping every RLS policy and SECURITY DEFINER function working.
 *
 * Edge-safe (no Node APIs) so it can run in proxy.ts.
 */

export const SESSION_COOKIE = 'session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface SessionUser {
  id: string
  email: string
}

/** Claims verified from the JWT alone; `tokenVersion` is checked against the DB. */
export interface SessionClaims extends SessionUser {
  tokenVersion: number
}

function getSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function signSession(user: SessionUser, tokenVersion: number): Promise<string> {
  return new SignJWT({ email: user.email, role: 'authenticated', tv: tokenVersion })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.id)
    .setAudience('authenticated')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret())
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
      audience: 'authenticated',
    })
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null
    // Tokens without `tv` (e.g. issued by Supabase Auth directly) are not ours
    if (typeof payload.tv !== 'number') return null
    return { id: payload.sub, email: payload.email, tokenVersion: payload.tv }
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
}
