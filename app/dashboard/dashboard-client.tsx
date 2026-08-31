'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, BriefcaseBusiness, Clock3, FileText, LayoutGrid, LogOut, Menu, Plus, Search, Settings, Sparkles, X } from 'lucide-react'
import { JobBoard } from '@/components/job-board'
import { AddJobDialog } from '@/components/add-job-dialog'
import { FilterToolbar } from '@/components/filter-toolbar'
import { QuickActionsMenu } from '@/components/quick-actions-menu'
import { TimelineView } from '@/components/timeline-view'
import { DocumentGeneratorDialog } from '@/components/document-generator-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import type { Job, JobStatus } from '@/lib/types'
import { DashboardTheme } from './dashboard-theme'

interface DashboardClientProps {
  initialJobs: Job[]
  subscriptionTier?: string
  isPremium?: boolean
  documentsUsedThisMonth?: number
  userName?: string
  userEmail?: string
  extractionTokens?: number
  documentTokens?: number
  nextTokenExpiry?: string | null
}

const statuses: JobStatus[] = ['applied', 'interview', 'offer', 'accepted', 'rejected']
const labels: Record<JobStatus, string> = { applied: 'Applied', interview: 'Interview', offer: 'Offer', accepted: 'Accepted', rejected: 'Rejected' }

