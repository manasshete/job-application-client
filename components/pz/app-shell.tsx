'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BarChart3, Briefcase, Columns3, FileText, ListTodo, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings, X, type LucideIcon } from 'lucide-react'
import { fd } from '@/lib/pz/format'
import { SUBSCRIPTION_LIMITS } from '@/lib/subscription'
import { Brand } from './brand'
import { ThemeCycle, ThemeSwitch } from './theme'
import { useApp } from './app-context'
import { CommandPalette } from './command-palette'

type NavKey = 'next' | 'apps' | 'board' | 'add' | 'docs' | 'analytics' | 'settings'

function currentKey(path: string): NavKey | null {
  if (path === '/dashboard') return 'next'
  if (path.startsWith('/dashboard/applications/new')) return 'add'
  if (path.startsWith('/dashboard/board')) return 'board'
  if (path.startsWith('/dashboard/applications') || path.startsWith('/dashboard/jobs')) return 'apps'
  if (path.startsWith('/dashboard/documents')) return 'docs'
  if (path.startsWith('/dashboard/analytics')) return 'analytics'
  if (path.startsWith('/dashboard/settings')) return 'settings'
  return null
}

const WORK: [string, NavKey, string, LucideIcon][] = [
  ['Next steps', 'next', '/dashboard', ListTodo],
  ['Applications', 'apps', '/dashboard/applications', Briefcase],
  ['Board', 'board', '/dashboard/board', Columns3],
  ['Documents', 'docs', '/dashboard/documents', FileText],
  ['Analytics', 'analytics', '/dashboard/analytics', BarChart3],
]
const TABS: [string, NavKey, string, LucideIcon][] = [
  ['Next steps', 'next', '/dashboard', ListTodo],
  ['Applications', 'apps', '/dashboard/applications', Briefcase],
  ['Add', 'add', '/dashboard/applications/new', Plus],
  ['Documents', 'docs', '/dashboard/documents', FileText],
  ['Settings', 'settings', '/dashboard/settings', Settings],
]
const SIDE_KEY = 'pz-side'

function usePhone() {
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 719px)')
    const on = () => setPhone(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}

