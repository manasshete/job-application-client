'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'
import { fetcher, TabLoading, TabError } from './shared'

type AdminUser = {
  id: string
  email: string | null
  full_name: string | null
  subscription_tier: string | null
  subscription_status: string | null
  is_admin: boolean
  ai_tokens_remaining: number | null
  document_tokens_remaining: number | null
  created_at: string
}

const TIER_VARIANT: Record<string, 'secondary' | 'default' | 'outline'> = {
  free: 'outline',
  pro: 'secondary',
  premium: 'default',
}

export function AccountManager() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const { data, error, isLoading } = useSWR<{ users: AdminUser[] }>(
    `/api/admin/users?search=${encodeURIComponent(query)}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Pending tier selection per user id
  const [pendingTier, setPendingTier] = useState<Record<string, string>>({})
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null)
  const [confirmTier, setConfirmTier] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setQuery(search.trim())
  }

  function requestChange(user: AdminUser, tier: string) {
    if (tier === (user.subscription_tier ?? 'free')) return
    setConfirmUser(user)
    setConfirmTier(tier)
    setActionError(null)
  }

  async function applyChange() {
    if (!confirmUser) return
    setSubmitting(true)
    setActionError(null)
    try {
      const res = await fetch('/api/admin/users/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: confirmUser.id, tier: confirmTier }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to update subscription')

      // Refresh the user list and metrics
      await mutate(`/api/admin/users?search=${encodeURIComponent(query)}`)
      setConfirmUser(null)
      setPendingTier((prev) => {
        const next = { ...prev }
        delete next[confirmUser.id]
        return next
      })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Account Management</CardTitle>
        <CardDescription>
          Search for an account and change its subscription tier. All changes are logged.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {isLoading ? (
          <TabLoading />
        ) : error ? (
          <TabError message={error.message} />
        ) : (data?.users.length ?? 0) === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No accounts found.
          </p>
        ) : (
          <div className="divide-y rounded-md border">
            {data!.users.map((user) => {
              const currentTier = user.subscription_tier ?? 'free'
              const selected = pendingTier[user.id] ?? currentTier
              return (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">
                        {user.full_name || user.email || 'Unknown user'}
                      </p>
                      {user.is_admin ? (
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant={TIER_VARIANT[currentTier] ?? 'outline'} className="capitalize">
                        {currentTier}
                      </Badge>
                      <span>{user.ai_tokens_remaining ?? 0} AI tokens left</span>
                      <span>{user.document_tokens_remaining ?? 0} doc tokens left</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={selected}
                      onValueChange={(v) =>
                        setPendingTier((prev) => ({ ...prev, [user.id]: v }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={selected === currentTier}
                      onClick={() => requestChange(user, selected)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={!!confirmUser} onOpenChange={(open) => !open && setConfirmUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm subscription change</DialogTitle>
            <DialogDescription>
              This will immediately change the account&apos;s access level.
            </DialogDescription>
          </DialogHeader>
          {confirmUser ? (
            <div className="flex items-center justify-center gap-3 py-2 text-sm">
              <Badge
                variant={TIER_VARIANT[confirmUser.subscription_tier ?? 'free'] ?? 'outline'}
                className="capitalize"
              >
                {confirmUser.subscription_tier ?? 'free'}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant={TIER_VARIANT[confirmTier] ?? 'outline'} className="capitalize">
                {confirmTier}
              </Badge>
            </div>
          ) : null}
          <p className="text-center text-sm text-muted-foreground">
            {confirmUser?.email}
          </p>
          {actionError ? (
            <p className="text-center text-sm text-destructive">{actionError}</p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUser(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={applyChange} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm change'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
