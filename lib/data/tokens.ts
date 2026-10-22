import { getCurrentUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/admin/service-client'

/**
 * 60-DAY TOKEN LEDGER (client-facing helpers)
 *
 * Tokens are granted in batches that each expire 60 days from their grant date.
 * Balance = sum of `remaining` across all non-expired batches.
 * Spending always drains the oldest-expiring batch first (handled in SQL).
 */

export const TOKEN_VALIDITY_DAYS = 60

export type TokenType = 'ai_extraction' | 'document_generation'

export interface TokenBatch {
  id: string
  token_type: TokenType
  granted: number
  remaining: number
  source: string
  granted_at: string
  expires_at: string
}

export interface TokenSummary {
  aiExtractionBalance: number
  documentGenerationBalance: number
  /** ISO date of the soonest-expiring batch that still has tokens, or null. */
  nextExpiry: string | null
}

/** Total still-valid tokens of a type for the current user. */
export async function getTokenBalance(tokenType: TokenType): Promise<number> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return 0

  const { data, error } = await supabase.rpc('get_token_balance', { p_token_type: tokenType })
  if (error) {
    console.error('[v0] Error fetching token balance:', error.message)
    return 0
  }
  return typeof data === 'number' ? data : 0
}

/**
 * Atomically consume one token of the given type from the current user's
 * oldest-expiring valid batch. Returns true if a token was spent, false if
 * the balance is exhausted (caller should then reject with a limit error).
 */
export async function consumeToken(tokenType: TokenType): Promise<boolean> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return false

  const { data, error } = await supabase.rpc('consume_token', { p_token_type: tokenType })
  if (error) {
    console.error('[v0] Error consuming token:', error.message)
    return false
  }
  return data === true
}

/**
 * Give back one token that was reserved with consumeToken() when the work it
 * paid for failed. Granted as a fresh batch via the service role.
 */
export async function refundToken(userId: string, tokenType: TokenType): Promise<void> {
  const { error } = await grantTokens(userId, tokenType, 1, 'refund')
  if (error) console.error('[v0] Token refund failed for user', userId, error.message)
}

/** Balances for both token types plus the next upcoming expiry date. */
export async function getTokenSummary(): Promise<TokenSummary> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) {
    return { aiExtractionBalance: 0, documentGenerationBalance: 0, nextExpiry: null }
  }

  const { data, error } = await supabase
    .from('token_batches')
    .select('token_type, remaining, expires_at')
    .eq('user_id', user.id)
    .gt('remaining', 0)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  if (error || !data) {
    console.error('[v0] Error fetching token summary:', error?.message)
    return { aiExtractionBalance: 0, documentGenerationBalance: 0, nextExpiry: null }
  }

  let aiExtractionBalance = 0
  let documentGenerationBalance = 0
  for (const batch of data) {
    if (batch.token_type === 'ai_extraction') aiExtractionBalance += batch.remaining
    else if (batch.token_type === 'document_generation') documentGenerationBalance += batch.remaining
  }

  return {
    aiExtractionBalance,
    documentGenerationBalance,
    nextExpiry: data.length > 0 ? data[0].expires_at : null,
  }
}

export interface TokenBatchRow {
  /** Day the batch was added, YYYY-MM-DD (UTC). */
  added: string
  /** Day it expires, YYYY-MM-DD (UTC). */
  expires: string
  extractions: number
  documents: number
}

/** Still-valid tokens grouped by the day they were added, oldest first. */
export async function getTokenBatches(): Promise<TokenBatchRow[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('token_batches')
    .select('token_type, remaining, granted_at, expires_at')
    .eq('user_id', user.id)
    .gt('remaining', 0)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  if (error || !data) {
    console.error('[v0] Error fetching token batches:', error?.message)
    return []
  }

  const rows = new Map<string, TokenBatchRow>()
  for (const batch of data) {
    const added = String(batch.granted_at).slice(0, 10)
    const row = rows.get(added) ?? { added, expires: String(batch.expires_at).slice(0, 10), extractions: 0, documents: 0 }
    if (batch.token_type === 'ai_extraction') row.extractions += batch.remaining
    else if (batch.token_type === 'document_generation') row.documents += batch.remaining
    rows.set(added, row)
  }
  return [...rows.values()]
}

/**
 * Zero out ALL existing token batches for a user (both types).
 * Used when an admin changes a user's subscription tier so the user starts
 * fresh at the new tier's limits with no leftover tokens from the old tier.
 * Service-role only.
 */
export async function resetUserTokens(userId: string): Promise<{ error: Error | null }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('token_batches')
    .update({ remaining: 0 })
    .eq('user_id', userId)
    .gt('remaining', 0)
  if (error) {
    console.error('[v0] Error resetting user tokens:', error.message)
    return { error: new Error(error.message) }
  }
  return { error: null }
}

/**
 * Grant a batch of tokens to a user, valid for 60 days. Service-role only —
 * must ONLY be called from trusted server code after verifying entitlement
 * (e.g. a confirmed payment). Never expose to the client.
 */
export async function grantTokens(
  userId: string,
  tokenType: TokenType,
  amount: number,
  source: string,
): Promise<{ error: Error | null }> {
  if (amount <= 0) return { error: null }
  const admin = createAdminClient()
  const { error } = await admin.rpc('grant_tokens', {
    p_user_id: userId,
    p_token_type: tokenType,
    p_amount: amount,
    p_source: source,
  })
  if (error) {
    console.error('[v0] Error granting tokens:', error.message)
    return { error: new Error(error.message) }
  }
  return { error: null }
}
