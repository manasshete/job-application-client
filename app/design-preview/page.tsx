'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  FileText,
  LayoutGrid,
  ListFilter,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const columns = [
  { id: 'applied', label: 'Applied', tone: 'bg-blue-500' },
  { id: 'interview', label: 'Interview', tone: 'bg-amber-500' },
  { id: 'offer', label: 'Offer', tone: 'bg-emerald-500' },
  { id: 'rejected', label: 'Closed', tone: 'bg-slate-400' },
] as const

const initialJobs = [
  { id: 1, status: 'applied', role: 'Senior Product Designer', company: 'Northstar Labs', location: 'Remote', date: 'Aug 24', salary: '$145k–$175k', tags: ['Design systems', 'Remote'] },
  { id: 2, status: 'applied', role: 'Product Designer II', company: 'Lattice Works', location: 'New York, NY', date: 'Aug 22', salary: '$125k–$150k', tags: ['B2B', 'Hybrid'] },
  { id: 3, status: 'interview', role: 'Lead UX Designer', company: 'Arcade Health', location: 'Remote', date: 'Aug 19', salary: '$155k–$185k', tags: ['Healthcare', 'Portfolio'], interview: 'Tomorrow, 2:30 PM' },
  { id: 4, status: 'interview', role: 'Staff Product Designer', company: 'Beacon AI', location: 'San Francisco, CA', date: 'Aug 17', salary: '$180k–$215k', tags: ['AI', 'On-site'], interview: 'Sep 2, 11:00 AM' },
  { id: 5, status: 'offer', role: 'Senior UX Designer', company: 'Field Notes', location: 'Austin, TX', date: 'Aug 12', salary: '$150k + equity', tags: ['Offer due Friday'] },
  { id: 6, status: 'rejected', role: 'Product Design Lead', company: 'Orbit Commerce', location: 'Remote', date: 'Aug 8', salary: '$160k–$190k', tags: ['E-commerce'] },
] as const

type Status = (typeof columns)[number]['id']
type Job = (typeof initialJobs)[number]

export default function DashboardDesignPreview() {
  const [query, setQuery] = useState('')
  const [jobs, setJobs] = useState<Job[]>([...initialJobs])
  const [showComposer, setShowComposer] = useState(false)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? jobs.filter((job) => `${job.role} ${job.company} ${job.location}`.toLowerCase().includes(term)) : jobs
  }, [jobs, query])

  const moveJob = (id: number, direction: 1 | -1) => {
    setJobs((current) => current.map((job) => {
      if (job.id !== id) return job
      const index = columns.findIndex((column) => column.id === job.status)
      const next = columns[Math.max(0, Math.min(columns.length - 1, index + direction))].id
      return { ...job, status: next } as Job
    }))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo markClassName="h-9 w-9 rounded-xl" wordmarkClassName="text-lg" />
            <p className="text-xs text-muted-foreground">Job search workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">Pro plan</Badge>
            <Button asChild variant="outline" size="sm"><Link href="/design-preview/settings"><Settings className="mr-2 h-4 w-4" />Account</Link></Button>
            <Button size="sm" onClick={() => setShowComposer(true)}><Plus className="mr-2 h-4 w-4" />Add job</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-sm font-medium text-primary">Monday, August 28</p><h1 className="mt-1 text-balance text-3xl font-bold tracking-tight sm:text-4xl">Good morning, Alex.</h1><p className="mt-2 text-muted-foreground">Your search is moving. You have two interviews coming up this week.</p></div>
          <Button variant="outline"><Sparkles className="mr-2 h-4 w-4" />Generate tailored documents</Button>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [BriefcaseBusiness, 'Active applications', '12', '+3 this week'],
            [Users, 'Interviews', '4', '2 upcoming'],
            [CircleCheckBig, 'Offers', '1', 'Decision Friday'],
            [FileText, 'AI documents', '6', '14 tokens left'],
          ].map(([Icon, label, value, note]) => (
            <Card key={String(label)}><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{String(label)}</p><p className="mt-2 text-3xl font-bold">{String(value)}</p><p className="mt-1 text-xs text-muted-foreground">{String(note)}</p></div><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div></CardContent></Card>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles, companies, or locations" className="pl-9" /></div>
            <div className="flex gap-2"><Button variant="outline"><ListFilter className="mr-2 h-4 w-4" />Filter</Button><Button variant="outline"><LayoutGrid className="mr-2 h-4 w-4" />Board</Button></div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-4">
          {columns.map((column) => {
            const columnJobs = filtered.filter((job) => job.status === column.id)
            return <div key={column.id} className="min-w-0 rounded-2xl bg-muted/45 p-3">
              <div className="flex items-center justify-between px-1 pb-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${column.tone}`} /><h2 className="font-semibold">{column.label}</h2><Badge variant="outline" className="h-5 px-1.5 text-[11px]">{columnJobs.length}</Badge></div><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></div>
              <div className="flex flex-col gap-3">
                {columnJobs.map((job) => <article key={job.id} className="group rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold leading-snug">{job.role}</h3><p className="mt-1 text-sm font-medium text-primary">{job.company}</p></div><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></div>
                  <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{job.location}</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Applied {job.date}</span><span className="flex items-center gap-1.5"><BriefcaseBusiness className="h-3.5 w-3.5" />{job.salary}</span></div>
                  {'interview' in job && job.interview && <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300"><Clock3 className="h-3.5 w-3.5" />{job.interview}</div>}
                  <div className="mt-3 flex flex-wrap gap-1.5">{job.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-[11px]">{tag}</Badge>)}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3"><Button variant="ghost" size="sm" disabled={column.id === 'applied'} onClick={() => moveJob(job.id, -1)}>Back</Button><Button variant="ghost" size="sm" disabled={column.id === 'rejected'} onClick={() => moveJob(job.id, 1)}>Move <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></div>
                </article>)}
                {columnJobs.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No applications here</div>}
              </div>
            </div>
          })}
        </section>
      </main>

      {showComposer && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setShowComposer(false)}><div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Add a job application</h2><p className="mt-1 text-sm text-muted-foreground">This is a safe visual preview. Nothing is saved.</p></div><Button variant="ghost" size="icon" onClick={() => setShowComposer(false)}>×</Button></div><div className="mt-6 flex flex-col gap-4"><Input placeholder="Job posting URL" /><Input placeholder="Company" /><Input placeholder="Role" /><div className="grid grid-cols-2 gap-3"><Input placeholder="Location" /><Input placeholder="Salary" /></div><Button onClick={() => setShowComposer(false)}>Add to board</Button></div></div></div>}
    </div>
  )
}