function UsageMeter({ label, left, of }: { label: string; left: number; of: number }) {
  const pct = of > 0 ? Math.min(100, Math.round((100 * left) / of)) : 0
  return (
    <div>
      <div className="usage-row"><span>{label}</span><b>{left} left</b></div>
      <div className="meter-tr" aria-hidden="true"><div className="meter-fl" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { tokens, account, logout, clearNew } = useApp()
  const cur = currentKey(pathname)
  const phone = usePhone()
  const [searchOpen, setSearchOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const sideRef = useRef<HTMLElement>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)

  // The new-row tint and tailor suggestion only last until you leave Applications.
  useEffect(() => {
    if (pathname !== '/dashboard/applications') clearNew()
    setDrawer(false)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Remember the collapsed sidebar between visits (desktop only).
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(SIDE_KEY) === 'collapsed') } catch { /* storage blocked: start expanded */ }
  }, [])
  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      try { localStorage.setItem(SIDE_KEY, c ? 'expanded' : 'collapsed') } catch { /* ignore */ }
      return !c
    })
  }, [])

  // Phone drawer: Escape closes it, focus moves in and back out, the page behind does not scroll.
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sideRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const btn = menuBtn.current
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      btn?.focus()
    }
  }, [drawer])

  const limits = SUBSCRIPTION_LIMITS[account.tier] ?? SUBSCRIPTION_LIMITS.free
  const out = tokens.extractions === 0 && tokens.documents === 0
  const warn = tokens.extractions <= 3 || tokens.documents <= 1
  const isCollapsed = collapsed && !phone
  const initial = (account.name || account.email || '?').trim().charAt(0)

  const signOut = async () => {
    setLeaving(true)
    await logout()
  }

  const navLink = ([label, key, href, Icon]: [string, NavKey, string, LucideIcon]) => (
    <Link key={key} href={href} className={`nav${cur === key ? ' nav-on' : ''}`} aria-current={cur === key ? 'page' : undefined} data-tip={label} data-tip-side="right">
      <Icon aria-hidden="true" />
      <span className="nl">{label}</span>
    </Link>
  )

  return (
    <div className="frame">
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}
      <aside
        ref={sideRef}
        id="pz-sidebar"
        className={`side${isCollapsed ? ' side-collapsed' : ''}${drawer ? ' side-open' : ''}`}
        aria-label="Sidebar"
        {...(phone && drawer ? { role: 'dialog', 'aria-modal': true } : {})}
      >
        <div className="side-top">
          <Link href="/dashboard" className="brand" style={{ padding: '0 6px' }} aria-label="Pursuitz, Next steps">
            <Brand />
          </Link>
          {phone ? (
            <button type="button" className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu"><X /></button>
          ) : (
            <button type="button" className="icon-btn side-collapse" onClick={toggleCollapsed} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!isCollapsed} aria-controls="pz-sidebar" data-tip={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} data-tip-side="right">
              {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </button>
          )}
        </div>

        <div className="side-grp">
          <Link href="/dashboard/applications/new" className="btn btn-p side-add" data-tip="Add a job" data-tip-side="right">
            <Plus aria-hidden="true" />
            <span className="nl">Add a job</span>
          </Link>
          <button type="button" className="nav side-search" onClick={() => { setDrawer(false); setSearchOpen(true) }} aria-keyshortcuts="Control+K Meta+K" data-tip="Search (Ctrl K)" data-tip-side="right" style={{ marginTop: 6 }}>
            <span><Search aria-hidden="true" /><span className="nl">Search</span></span>
            <span className="kbd">Ctrl K</span>
          </button>
        </div>

        <nav className="side-grp" aria-label="Workspace">
          <div className="side-lbl">Workspace</div>
          {WORK.map(navLink)}
        </nav>

        <div className="side-foot">
          <nav className="side-grp" aria-label="Account">
            {navLink(['Settings', 'settings', '/dashboard/settings', Settings])}
          </nav>
          <Link href="/dashboard/settings" className={`usage${warn ? ' usage-warn' : ''}`} aria-label={`AI usage: ${tokens.extractions} extractions and ${tokens.documents} documents left. Open plan and tokens.`}>
            {out ? (
              <span className="usage-row" style={{ color: 'var(--flag-ink)' }}>No AI tokens left. See plans</span>
            ) : (
              <>
                <UsageMeter label="Extractions" left={tokens.extractions} of={limits.aiExtractionLimit} />
                <UsageMeter label="Documents" left={tokens.documents} of={limits.documentGenerationLimit} />
              </>
            )}
            <span className="usage-row muted" style={{ fontSize: 'var(--text-label)' }}>{tokens.nextExpiry ? `Next batch expires ${fd(tokens.nextExpiry.slice(0, 10))}` : 'Upgrade for a bigger allowance'}</span>
          </Link>
          <ThemeSwitch />
          <div className="acct">
            <span className="avatar" aria-hidden="true">{initial}</span>
            <span className="acct-txt">
              <span className="ell" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{account.name}</span>
              <span className="ell">{account.email}</span>
            </span>
            <button type="button" className="icon-btn" onClick={signOut} disabled={leaving} aria-label="Log out" data-tip="Log out" data-tip-side="right">
              {leaving ? <span className="spin" aria-hidden="true" /> : <LogOut />}
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button ref={menuBtn} type="button" className="icon-btn" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer} aria-controls="pz-sidebar"><Menu /></button>
            <Link href="/dashboard" className="brand" style={{ padding: 0, gap: 8 }} aria-label="Pursuitz, Next steps">
              <Brand small />
            </Link>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button type="button" className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search"><Search /></button>
            <ThemeCycle />
          </span>
        </header>

        <main id="main" style={{ flex: 1, minWidth: 0 }}>{children}</main>
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />

        <nav className="tabbar" aria-label="Main">
          {TABS.map(([label, key, href, Icon]) => (
            <Link key={key} href={href} aria-current={cur === key ? 'page' : undefined} className="tabbar-link">
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
