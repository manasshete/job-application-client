'use client'

import { useState, useEffect, useMemo } from 'react'
import { JobBoard } from '@/components/job-board'
import { AddJobDialog } from '@/components/add-job-dialog'
import { Stats } from '@/components/stats'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type JobStatus = 'applied' | 'interview' | 'offer' | 'rejected'

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
}

export default function Page() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs
    
    const query = searchQuery.toLowerCase()
    return jobs.filter(
      (job) =>
        job.company.toLowerCase().includes(query) ||
        job.position.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.notes?.toLowerCase().includes(query)
    )
  }, [jobs, searchQuery])

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

  const addJob = (job: Omit<Job, 'id'>) => {
    const newJob: Job = {
      ...job,
      id: crypto.randomUUID(),
    }
    setJobs([...jobs, newJob])
  }

  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs(jobs.map((job) => (job.id === id ? { ...job, ...updates } : job)))
  }

  const deleteJob = (id: string) => {
    setJobs(jobs.filter((job) => job.id !== id))
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
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Job
          </Button>
        </div>

        <Stats jobs={jobs} />

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by company, position, location, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <JobBoard jobs={filteredJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} />

        <AddJobDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddJob={addJob}
        />
      </div>
    </div>
  )
}
