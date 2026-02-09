'use client'

import { useState, useEffect, useMemo } from 'react'
import { JobBoard } from '@/components/job-board'
import { AddJobDialog } from '@/components/add-job-dialog'
import { Stats } from '@/components/stats'
import { FilterToolbar } from '@/components/filter-toolbar'
import { QuickActionsMenu } from '@/components/quick-actions-menu'
import { WeeklySummary } from '@/components/weekly-summary'
import { TimelineView } from '@/components/timeline-view'
import { JobDetailDialog } from '@/components/job-detail-dialog'
import { Plus, Search, LayoutGrid, Baseline as Timeline } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type JobStatus = 'applied' | 'interview' | 'offer' | 'rejected'

export type InterviewStatus = 'scheduled' | 'completed' | 'pending'
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'submitted'

export interface Interview {
  id: string
  round: string
  date?: string
  status: InterviewStatus
  notes?: string
}

export interface Task {
  id: string
  title: string
  dueDate?: string
  status: TaskStatus
  notes?: string
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  action: string
  oldValue?: string
  newValue?: string
}

export interface Job {
  id: string
  company: string
  position: string
  status: JobStatus
  dateApplied: string
  salary?: string
  location?: string
  notes?: string
  jobUrl?: string
  interviews?: Interview[]
  tasks?: Task[]
  deadline?: string
  recruiterName?: string
  recruiterEmail?: string
  tags?: string[]
  activityLog?: ActivityLogEntry[]
}

export default function Page() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'board' | 'timeline'>('board')
  const [hiddenStatuses, setHiddenStatuses] = useState<JobStatus[]>([])
  const [sortBy, setSortBy] = useState('dateApplied-desc')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  // Get all available tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    jobs.forEach((job) => {
      job.tags?.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags)
  }, [jobs])

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter((job) => {
      // Search filter
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery.trim() ||
        job.company.toLowerCase().includes(query) ||
        job.position.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.notes?.toLowerCase().includes(query)

      // Status filter
      const matchesStatus = !hiddenStatuses.includes(job.status)

      // Tag filter
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => job.tags?.includes(tag))

      return matchesSearch && matchesStatus && matchesTags
    })

    // Sort
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

  // Load jobs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('job-tracker-jobs')
    if (stored) {
      try {
        setJobs(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored jobs:', e)
      }
    }
  }, [])

  // Save jobs to localStorage whenever they change
  useEffect(() => {
    if (jobs.length > 0) {
      localStorage.setItem('job-tracker-jobs', JSON.stringify(jobs))
    }
  }, [jobs])

  const addJob = (job: Omit<Job, 'id' | 'activityLog'>) => {
    // Duplicate detection
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

    const newJob: Job = {
      ...job,
      id: crypto.randomUUID(),
      activityLog: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'Created',
          newValue: 'Applied',
        },
      ],
    }
    setJobs([...jobs, newJob])
  }

  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs(
      jobs.map((job) => {
        if (job.id === id) {
          const activityLog = job.activityLog || []
          
          // Log status changes
          if (updates.status && updates.status !== job.status) {
            activityLog.push({
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              action: 'Status Changed',
              oldValue: job.status,
              newValue: updates.status,
            })
          }

          return { ...job, ...updates, activityLog }
        }
        return job
      })
    )
  }

  const deleteJob = (id: string) => {
    setJobs(jobs.filter((job) => job.id !== id))
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
      setJobs(jobs.filter((job) => job.status !== 'rejected'))
    }
  }

  const archiveOld = () => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    if (confirm('Archive applications older than 3 months?')) {
      setJobs(jobs.filter((job) => new Date(job.dateApplied) >= threeMonthsAgo))
    }
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
