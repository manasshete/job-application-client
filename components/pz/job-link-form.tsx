'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, ClipboardPaste, Link2 } from 'lucide-react'
import { useApp } from './app-context'

/** Turns what someone pasted into a usable posting link, or explains what is wrong with it. */
export function checkJobLink(raw: string): { url?: string; error?: string } {
  let v = raw.trim()
  if (!v) return { error: 'Paste the link to a job posting first.' }
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = `https://${v}`
  try {
    const u = new URL(v)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { error: 'That link needs to start with https:// or http://.' }
    if (!u.hostname.includes('.')) return { error: 'That doesn’t look like a full web address. Copy the link from your browser’s address bar.' }
    return { url: u.toString() }
  } catch {
    return { error: 'That doesn’t look like a web address. Copy the link from your browser’s address bar.' }
  }
}

/**
 * The job-link bar used on Next steps. Checks the link, then hands it to Add a job,
 * which reads the posting straight away.
 */
export function JobLinkForm({ autoFocus = false, label = 'Job posting link', stacked = false }: { autoFocus?: boolean; label?: string; stacked?: boolean }) {
  const { tokens } = useApp()
  const router = useRouter()
  const id = useId()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [going, setGoing] = useState(false)
  const [canPaste, setCanPaste] = useState(false)
  const [dropping, setDropping] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const noReads = tokens.extractions === 0

  // Only offer Paste where the browser lets a page read the clipboard.
  useEffect(() => setCanPaste(typeof navigator !== 'undefined' && !!navigator.clipboard?.readText), [])

  const fill = (text: string) => {
    const t = text.trim().split(/\s+/)[0] ?? ''
    setValue(t)
    const { error } = checkJobLink(t)
    setError(t && error ? error : '')
    input.current?.focus()
  }

  const pasteFromClipboard = async () => {
    try {
      fill(await navigator.clipboard.readText())
    } catch {
      setError('Your browser didn’t allow reading the clipboard. Paste with Ctrl V (⌘V on Mac) instead.')
      input.current?.focus()
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const { url, error } = checkJobLink(value)
    if (!url) {
      setError(error ?? '')
      return
    }
    setError('')
    setGoing(true)
    router.push(`/dashboard/applications/new?url=${encodeURIComponent(url)}&go=1`)
  }

  if (noReads) {
    return (
      <div className="note note-flag" role="status">
        <AlertCircle aria-hidden="true" />
        <span>
          You’ve used all your extractions for now, so Pursuitz can’t read postings automatically. You can still{' '}
          <Link href="/dashboard/applications/new?manual=1">add a job by hand</Link> or <Link href="/dashboard/settings">see your plan</Link>.
        </span>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div
        className={`urlbar${stacked ? ' urlbar-stack' : ''}${dropping ? ' urlbar-drop' : ''}`}
        aria-invalid={error ? true : undefined}
        onDragOver={(e) => { if (e.dataTransfer.types.includes('text/uri-list') || e.dataTransfer.types.includes('text/plain')) { e.preventDefault(); setDropping(true) } }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDropping(false)
          fill(e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'))
        }}
      >
        <Link2 aria-hidden="true" />
        <input
          ref={input}
          id={id}
          type="url"
          inputMode="url"
          autoComplete="url"
          autoFocus={autoFocus}
          placeholder="https://company.com/careers/job-id"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError('')
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint`}
        />
        {canPaste && !value.trim() && (
          <button type="button" className="btn btn-t urlbar-paste" onClick={pasteFromClipboard}>
            <ClipboardPaste aria-hidden="true" />Paste
          </button>
        )}
        <button className="btn btn-p btn-lg" type="submit" disabled={going} aria-busy={going || undefined}>
          {going ? <span className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          {going ? 'Opening…' : 'Analyze job'}
        </button>
      </div>
      {error ? (
        <p id={`${id}-hint`} className="field-msg field-err" role="alert">
          <AlertCircle aria-hidden="true" />
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="muted tnum" style={{ margin: '10px 0 0', fontSize: 'var(--text-xs)' }}>
          Uses 1 extraction. You have {tokens.extractions}. Prefer to type it in?{' '}
          <Link href="/dashboard/applications/new?manual=1" className="link">Add a job by hand</Link>
        </p>
      )}
    </form>
  )
}
