'use client';

import { Filter, ArrowUpDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { JobStatus } from '@/app/page'

interface FilterToolbarProps {
  hiddenStatuses: JobStatus[]
  onToggleStatus: (status: JobStatus) => void
  sortBy: string
  onSortChange: (sort: string) => void
  selectedTags: string[]
  availableTags: string[]
  onToggleTag: (tag: string) => void
}

const statusLabels: Record<JobStatus, string> = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

export function FilterToolbar({
  hiddenStatuses,
  onToggleStatus,
  sortBy,
  onSortChange,
  selectedTags,
  availableTags,
  onToggleTag,
}: FilterToolbarProps) {
  const activeFiltersCount = hiddenStatuses.length + selectedTags.length

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(statusLabels) as JobStatus[]).map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={!hiddenStatuses.includes(status)}
              onCheckedChange={() => onToggleStatus(status)}
            >
              {statusLabels[status]}
            </DropdownMenuCheckboxItem>
          ))}
          {availableTags.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
              {availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => onToggleTag(tag)}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[180px]">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dateApplied-desc">Newest First</SelectItem>
          <SelectItem value="dateApplied-asc">Oldest First</SelectItem>
          <SelectItem value="company-asc">Company A-Z</SelectItem>
          <SelectItem value="company-desc">Company Z-A</SelectItem>
          <SelectItem value="deadline-asc">Deadline (Soonest)</SelectItem>
        </SelectContent>
      </Select>

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            hiddenStatuses.forEach(onToggleStatus)
            selectedTags.forEach(onToggleTag)
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
