'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminTestPage() {
  const [email, setEmail] = useState('admin@hireflow.test')
  const [password, setPassword] = useState('TestAdmin123!')
  const [tier, setTier] = useState<'free' | 'pro' | 'premium'>('premium')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const createTestAccount = async () => {
    setLoading(true)
    setMessage('')
    
    const supabase = createClient()
    
    try {
      // Try to sign up first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test Admin',
            subscription_tier: tier,
          },
        },
      })

      if (signUpError && !signUpError.message.includes('already registered')) {
        throw signUpError
      }

      // If already exists, just sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      // Update the profile to the selected tier
      if (signInData.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            subscription_tier: tier,
            subscription_status: 'active',
            documents_generated_this_month: 0,
            ai_extractions_used: 0,
          })
          .eq('id', signInData.user.id)

        if (updateError) {
          console.error('[v0] Profile update error:', updateError)
        }
      }

      setMessage(`Success! Logged in as ${email} with ${tier} tier. Redirecting...`)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const signInExisting = async () => {
    setLoading(true)
    setMessage('')
    
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setMessage('Signed in successfully! Redirecting...')
      setTimeout(() => router.push('/dashboard'), 1000)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Test Panel</CardTitle>
          <CardDescription>
            Create or sign into a test account with any subscription tier to test all features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier">Subscription Tier</Label>
            <Select value={tier} onValueChange={(v: any) => setTier(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro (£10/month)</SelectItem>
                <SelectItem value="premium">Premium (£20/month)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {message && (
            <p className={`text-sm ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={createTestAccount} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Loading...' : 'Create & Sign In'}
            </Button>
            <Button 
              onClick={signInExisting} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Sign In Only
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Note: This page is for testing only. Remove before production deployment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