export function DashboardClient({ initialJobs, subscriptionTier = 'free', isPremium = false, documentsUsedThisMonth = 0, userName, userEmail, extractionTokens = 0, documentTokens = 0, nextTokenExpiry }: DashboardClientProps) {
  const [jobs, setJobs] = useState(initialJobs)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all')
  const [hiddenStatuses, setHiddenStatuses] = useState<JobStatus[]>([])
  const [sortBy, setSortBy] = useState('dateApplied-desc')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'board' | 'timeline'>('board')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDocumentPickerOpen, setIsDocumentPickerOpen] = useState(false)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [documentJob, setDocumentJob] = useState<Job | null>(null)
  const [warningVisible, setWarningVisible] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [localDocsUsed, setLocalDocsUsed] = useState(documentsUsedThisMonth)
  const [, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => setLocalDocsUsed(documentsUsedThisMonth), [documentsUsedThisMonth])

  const availableTags = useMemo(() => Array.from(new Set(jobs.flatMap((job) => job.tags ?? []))), [jobs])
  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const [field, direction] = sortBy.split('-')
    return jobs.filter((job) => {
      const haystack = `${job.company} ${job.position} ${job.location ?? ''} ${job.notes ?? ''}`.toLowerCase()
      return (!query || haystack.includes(query)) && (statusFilter === 'all' || job.status === statusFilter) && !hiddenStatuses.includes(job.status) && (!selectedTags.length || selectedTags.some((tag) => job.tags?.includes(tag)))
    }).sort((a, b) => {
      const values = field === 'company' ? [a.company.toLowerCase(), b.company.toLowerCase()] : field === 'deadline' ? [a.deadline ? new Date(a.deadline).getTime() : Infinity, b.deadline ? new Date(b.deadline).getTime() : Infinity] : [new Date(a.dateApplied).getTime(), new Date(b.dateApplied).getTime()]
      const result = values[0] > values[1] ? 1 : values[0] < values[1] ? -1 : 0
      return direction === 'asc' ? result : -result
    })
  }, [jobs, searchQuery, statusFilter, hiddenStatuses, selectedTags, sortBy])

  const addJob = async (job: Omit<Job, 'id' | 'activityLog'>) => {
    if (jobs.some((item) => item.company.toLowerCase() === job.company.toLowerCase() && item.position.toLowerCase() === job.position.toLowerCase()) && !confirm(`A similar application exists for ${job.company}. Add anyway?`)) return
    startTransition(async () => {
      const response = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job) })
      if (response.ok) {
        const createdJob = await response.json()
        setJobs((current) => [...current, createdJob])
      }
    })
  }
  const updateJob = (id: string, updates: Partial<Job>) => startTransition(async () => {
    const response = await fetch(`/api/jobs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    if (response.ok) setJobs((current) => current.map((job) => job.id === id ? { ...job, ...updates } : job))
  })
  const deleteJob = (id: string) => startTransition(async () => {
    const response = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
    if (response.ok) setJobs((current) => current.filter((job) => job.id !== id))
  })
  const exportToCSV = () => {
    const rows = [['Company', 'Position', 'Status', 'Date Applied', 'Location', 'Salary'], ...jobs.map((job) => [job.company, job.position, job.status, job.dateApplied, job.location ?? '', job.salary ?? ''])]
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')], { type: 'text/csv' }))
    const link = document.createElement('a'); link.href = url; link.download = 'pursuitz-applications.csv'; link.click(); URL.revokeObjectURL(url)
  }
  const handleSignOut = async () => { await createClient().auth.signOut(); router.push('/') }
  const scheduledRounds = jobs.reduce((count, job) => count + (job.interviews?.filter((interview) => interview.status === 'scheduled').length ?? 0), 0)
  const interviews = jobs.filter((job) => job.status === 'interview').length
  const offers = jobs.filter((job) => job.status === 'offer' || job.status === 'accepted').length
  const accepted = jobs.filter((job) => job.status === 'accepted').length
  const active = jobs.filter((job) => !['rejected', 'accepted'].includes(job.status)).length
  const responses = jobs.filter((job) => job.status !== 'applied').length
  const responseRate = jobs.length ? Math.round((responses / jobs.length) * 100) : 0
  const maxTokens = subscriptionTier === 'free' ? 10 : 100
  const lowTokens = extractionTokens <= Math.max(3, maxTokens * 0.15) || documentTokens <= Math.max(3, maxTokens * 0.15)
  const expiryLabel = nextTokenExpiry ? new Date(nextTokenExpiry).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'No active batch'
  const openDocuments = () => jobs.length ? setIsDocumentPickerOpen(true) : setIsAddDialogOpen(true)

  return (
    <main className="dashboard-shell">
      <DashboardTheme />
      <aside className={`dashboard-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="dashboard-brand"><span><i /></span><strong>Pursuitz</strong><em>{subscriptionTier.toUpperCase()}</em></div>
        <nav aria-label="Dashboard navigation">
          <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => { setStatusFilter('all'); setViewMode('board') }}><BriefcaseBusiness /><span>Board</span><small>{jobs.length}</small></button>
          <button className={statusFilter === 'interview' ? 'active' : ''} onClick={() => { setStatusFilter('interview'); setViewMode('board') }}><Clock3 /><span>Interviews</span><small>{interviews}</small></button>
          <button onClick={() => setViewMode('timeline')} className={viewMode === 'timeline' ? 'active' : ''}><BarChart3 /><span>Timeline</span></button>
          <button onClick={openDocuments}><FileText /><span>Documents</span><small>{documentTokens}</small></button>
          <button onClick={() => router.push('/dashboard/settings')}><Settings /><span>Settings</span></button>
        </nav>
        <div className="dashboard-side-bottom">
          <section className="dashboard-tokens">
            <h2>Tokens · 60-day</h2>
            <div><span>Extraction</span><b>{extractionTokens} / {maxTokens}</b></div><progress max={maxTokens} value={Math.min(extractionTokens, maxTokens)} />
            <div><span>Documents</span><b>{documentTokens} / {maxTokens}</b></div><progress max={maxTokens} value={Math.min(documentTokens, maxTokens)} />
            <p>Next batch expires {expiryLabel}</p><button onClick={() => router.push('/dashboard/settings')}>Top up</button>
          </section>
          <div className="dashboard-profile"><span>{(userName || userEmail || 'U').charAt(0).toUpperCase()}</span><div><b>{userName || 'Pursuitz user'}</b><small>{userEmail || subscriptionTier}</small></div><button onClick={handleSignOut} aria-label="Sign out"><LogOut /></button></div>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <button className="dashboard-menu-button" onClick={() => setMobileNavOpen((value) => !value)} aria-label="Toggle navigation">{mobileNavOpen ? <X /> : <Menu />}</button>
          <div><h1>Application board</h1><p>Track every role from first click to signed offer.</p></div>
          <div className="dashboard-top-actions"><label><Search /><span className="sr-only">Search applications</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search company, role, location" /></label><Button onClick={() => setIsAddDialogOpen(true)}><Plus />Add via link</Button><QuickActionsMenu jobs={jobs} onExportCSV={exportToCSV} onClearRejected={() => confirm('Delete all rejected applications?') && jobs.filter((job) => job.status === 'rejected').forEach((job) => deleteJob(job.id))} onArchiveOld={() => confirm('Archive applications older than 3 months?') && jobs.filter((job) => new Date(job.dateApplied) < new Date(Date.now() - 7889400000)).forEach((job) => deleteJob(job.id))} /></div>
        </header>
        {warningVisible && lowTokens && <div className="dashboard-warning"><i /><div><b>Tokens are running low</b><p>Tokens are spent oldest-first and expire 60 days after they land. Top up to keep tailoring.</p></div><Button onClick={() => router.push('/dashboard/settings')}>Top up</Button><button onClick={() => setWarningVisible(false)} aria-label="Dismiss warning"><X /></button></div>}
        <div className="dashboard-board-wrap">
          <section className="dashboard-stats" aria-label="Application statistics">
            <div><span>On board</span><b>{jobs.length}</b><small>unlimited</small></div><div><span>Active</span><b>{active}</b><small>in play</small></div><div className="cyan"><span>Interviewing</span><b>{interviews}</b><small>{scheduledRounds} rounds booked</small></div><div className="green"><span>Offers</span><b>{offers}</b><small>{accepted} accepted</small></div><div><span>Response rate</span><b>{responseRate}%</b><small>all-time · {jobs.length} applications</small></div>
          </section>
          <div className="dashboard-filters">{(['all', ...statuses] as const).map((status) => <button key={status} className={statusFilter === status ? 'selected' : ''} onClick={() => { setStatusFilter(status); setViewMode('board') }}>{status === 'all' ? 'All' : labels[status]}</button>)}<button onClick={() => setViewMode(viewMode === 'board' ? 'timeline' : 'board')}><LayoutGrid />{viewMode === 'board' ? 'Timeline' : 'Board'}</button><span><i /> Use arrows to move cards</span></div>
          <details className="dashboard-advanced"><summary>Advanced filters</summary><FilterToolbar hiddenStatuses={hiddenStatuses} onToggleStatus={(status) => setHiddenStatuses((current) => current.includes(status) ? current.filter((item) => item !== status) : [...current, status])} sortBy={sortBy} onSortChange={setSortBy} selectedTags={selectedTags} availableTags={availableTags} onToggleTag={(tag) => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} /></details>
          {viewMode === 'board' ? <JobBoard jobs={filteredJobs} onUpdateJob={updateJob} onDeleteJob={deleteJob} /> : <TimelineView jobs={filteredJobs} onJobClick={(job) => { setDocumentJob(job); setIsDocumentDialogOpen(false) }} />}
        </div>
      </div>

      <Dialog open={isDocumentPickerOpen} onOpenChange={setIsDocumentPickerOpen}><DialogContent><DialogHeader><DialogTitle>Choose an application</DialogTitle><DialogDescription>Select the role you want to tailor documents for.</DialogDescription></DialogHeader><div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">{jobs.map((job) => <button className="dashboard-document-choice" key={job.id} onClick={() => { setDocumentJob(job); setIsDocumentPickerOpen(false); setIsDocumentDialogOpen(true) }}><span><b>{job.position}</b><small>{job.company}</small></span><Sparkles /></button>)}</div></DialogContent></Dialog>
      {documentJob && <DocumentGeneratorDialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen} jobTitle={documentJob.position} company={documentJob.company} jobDescription={documentJob.notes || ''} isPremium={isPremium} subscriptionTier={subscriptionTier} documentsUsedThisMonth={localDocsUsed} onDocumentGenerated={() => setLocalDocsUsed((value) => value + 1)} />}
      <AddJobDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddJob={addJob} isPremium={isPremium} subscriptionTier={subscriptionTier} documentsUsedThisMonth={localDocsUsed} onDocumentGenerated={() => setLocalDocsUsed((value) => value + 1)} />
    </main>
  )
}
