'use client'

import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { JOB_STATUS_LABEL } from '@/lib/pz/format'
import { useApp } from './app-context'

const PAGES: [string, string][] = [
  ['Next steps', '/dashboard'],
  ['Applications', '/dashboard/applications'],
  ['Documents', '/dashboard/documents'],
  ['Analytics', '/dashboard/analytics'],
  ['Settings', '/dashboard/settings'],
]

/** Quick search: Ctrl K or ⌘K anywhere in the dashboard. Finds a job by role or company, or jumps to a page. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { jobs } = useApp()
  const router = useRouter()
  const [q, setQ] = useState('')
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      } else if (open && e.key === 'Escape') {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) {
      returnTo.current = document.activeElement as HTMLElement | null
    } else {
      setQ('')
      returnTo.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  const recent = [...jobs].sort((a, b) => (a.dateApplied < b.dateApplied ? 1 : -1))
  const shown = q.trim() ? recent : recent.slice(0, 6)

  return (
    <div className="ov ov-top" role="dialog" aria-modal="true" aria-label="Quick search" onMouseDown={(e) => { if (e.target === e.currentTarget) onOpenChange(false) }}>
      <Command className="cmd" label="Quick search" loop>
        <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Search jobs or go to a page" />
        <Command.List>
          <Command.Empty>No jobs or pages match.</Command.Empty>
          {shown.length > 0 && (
            <Command.Group heading={q.trim() ? 'Applications' : 'Recent applications'}>
              {shown.map((j) => (
                <Command.Item key={j.id} value={`${j.position} ${j.company} ${j.id}`} keywords={j.tags} onSelect={() => go(`/dashboard/jobs/${j.id}`)}>
                  <span className="ell">{j.position} · <span className="muted">{j.company}</span></span>
                  <span className={`st-${j.status}`} style={{ flex: 'none', fontSize: 'var(--text-xs)' }}><span className="dot" />{JOB_STATUS_LABEL[j.status]}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          <Command.Group heading="Actions">
            <Command.Item value="Add a job" onSelect={() => go('/dashboard/applications/new')}>Add a job</Command.Item>
            <Command.Item value="See analytics" onSelect={() => go('/dashboard/analytics')}>See analytics</Command.Item>
          </Command.Group>
          <Command.Group heading="Go to">
            {PAGES.map(([label, href]) => (
              <Command.Item key={href} value={`Go to ${label}`} onSelect={() => go(href)}>{label}</Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
