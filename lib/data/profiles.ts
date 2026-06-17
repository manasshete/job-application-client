import { createClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/lib/subscription'

export interface Profile {
  id: string
  email: string | undefined
  full_name: string | null
  subscription_tier: SubscriptionTier
  subscription_status: string | null
  stripe_customer_id: string | null
  ai_extractions_used: number
  documents_generated_this_month: number
  created_at: string
  updated_at: string
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[v0] Error fetching profile:', error)
    return null
  }

  return {
    ...data,
    email: user.email,
  }
}

export async function updateProfile(updates: Partial<Profile>): Promise<{ error: Error | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not authenticated') }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    console.error('[v0] Error updating profile:', error)
    return { error: new Error(error.message) }
  }

  return { error: null }
}

export async function incrementAIExtractionCount(): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.rpc('increment_ai_extractions', { user_id: user.id })
}

export async function incrementDocumentGenerationCount(): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Use the SECURITY DEFINER RPC: direct profile column writes are revoked
  // for the user-scoped client to prevent users tampering with usage counters.
  await supabase.rpc('increment_documents_generated', { p_user_id: user.id })
}
