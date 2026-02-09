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
import { MoreVertical, MapPin, DollarSign, Calendar, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { EditJobDialog } from './edit-job-dialog'

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleStatusChange = (newStatus: JobStatus) => {
    onUpdate(job.id, { status: newStatus })
  }

  return (
    <>
      <Card className="group relative transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-semibold leading-tight text-card-foreground">
              {job.position}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  Edit
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
          <p className="text-sm font-medium text-muted-foreground">
            {job.company}
          </p>
        </CardHeader>
        <CardContent className="space-y-2 pb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(job.dateApplied).toLocaleDateString()}</span>
          </div>
          {job.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{job.salary}</span>
            </div>
          )}
          {job.notes && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {job.notes}
            </p>
          )}
        </CardContent>
        
        {/* Arrow Navigation */}
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-2 opacity-0 transition-opacity group-hover:opacity-100">
          {canMoveLeft && onMoveLeft ? (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-lg"
              onClick={onMoveLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div />
          )}
          {canMoveRight && onMoveRight ? (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-lg"
              onClick={onMoveRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </Card>

      <EditJobDialog
        job={job}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdateJob={(updates) => onUpdate(job.id, updates)}
      />
    </>
  )
}
