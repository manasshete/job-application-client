'use client'

import { useState, useMemo, useTransition } from 'react'
import { JobBoard } from '@/components/job-board'
import { AddJobDialog } from '@/components/add-job-dialog'
import { Stats } from '@/components/stats'
import { FilterToolbar } from '@/components/filter-toolbar'
import { QuickActionsMenu } from '@/components/quick-actions-menu'
import { WeeklySummary } from '@/components/weekly-summary'
import { TimelineView } from '@/components/timeline-view'
import { JobDetailDialog } from '@/components/job-detail-dialog'
import { Plus, Search, LayoutGrid, Baseline as Timeline, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Job, JobStatus } from '../page'

interface DashboardClientProps {
  initialJobs: Job[]
}

export function DashboardClient({ initialJobs }: DashboardClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'board' | 'timeline'>('board')
  const [hiddenStatuses, setHiddenStatuses] = useState<JobStatus[]>([])
  const [sortBy, setSortBy] = useState('dateApplied-desc')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    jobs.forEach((job) => {
      job.tags?.forEach((tag) => tags.add(tag))
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Job Application Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and track your job applications in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        <Stats jobs={jobs} />
        <WeeklySummary jobs={jobs} />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by company, position, location, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="board" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <Timeline className="h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-6">
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

        {viewMode === 'board' ? (
          <JobBoard jobs={filteredJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} />
        ) : (
          <TimelineView jobs={filteredJobs} onJobClick={setSelectedJob} />
        )}

        <AddJobDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddJob={addJob}
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
          />
        )}
      </div>
    </div>
  )
}
