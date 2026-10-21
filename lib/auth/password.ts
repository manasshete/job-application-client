import bcrypt from 'bcryptjs'

// Same algorithm Supabase Auth used, so migrated password hashes still verify.
const ROUNDS = 10

// Compared against when the email is unknown, so login timing doesn't reveal
// which emails have accounts.
const DUMMY_HASH = '$2b$10$uzoWZ.92HVaR3lLCrlJtgeHxPill9YhsBu4wbrtyH3.8XvWWwHDO.'

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS)
}

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  const ok = await bcrypt.compare(password, hash || DUMMY_HASH)
  return ok && !!hash
}

export const MIN_PASSWORD_LENGTH = 8
