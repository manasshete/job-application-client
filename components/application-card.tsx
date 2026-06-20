'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, MapPin, DollarSign, Calendar, ExternalLink, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { JobApplication, JobStatus } from '@/lib/types'

interface ApplicationCardProps {
  application: JobApplication
  onUpdate: (id: string, updates: Partial<JobApplication>) => void
  onDelete: (id: string) => void
}

const statusConfig = {
  applied: { label: 'Applied', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  interview: { label: 'Interview', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  offer: { label: 'Offer', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  accepted: { label: 'Accepted', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
}

export function ApplicationCard({ application, onUpdate, onDelete }: ApplicationCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState(application)

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(application.id, formData)
    setEditOpen(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <>
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {application.company}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{application.position}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusConfig[application.status].className}>
              {statusConfig[application.status].label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(application.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(application.dateApplied)}
            </div>
            {application.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {application.location}
              </div>
            )}
            {application.salary && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {application.salary}
              </div>
            )}
          </div>
          {application.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">{application.notes}</p>
          )}
          {application.jobUrl && (
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View posting
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update the details of your job application.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company *</Label>
                <Input
                  id="edit-company"
                  required
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position *</Label>
                <Input
                  id="edit-position"
                  required
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as JobStatus })
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
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-appliedDate">Applied Date *</Label>
                <Input
                  id="edit-appliedDate"
                  type="date"
                  required
                  value={formData.dateApplied}
                  onChange={(e) =>
                    setFormData({ ...formData, dateApplied: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary">Salary Range</Label>
                <Input
                  id="edit-salary"
                  value={formData.salary || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">Job Posting URL</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.jobUrl || ''}
                onChange={(e) =>
                  setFormData({ ...formData, jobUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
