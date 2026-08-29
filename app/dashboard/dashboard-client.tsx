'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { JobBoard } from '@/components/job-board'
import { AddJobDialog } from '@/components/add-job-dialog'
import { Stats } from '@/components/stats'
import { FilterToolbar } from '@/components/filter-toolbar'
import { QuickActionsMenu } from '@/components/quick-actions-menu'
import { TimelineView } from '@/components/timeline-view'
import { JobDetailDialog } from '@/components/job-detail-dialog'
import { Plus, Search, LayoutGrid, Baseline as Timeline, LogOut, Settings, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/brand-logo'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { Job, JobStatus } from '@/lib/types'
import { DOC_LIMITS } from '@/lib/document-limits'


interface DashboardClientProps {
  initialJobs: Job[]
  subscriptionTier?: string
  isPremium?: boolean
  documentsUsedThisMonth?: number
  userName?: string
}

export function DashboardClient({ 
  initialJobs, 
  subscriptionTier = 'free',
  isPremium = false,
  documentsUsedThisMonth = 0,
  userName,
}: DashboardClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'board' | 'timeline'>('board')
  const [hiddenStatuses, setHiddenStatuses] = useState<JobStatus[]>([])
  const [sortBy, setSortBy] = useState('dateApplied-desc')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [, startTransition] = useTransition()
  const [localDocsUsed, setLocalDocsUsed] = useState(documentsUsedThisMonth)
  const router = useRouter()

  // When the server re-renders with fresh token data (e.g. after payment or
  // admin tier change), sync local state so the counter ceiling is correct.
  useEffect(() => {
    setLocalDocsUsed(documentsUsedThisMonth)
  }, [documentsUsedThisMonth])

  const handleDocumentGenerated = () => {
    setLocalDocsUsed(prev => prev + 1)
  }

  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    jobs.forEach((job) => {
      job.tags?.forEach((tag: string) => tags.add(tag))
    })
    return Array.from(tags)
  }, [jobs])

  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter((job) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery.trim() ||
        job.company.toLowerCase().includes(query) ||
        job.position.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.notes?.toLowerCase().includes(query)

      const matchesStatus = !hiddenStatuses.includes(job.status)
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => job.tags?.includes(tag))

      return matchesSearch && matchesStatus && matchesTags
    })

    const [sortField, sortOrder] = sortBy.split('-')
    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      if (sortField === 'dateApplied') {
        aVal = new Date(a.dateApplied).getTime()
        bVal = new Date(b.dateApplied).getTime()
      } else if (sortField === 'company') {
        aVal = a.company.toLowerCase()
        bVal = b.company.toLowerCase()
      } else if (sortField === 'deadline') {
        aVal = a.deadline ? new Date(a.deadline).getTime() : Infinity
        bVal = b.deadline ? new Date(b.deadline).getTime() : Infinity
      }

      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })

    return filtered
  }, [jobs, searchQuery, hiddenStatuses, selectedTags, sortBy])

  const addJob = async (job: Omit<Job, 'id' | 'activityLog'>) => {
    const duplicate = jobs.find(
      (j) =>
        j.company.toLowerCase() === job.company.toLowerCase() &&
        j.position.toLowerCase() === job.position.toLowerCase()
    )

    if (duplicate) {
      const confirmAdd = confirm(
        `A similar job application already exists for ${job.company} - ${job.position}. Add anyway?`
      )
      if (!confirmAdd) return
    }

    startTransition(async () => {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      })

      if (response.ok) {
        const newJob = await response.json()
        setJobs([...jobs, newJob])
      }
    })
  }

  const updateJob = async (id: string, updates: Partial<Job>) => {
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        setJobs(jobs.map((job) => (job.id === id ? { ...job, ...updates } : job)))
      }
    })
  }

  const deleteJob = async (id: string) => {
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setJobs(jobs.filter((job) => job.id !== id))
      }
    })
  }

  const exportToCSV = () => {
    const headers = ['Company', 'Position', 'Status', 'Date Applied', 'Location', 'Salary', 'Tags', 'Notes']
    const rows = jobs.map((job) => [
      job.company,
      job.position,
      job.status,
      job.dateApplied,
      job.location || '',
      job.salary || '',
      job.tags?.join(', ') || '',
      job.notes?.replace(/\n/g, ' ') || '',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearRejected = () => {
    if (confirm('Are you sure you want to delete all rejected applications?')) {
      const rejected = jobs.filter((job) => job.status === 'rejected')
      rejected.forEach((job) => deleteJob(job.id))
    }
  }

  const archiveOld = () => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    if (confirm('Archive applications older than 3 months?')) {
      const old = jobs.filter((job) => new Date(job.dateApplied) < threeMonthsAgo)
      old.forEach((job) => deleteJob(job.id))
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="claude-grid pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-25" aria-hidden="true" />
      {/* ── Top navigation bar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
          {/* Brand + tier badge */}
          <div className="flex items-center gap-3">
            <BrandLogo markClassName="h-9 w-9 rounded-xl" wordmarkClassName="text-lg" />
            <span className="hidden text-xs text-muted-foreground md:inline">Job search workspace</span>
            <Badge
              variant={subscriptionTier === 'premium' ? 'default' : subscriptionTier === 'pro' ? 'secondary' : 'outline'}
              className={
                subscriptionTier === 'premium'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs'
                  : subscriptionTier === 'pro'
                  ? 'bg-blue-600 text-white border-0 text-xs'
                  : 'text-xs'
              }
            >
              {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
            </Badge>
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 sm:flex">
            <Button onClick={() => router.push('/dashboard/settings')} variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Account
            </Button>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <QuickActionsMenu
              jobs={jobs}
              onExportCSV={exportToCSV}
              onClearRejected={clearRejected}
              onArchiveOld={archiveOld}
            />
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Job
            </Button>
          </div>

          {/* Mobile: Add + menu toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="h-9 px-3">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Job</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsMobileMenuOpen((o) => !o)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {isMobileMenuOpen && (
          <div className="animate-fade-down border-t border-border bg-background px-4 pb-4 pt-3 sm:hidden">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Account
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => { router.push('/dashboard/settings'); setIsMobileMenuOpen(false) }}
                variant="outline"
                className="h-11 w-full justify-start"
              >
                <Settings className="mr-3 h-4 w-4" />
                Account Settings
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="h-11 w-full justify-start text-muted-foreground"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </Button>
              <QuickActionsMenu
                jobs={jobs}
                onExportCSV={exportToCSV}
                onClearRejected={clearRejected}
                onArchiveOld={archiveOld}
              />
            </div>
          </div>
        )}
      </header>

      {/* ── Main content ── */}
      <main className="relative mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        <section className="animate-fade-up flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              {new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
            </p>
            <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}{userName ? `, ${userName}` : ''}.
            </h1>
            <p className="mt-2 text-muted-foreground">
              {jobs.filter((job) => job.status === 'interview').length > 0
                ? `Your search is moving. You have ${jobs.filter((job) => job.status === 'interview').length} active interview${jobs.filter((job) => job.status === 'interview').length === 1 ? '' : 's'}.`
                : 'Keep your search moving by adding and updating applications.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add an application
          </Button>
        </section>

        <div className="mt-8 animate-fade-up">
          <Stats
            jobs={jobs}
            documentLimit={DOC_LIMITS[subscriptionTier]}
            documentsUsed={localDocsUsed}
          />
        </div>

        <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        {/* Search + view toggle row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search company, position, location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 sm:h-9"
            />
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'board' | 'timeline')}>
            <TabsList className="h-10 sm:h-9">
              <TabsTrigger value="board" className="gap-1.5 px-3">
                <LayoutGrid className="h-4 w-4" />
                <span>Board</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5 px-3">
                <Timeline className="h-4 w-4" />
                <span>Timeline</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filter toolbar */}
        <div className="mt-4 border-t border-border pt-4">
          <FilterToolbar
            hiddenStatuses={hiddenStatuses}
            onToggleStatus={(status) =>
              setHiddenStatuses((prev) =>
                prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
              )
            }
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedTags={selectedTags}
            availableTags={availableTags}
            onToggleTag={(tag) =>
              setSelectedTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              )
            }
          />
        </div>
        </div>

        {/* Board / timeline */}
        {viewMode === 'board' ? (
          <JobBoard jobs={filteredJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} />
        ) : (
          <TimelineView jobs={filteredJobs} onJobClick={setSelectedJob} />
        )}

        {/* Dialogs */}
        <AddJobDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddJob={addJob}
          isPremium={isPremium}
          subscriptionTier={subscriptionTier}
          documentsUsedThisMonth={localDocsUsed}
          onDocumentGenerated={handleDocumentGenerated}
        />

        {selectedJob && (
          <JobDetailDialog
            job={selectedJob}
            open={!!selectedJob}
            onOpenChange={(open) => !open && setSelectedJob(null)}
            onUpdateJob={(updates) => {
              updateJob(selectedJob.id, updates)
              setSelectedJob({ ...selectedJob, ...updates })
            }}
            onDeleteJob={() => {
              deleteJob(selectedJob.id)
              setSelectedJob(null)
            }}
            isPremium={isPremium}
            subscriptionTier={subscriptionTier}
            documentsUsedThisMonth={localDocsUsed}
            onDocumentGenerated={handleDocumentGenerated}
          />
        )}

        {/* Footer disclaimer */}
        <div className="mt-12 border-t border-border pb-8 pt-6">
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Pursuitz is a personal organisation tool only. Use of this service does not guarantee employment or job offers.
            AI-generated content including extracted job details, tailored resumes, and cover letters may contain inaccuracies — always review before submitting.
            Your data is stored securely and is never shared with third parties. We are not responsible for outcomes resulting from applications submitted using this tool.
          </p>
        </div>
      </main>
    </div>
  )
}
