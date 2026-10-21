'use client'

import { useCallback, useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { THEME_KEY as KEY } from './theme-script'

export type ThemePref = 'light' | 'dark' | 'system'

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-th', dark ? 'dark' : 'light')
}

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'system' ? v : 'light'
  } catch {
    return 'light'
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePref>('light')

  useEffect(() => {
    const pref = read()
    setThemeState(pref)
    apply(pref)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (read() === 'system') apply('system')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((pref: ThemePref) => {
    setThemeState(pref)
    apply(pref)
    try {
      localStorage.setItem(KEY, pref)
    } catch {
      /* storage can be blocked; the choice then lasts for this visit only */
    }
  }, [])

  return { theme, setTheme }
}

const LABELS: Record<ThemePref, string> = { light: 'Light', dark: 'Dark', system: 'System' }
const ORDER: ThemePref[] = ['light', 'dark', 'system']

/** Light / Dark / System segmented control. */
export function ThemeToggle({ minHeight, style }: { minHeight?: number; style?: React.CSSProperties }) {
  const { theme, setTheme } = useTheme()
  return (
    <div className="segs" role="group" aria-label="Theme" style={style}>
      {ORDER.map((k) => (
        <button key={k} type="button" className={`seg${theme === k ? ' seg-on' : ''}`} style={minHeight ? { minHeight } : undefined} aria-pressed={theme === k} onClick={() => setTheme(k)}>
          {LABELS[k]}
        </button>
      ))}
    </div>
  )
}

const ICONS = { light: Sun, dark: Moon, system: Monitor }

/** Light / Dark / System with icons, for the sidebar. */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="theme-ic" role="group" aria-label="Theme">
      {ORDER.map((k) => {
        const Icon = ICONS[k]
        return (
          <button key={k} type="button" aria-pressed={theme === k} onClick={() => setTheme(k)} title={`${LABELS[k]} theme`}>
            <Icon aria-hidden="true" />
            {LABELS[k]}
          </button>
        )
      })}
    </div>
  )
}

/** Single icon button that cycles Light, Dark, System (phone header). */
export function ThemeCycle() {
  const { theme, setTheme } = useTheme()
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  const Icon = ICONS[theme]
  return (
    <button type="button" className="icon-btn" onClick={() => setTheme(next)} aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[next]}`}>
      <Icon aria-hidden="true" />
    </button>
  )
}
