'use client'

import React from "react"

import { useState, useEffect } from 'react'
import type { Job, JobStatus } from '@/app/page'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExternalLink, Calendar, MapPin, DollarSign, Briefcase, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { sanitizeInput, isValidUrl, MAX_LENGTHS } from '@/lib/validation'
import { InterviewTaskSection } from './interview-task-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface JobDetailDialogProps {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateJob: (updates: Partial<Job>) => void
  onDeleteJob: () => void
}

const statusConfig: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  applied: { label: 'Applied', variant: 'secondary' },
  interview: { label: 'Interview', variant: 'default' },
  offer: { label: 'Offer', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
}

export function JobDetailDialog({
  job,
  open,
  onOpenChange,
  onUpdateJob,
  onDeleteJob,
}: JobDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    company: job.company,
    position: job.position,
    status: job.status,
    dateApplied: job.dateApplied,
    salary: job.salary || '',
    location: job.location || '',
    notes: job.notes || '',
    jobUrl: job.jobUrl || '',
    interviews: job.interviews || [],
    tasks: job.tasks || [],
  })

  useEffect(() => {
    setFormData({
      company: job.company,
      position: job.position,
      status: job.status,
      dateApplied: job.dateApplied,
      salary: job.salary || '',
      location: job.location || '',
      notes: job.notes || '',
      jobUrl: job.jobUrl || '',
      interviews: job.interviews || [],
      tasks: job.tasks || [],
    })
    setIsEditing(false)
  }, [job, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate URL if provided
    if (formData.jobUrl && !isValidUrl(formData.jobUrl)) {
      alert('Invalid URL. Please enter a valid HTTP or HTTPS URL.')
      return
    }
    
    // Sanitize all text inputs
    const sanitizedData = {
      ...formData,
      company: sanitizeInput(formData.company),
      position: sanitizeInput(formData.position),
      location: sanitizeInput(formData.location),
      salary: sanitizeInput(formData.salary),
      notes: sanitizeInput(formData.notes),
      jobUrl: formData.jobUrl ? sanitizeInput(formData.jobUrl) : '',
    }
    
    onUpdateJob(sanitizedData)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this job application?')) {
      onDeleteJob()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {!isEditing ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl">{job.position}</DialogTitle>
                  <DialogDescription className="text-base">
                    {job.company}
                  </DialogDescription>
                </div>
                <Badge variant={statusConfig[job.status].variant}>
                  {statusConfig[job.status].label}
                </Badge>
              </div>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Applied on:</span>
                  <span className="font-medium">
                    {new Date(job.dateApplied).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {job.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                )}

                {job.salary && (
                  <div className="flex items-center gap-3 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Salary:</span>
                    <span className="font-medium">{job.salary}</span>
                  </div>
                )}

                {job.jobUrl && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Job Posting:</span>
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      View Posting
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {job.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Notes
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {job.notes}
                  </p>
                </div>
              )}

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="progress">
                    Progress
                    {((job.interviews && job.interviews.length > 0) || (job.tasks && job.tasks.length > 0)) && 
                      ` (${(job.interviews?.length || 0) + (job.tasks?.length || 0)})`
                    }
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    Activity
                    {job.activityLog && job.activityLog.length > 0 && ` (${job.activityLog.length})`}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    All job details are displayed above. Click Edit to modify.
                  </p>
                </TabsContent>
                <TabsContent value="progress" className="mt-4">
                  <InterviewTaskSection
                    interviews={formData.interviews}
                    tasks={formData.tasks}
                    onUpdateInterviews={(interviews) => {
                      const updated = { ...formData, interviews }
                      setFormData(updated)
                      onUpdateJob({ interviews })
                    }}
                    onUpdateTasks={(tasks) => {
                      const updated = { ...formData, tasks }
                      setFormData(updated)
                      onUpdateJob({ tasks })
                    }}
                  />
                </TabsContent>
                <TabsContent value="activity" className="mt-4">
                  {job.activityLog && job.activityLog.length > 0 ? (
                    <div className="space-y-3">
                      {job.activityLog
                        .slice()
                        .reverse()
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{entry.action}</p>
                              {entry.oldValue && entry.newValue && (
                                <p className="text-xs text-muted-foreground">
                                  {entry.oldValue} → {entry.newValue}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No activity yet</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Job Application</DialogTitle>
              <DialogDescription>
                Update the details of your job application
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-company">Company *</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Acme Inc."
                  maxLength={MAX_LENGTHS.COMPANY}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-position">Position *</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  placeholder="Software Engineer"
                  maxLength={MAX_LENGTHS.POSITION}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: JobStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-dateApplied">Date Applied *</Label>
                  <Input
                    id="edit-dateApplied"
                    type="date"
                    value={formData.dateApplied}
                    onChange={(e) =>
                      setFormData({ ...formData, dateApplied: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="San Francisco, CA"
                    maxLength={MAX_LENGTHS.LOCATION}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-salary">Salary</Label>
                  <Input
                    id="edit-salary"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                    placeholder="$120k - $150k"
                    maxLength={MAX_LENGTHS.SALARY}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-jobUrl">Job Posting URL</Label>
                <Input
                  id="edit-jobUrl"
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, jobUrl: e.target.value })
                  }
                  placeholder="https://example.com/jobs/123"
                  maxLength={MAX_LENGTHS.URL}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes about the application..."
                  maxLength={MAX_LENGTHS.NOTES}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
