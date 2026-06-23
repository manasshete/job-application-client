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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase.rpc('consume_token', { p_token_type: tokenType })
  if (error) {
    console.error('[v0] Error consuming token:', error.message)
    return false
  }
  return data === true
}

/** Balances for both token types plus the next upcoming expiry date. */
export async function getTokenSummary(): Promise<TokenSummary> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
