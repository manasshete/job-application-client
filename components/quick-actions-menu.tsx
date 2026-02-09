'use client';

import { MoreVertical, Download, Trash2, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Job } from '@/app/page'

interface QuickActionsMenuProps {
  jobs: Job[]
  onExportCSV: () => void
  onClearRejected: () => void
  onArchiveOld: () => void
}

export function QuickActionsMenu({
  jobs,
  onExportCSV,
  onClearRejected,
  onArchiveOld,
}: QuickActionsMenuProps) {
  const rejectedCount = jobs.filter((j) => j.status === 'rejected').length
  const oldJobsCount = jobs.filter((j) => {
    const monthsAgo = new Date()
    monthsAgo.setMonth(monthsAgo.getMonth() - 3)
    return new Date(j.dateApplied) < monthsAgo
  }).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onClearRejected}
          disabled={rejectedCount === 0}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Rejected ({rejectedCount})
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onArchiveOld} disabled={oldJobsCount === 0}>
          <Archive className="mr-2 h-4 w-4" />
          Archive Old Jobs ({oldJobsCount})
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
