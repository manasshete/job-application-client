'use client'

import React from "react"

import { useState } from 'react'
import type { Job, JobStatus } from '@/lib/types'
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
import { Sparkles, Loader2, FileText } from 'lucide-react'
import { sanitizeInput, isValidUrl, MAX_LENGTHS } from '@/lib/validation'
import { Badge } from '@/components/ui/badge'
import { DocumentGeneratorDialog } from './document-generator-dialog'
import { AIDisclaimer } from './disclaimers'

interface AddJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddJob: (job: Omit<Job, 'id'>) => void
  isPremium?: boolean
  subscriptionTier?: string
  documentsUsedThisMonth?: number
  onDocumentGenerated?: () => void
}

export function AddJobDialog({
  open,
  onOpenChange,
  onAddJob,
  isPremium = false,
  subscriptionTier = 'free',
  documentsUsedThisMonth = 0,
  onDocumentGenerated,
}: AddJobDialogProps) {
  const [jobUrl, setJobUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedDescription, setExtractedDescription] = useState('')
  const [showDocumentPrompt, setShowDocumentPrompt] = useState(false)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    status: 'applied' as JobStatus,
    dateApplied: new Date().toISOString().split('T')[0],
    salary: '',
    location: '',
    notes: '',
    jobUrl: '',
    deadline: '',
    recruiterName: '',
    recruiterEmail: '',
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')

  const handleExtractJob = async () => {
    if (!jobUrl) return

    setIsExtracting(true)
    try {
      const response = await fetch('/api/extract-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to extract job details')
      }

      const data = await response.json()
      
      setFormData({
        ...formData,
        company: data.company || formData.company,
        position: data.position || formData.position,
        location: data.location || formData.location,
        salary: data.salary || formData.salary,
        notes: data.description || formData.notes,
        jobUrl: jobUrl,
      })
      if (data.description) {
        setExtractedDescription(data.description)
        setShowDocumentPrompt(true)
      }
    } catch (error) {
      console.error('[v0] Extraction error:', error)
      alert('Failed to extract job details. Please fill in manually.')
    } finally {
      setIsExtracting(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
  }

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
      // URLs must NOT be HTML-escaped (that corrupts "/" and "&"); they are
      // already validated above with isValidUrl. Store the raw, trimmed URL.
      jobUrl: formData.jobUrl ? formData.jobUrl.trim() : '',
    }
    
    onAddJob(sanitizedData)
    setFormData({
      company: '',
      position: '',
      status: 'applied',
      dateApplied: new Date().toISOString().split('T')[0],
      salary: '',
      location: '',
      notes: '',
      jobUrl: '',
      deadline: '',
      recruiterName: '',
      recruiterEmail: '',
      tags: [],
    })
    setJobUrl('')
    setTagInput('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-[500px] p-0">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Sticky header */}
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>Add New Job Application</DialogTitle>
            <DialogDescription>
              Add a new job application to track your progress
            </DialogDescription>
          </DialogHeader>
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="jobUrl">Job Posting URL (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="jobUrl"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://example.com/jobs/123"
                  type="url"
                  disabled={isExtracting}
                />
                <Button
                  type="button"
                  onClick={handleExtractJob}
                  disabled={!jobUrl || isExtracting}
                  variant="secondary"
                  className="shrink-0"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Extract
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste a job posting URL to automatically extract details
              </p>
              <AIDisclaimer />
            </div>

            {/* Document generation prompt - shown after successful extraction */}
            {showDocumentPrompt && (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Tailor your documents for this role?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Generate a tailored resume and cover letter using AI.
                      {!isPremium && ' Requires Pro (₹299/month) or Premium (₹499/month).'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDocumentPrompt(false)}
                  >
                    Skip
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsDocumentDialogOpen(true)}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Generate
                  </Button>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
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
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
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
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: JobStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
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
                <Label htmlFor="dateApplied">Date Applied *</Label>
                <Input
                  id="dateApplied"
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="San Francisco, CA"
                  maxLength={MAX_LENGTHS.LOCATION}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
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
              <Label htmlFor="deadline">Response Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="recruiterName">Recruiter Name (Optional)</Label>
                <Input
                  id="recruiterName"
                  value={formData.recruiterName}
                  onChange={(e) =>
                    setFormData({ ...formData, recruiterName: e.target.value })
                  }
                  placeholder="John Doe"
                  maxLength={200}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recruiterEmail">Recruiter Email (Optional)</Label>
                <Input
                  id="recruiterEmail"
                  type="email"
                  value={formData.recruiterEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, recruiterEmail: e.target.value })
                  }
                  placeholder="recruiter@company.com"
                  maxLength={200}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Remote, Urgent, Referral..."
                  maxLength={50}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes about the application..."
                maxLength={MAX_LENGTHS.NOTES}
                rows={3}
              />
            </div>
          </div>
          </div>
          {/* Sticky footer */}
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Job</Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <DocumentGeneratorDialog
        open={isDocumentDialogOpen}
        onOpenChange={setIsDocumentDialogOpen}
        jobTitle={formData.position}
        company={formData.company}
        jobDescription={extractedDescription}
        isPremium={isPremium}
        subscriptionTier={subscriptionTier}
        documentsUsedThisMonth={documentsUsedThisMonth}
        onDocumentGenerated={onDocumentGenerated}
      />
    </Dialog>
  )
}
