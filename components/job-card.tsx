'use client'

import { useState } from 'react'
import type { Job, JobStatus } from '@/app/page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, MapPin, DollarSign, Calendar, Trash2, ChevronLeft, ChevronRight, ExternalLink, Users, ClipboardList, CheckCircle2, Clock } from 'lucide-react'
import { JobDetailDialog } from './job-detail-dialog'
import { Badge } from '@/components/ui/badge'

interface JobCardProps {
  job: Job
  onUpdate: (id: string, updates: Partial<Job>) => void
  onDelete: (id: string) => void
  canMoveLeft?: boolean
  canMoveRight?: boolean
  onMoveLeft?: () => void
  onMoveRight?: () => void
}

const statusLabels: Record<JobStatus, string> = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

export function JobCard({ job, onUpdate, onDelete, canMoveLeft, canMoveRight, onMoveLeft, onMoveRight }: JobCardProps) {
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const handleStatusChange = (newStatus: JobStatus) => {
    onUpdate(job.id, { status: newStatus })
  }

  const handleCardClick = () => {
    setIsDetailDialogOpen(true)
  }

  return (
    <>
      <Card 
        className="group relative cursor-pointer overflow-hidden transition-all hover:shadow-md" 
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex-1 text-base font-semibold leading-tight text-card-foreground">
              {job.jobUrl ? (
                <a
                  href={job.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="line-clamp-2">{job.position}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : (
                <span className="line-clamp-2">{job.position}</span>
              )}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsDetailDialogOpen(true)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(Object.keys(statusLabels) as JobStatus[]).map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={status === job.status}
                      >
                        {statusLabels[status]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(job.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="mt-1 line-clamp-1 text-sm font-medium text-muted-foreground">
            {job.company}
          </p>
        </CardHeader>
        <CardContent className="space-y-2.5 pb-4">
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{new Date(job.dateApplied).toLocaleDateString()}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            )}
            {job.salary && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{job.salary}</span>
              </div>
            )}
          </div>
          {job.notes && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {job.notes}
            </p>
          )}

          {/* Interview and Task Indicators */}
          {(job.interviews && job.interviews.length > 0) || (job.tasks && job.tasks.length > 0) ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              {job.interviews && job.interviews.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3 w-3" />
                  <span>{job.interviews.length} Interview{job.interviews.length !== 1 ? 's' : ''}</span>
                  {job.interviews.some(i => i.status === 'completed') && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                  {job.interviews.some(i => i.status === 'scheduled') && (
                    <Clock className="h-3 w-3 text-amber-500" />
                  )}
                </Badge>
              )}
              {job.tasks && job.tasks.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
                  <ClipboardList className="h-3 w-3" />
                  <span>{job.tasks.length} Task{job.tasks.length !== 1 ? 's' : ''}</span>
                  {job.tasks.some(t => t.status === 'completed' || t.status === 'submitted') && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                  {job.tasks.some(t => t.status === 'in-progress') && (
                    <Clock className="h-3 w-3 text-amber-500" />
                  )}
                </Badge>
              )}
            </div>
          ) : null}
        </CardContent>
        
        {/* Arrow Navigation */}
        {(canMoveLeft && onMoveLeft) && (
          <Button
            variant="default"
            size="icon"
            className="absolute left-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full shadow-lg opacity-0 transition-all group-hover:opacity-100 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation()
              onMoveLeft()
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {(canMoveRight && onMoveRight) && (
          <Button
            variant="default"
            size="icon"
            className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full shadow-lg opacity-0 transition-all group-hover:opacity-100 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation()
              onMoveRight()
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </Card>

      <JobDetailDialog
        job={job}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onUpdateJob={(updates) => onUpdate(job.id, updates)}
        onDeleteJob={() => onDelete(job.id)}
      />
    </>
  )
}
