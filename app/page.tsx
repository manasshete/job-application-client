'use client'

import { useState, useMemo } from 'react'
import { useJobApplications } from '@/hooks/use-job-applications'
import { AddApplicationDialog } from '@/components/add-application-dialog'
import { ApplicationCard } from '@/components/application-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Briefcase, Clock, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import type { JobStatus } from '@/lib/types'

export default function Page() {
  const { applications, addApplication, updateApplication, deleteApplication, isLoaded } = useJobApplications()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.position.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [applications, searchQuery, statusFilter])

  const stats = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter((a) => a.status === 'applied').length,
      interview: applications.filter((a) => a.status === 'interview').length,
      offer: applications.filter((a) => a.status === 'offer').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    }
  }, [applications])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Job Application Tracker</h1>
              <p className="text-muted-foreground mt-1">
                Manage and track your job search progress
              </p>
            </div>
            <AddApplicationDialog onAdd={addApplication} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applied</p>
                <p className="text-2xl font-bold mt-1 text-blue-500">{stats.applied}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Interview</p>
                <p className="text-2xl font-bold mt-1 text-amber-500">{stats.interview}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offer</p>
                <p className="text-2xl font-bold mt-1 text-green-500">{stats.offer}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold mt-1 text-red-500">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as JobStatus | 'all')}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {applications.length === 0 ? 'No applications yet' : 'No applications found'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {applications.length === 0
                ? 'Start tracking your job search by adding your first application'
                : 'Try adjusting your search or filters'}
            </p>
            {applications.length === 0 && (
              <AddApplicationDialog onAdd={addApplication} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onUpdate={updateApplication}
                onDelete={deleteApplication}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
