'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Interview, Job, JobStatus, Task } from '@/lib/types'
import type { SubscriptionTier } from '@/lib/subscription'
import type { DocMeta } from '@/lib/data/documents'
import type { TokenBatchRow } from '@/lib/data/tokens'
import { JOB_STATUS_LABEL, todayIso } from '@/lib/pz/format'
import { planOf } from '@/lib/pz/plans'
import { Modals, type ModalState } from './modals'

export interface Account {
  name: string
  email: string
  tier: SubscriptionTier
}

export interface Tokens {
  extractions: number
  documents: number
  nextExpiry: string | null
  batches: TokenBatchRow[]
}

interface DocumentApiRow {
  id: string
  document_type: DocMeta['type']
  name: string
  is_default?: boolean | null
  job_id?: string | null
  created_at: string
}

export interface ToastAction {
  label: string
  run: () => void
}

export type NewJob = Omit<Job, 'id' | 'activityLog' | 'interviews' | 'tasks'>

interface Ctx {
  today: string
  jobs: Job[]
  account: Account
  tokens: Tokens
  docs: DocMeta[]
  loadError: boolean
  /** The job just saved (tints its row and offers to tailor a CV). */
  newJobId: string | null
  nudge: boolean
  setNudge: (v: boolean) => void
  clearNew: () => void

  /** A short confirmation at the bottom of the screen, optionally with one action such as Undo. */
  toast: (message: string, action?: ToastAction) => void
  modal: ModalState
  openModal: (m: NonNullable<ModalState>) => void
  closeModal: () => void

  getJob: (id: string) => Job | undefined
  addJob: (job: NewJob) => Promise<{ job?: Job; error?: string }>
  /** `patch` is sent to the server; `local` only updates what is on screen. */
  patchJob: (id: string, patch: Partial<Job>, local?: Partial<Job>) => Promise<boolean>
  setStatus: (id: string, status: JobStatus) => Promise<void>
  removeJob: (id: string) => Promise<boolean>

  addRound: (jobId: string, r: { round: string; date: string; time?: string }) => Promise<boolean>
  patchRound: (jobId: string, roundId: string, patch: Partial<Interview>) => Promise<void>
  addTask: (jobId: string, t: { title: string; dueDate?: string }) => Promise<boolean>
  patchTask: (jobId: string, taskId: string, patch: Partial<Task>) => Promise<void>

  /** Saves a finished document, optionally tied to a job. */
  saveDoc: (input: { type: 'cv' | 'cover_letter'; name: string; content: string; jobId?: string; isDefault?: boolean }) => Promise<DocMeta | null>
  removeDoc: (id: string) => Promise<boolean>
  fetchDocText: (id: string) => Promise<string | null>
  masterCv: DocMeta | undefined
  /** Text of the master CV, or null when none is saved. */
  masterCvText: () => Promise<string | null>
  masterCl: DocMeta | undefined
  /** Text of the master cover letter, or null when none is saved. */
  masterClText: () => Promise<string | null>

  refreshTokens: () => Promise<void>
  noteTokenUsed: (kind: 'extractions' | 'documents') => void
  startCheckout: (tier: 'pro' | 'premium') => void
  continueToRazorpay: (tier: 'pro' | 'premium') => Promise<void>
  confirmDowngrade: (tier: SubscriptionTier) => Promise<void>
  saveName: (name: string) => Promise<boolean>
  deleteAccount: (email: string) => Promise<'deleted' | 'support' | 'error'>
  logout: () => Promise<void>
}

const AppCtx = createContext<Ctx | null>(null)

export function useApp(): Ctx {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

async function api<T = unknown>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  try {
    const res = await fetch(url, init)
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: 'Network error' } as T & { error?: string } }
  }
}

const json = (method: string, body: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Razorpay'))
    document.body.appendChild(s)
  })
}

export function AppProvider({
  children,
  serverToday,
  initialJobs,
  initialAccount,
  initialTokens,
  initialDocs,
  loadError,
}: {
  children: ReactNode
  serverToday: string
  initialJobs: Job[]
  initialAccount: Account
  initialTokens: Tokens
  initialDocs: DocMeta[]
  loadError: boolean
}) {
  const router = useRouter()
  const [today, setToday] = useState(serverToday)
  const [jobs, setJobs] = useState(initialJobs)
  const [account, setAccount] = useState(initialAccount)
  const [tokens, setTokens] = useState(initialTokens)
  const [docs, setDocs] = useState(initialDocs)
  const [newJobId, setNewJobId] = useState<string | null>(null)
  const [nudge, setNudge] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastAction, setToastAction] = useState<ToastAction | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const jobsRef = useRef(jobs)
  useEffect(() => {
    jobsRef.current = jobs
  }, [jobs])

  // The server renders with its own clock; settle on the visitor's calendar day once mounted.
  useEffect(() => setToday(todayIso()), [])
  // Server re-renders (router.refresh) hand down fresh data.
  useEffect(() => setJobs(initialJobs), [initialJobs])
  useEffect(() => setDocs(initialDocs), [initialDocs])
  useEffect(() => setAccount(initialAccount), [initialAccount])
  useEffect(() => setTokens(initialTokens), [initialTokens])

  const toast = useCallback((message: string, action?: ToastAction) => {
    clearTimeout(toastTimer.current)
    setToastMsg(message)
    setToastAction(action ?? null)
    toastTimer.current = setTimeout(() => {
      setToastMsg(null)
      setToastAction(null)
    }, action ? 6500 : 4200)
  }, [])

  const openModal = useCallback((m: NonNullable<ModalState>) => setModal(m), [])
  const closeModal = useCallback(() => setModal(null), [])

  /* ── Tokens ─────────────────────────────────────── */

  const refreshTokens = useCallback(async () => {
    const r = await api<{ extractions: number; documents: number; nextExpiry: string | null; batches: TokenBatchRow[] }>('/api/tokens')
    if (r.ok) setTokens({ extractions: r.data.extractions, documents: r.data.documents, nextExpiry: r.data.nextExpiry, batches: r.data.batches })
  }, [])

  // The server spends the token; mirror it locally straight away, then settle with the real numbers.
  const noteTokenUsed = useCallback(
    (kind: 'extractions' | 'documents') => {
      setTokens((t) => ({ ...t, [kind]: Math.max(0, t[kind] - 1) }))
      void refreshTokens()
    },
    [refreshTokens],
  )

  /* ── Jobs ───────────────────────────────────────── */

  const getJob = useCallback((id: string) => jobs.find((j) => j.id === id), [jobs])

  const addJob: Ctx['addJob'] = useCallback(
    async (draft) => {
      const r = await api<Job>('/api/jobs', json('POST', draft))
      if (!r.ok) return { error: r.data.error || 'We could not save this job. Please try again.' }
      const job: Job = { ...r.data, interviews: [], tasks: [], activityLog: [{ id: `local-${Date.now()}`, timestamp: new Date().toISOString(), action: 'Created', newValue: r.data.status }] }
      setJobs((cur) => [job, ...cur])
      setNewJobId(job.id)
      setNudge(true)
      return { job }
    },
    [],
  )

  const patchJob: Ctx['patchJob'] = useCallback(
    async (id, patch, local) => {
      const before = jobsRef.current.find((j) => j.id === id)
      if (!before) return false
      setJobs((cur) => cur.map((j) => (j.id === id ? { ...j, ...patch, ...local } : j)))
      const r = await api(`/api/jobs/${id}`, json('PATCH', patch))
      if (!r.ok) {
        setJobs((cur) => cur.map((j) => (j.id === id ? before : j)))
        toast(r.data.error || 'We could not save that change. Please try again.')
        return false
      }
      return true
    },
    [toast],
  )

  const setStatus: Ctx['setStatus'] = useCallback(
    async (id, status) => {
      const job = jobsRef.current.find((j) => j.id === id)
      if (!job || job.status === status) return
      const entry = { id: `local-${Date.now()}`, timestamp: new Date().toISOString(), action: 'Status Changed', newValue: status }
      const ok = await patchJob(id, { status }, { activityLog: [entry, ...(job.activityLog ?? [])] })
      if (!ok) return
      const before = job.status
      toast(`${job.company} moved to ${JOB_STATUS_LABEL[status]}.`, {
        label: 'Undo',
        run: () => {
          void patchJob(id, { status: before }, { activityLog: job.activityLog ?? [] }).then((back) => {
            if (back) toast(`${job.company} is back in ${JOB_STATUS_LABEL[before]}.`)
          })
        },
      })
    },
    [patchJob, toast],
  )

  const removeJob: Ctx['removeJob'] = useCallback(
    async (id) => {
      const r = await api(`/api/jobs/${id}`, { method: 'DELETE' })
      if (!r.ok) {
        toast(r.data.error || 'We could not delete that application.')
        return false
      }
      setJobs((cur) => cur.filter((j) => j.id !== id))
      return true
    },
    [toast],
  )

  /* ── Rounds and tasks ───────────────────────────── */

  const logLocal = (job: Job, action: string, newValue: string) => [{ id: `local-${Date.now()}`, timestamp: new Date().toISOString(), action, newValue }, ...(job.activityLog ?? [])]

  const addRound: Ctx['addRound'] = useCallback(
    async (jobId, r) => {
      const res = await api<Interview>(`/api/jobs/${jobId}/interviews`, json('POST', { round: r.round, date: r.date, time: r.time || undefined, status: 'scheduled' }))
      if (!res.ok) {
        toast(res.data.error || 'We could not add that round.')
        return false
      }
      const round = res.data
      setJobs((cur) => cur.map((j) => (j.id === jobId ? { ...j, interviews: [...(j.interviews ?? []), round], activityLog: logLocal(j, 'Round added', round.round) } : j)))
      toast('Round added. It now shows in Next steps.')
      return true
    },
    [toast],
  )

  const patchRound: Ctx['patchRound'] = useCallback(
    async (jobId, roundId, patch) => {
      const before = jobsRef.current.find((j) => j.id === jobId)
      if (!before) return
      setJobs((cur) => cur.map((j) => (j.id === jobId ? { ...j, interviews: (j.interviews ?? []).map((i) => (i.id === roundId ? { ...i, ...patch } : i)), ...(patch.status ? { activityLog: logLocal(j, 'Round status', patch.status) } : {}) } : j)))
      const res = await api(`/api/jobs/${jobId}/interviews/${roundId}`, json('PATCH', patch))
      if (!res.ok) {
        setJobs((cur) => cur.map((j) => (j.id === jobId ? before : j)))
        toast(res.data.error || 'We could not save that round.')
      }
    },
    [toast],
  )

  const addTask: Ctx['addTask'] = useCallback(
    async (jobId, t) => {
      const res = await api<Task>(`/api/jobs/${jobId}/tasks`, json('POST', { title: t.title, dueDate: t.dueDate || undefined, status: 'pending' }))
      if (!res.ok) {
        toast(res.data.error || 'We could not add that task.')
        return false
      }
      const task = res.data
      setJobs((cur) => cur.map((j) => (j.id === jobId ? { ...j, tasks: [...(j.tasks ?? []), task], activityLog: logLocal(j, 'Task added', task.title) } : j)))
      toast(task.dueDate ? 'Task added. It now shows in Next steps.' : 'Task added. Give it a due date to see it in Next steps.')
      return true
    },
    [toast],
  )

  const patchTask: Ctx['patchTask'] = useCallback(
    async (jobId, taskId, patch) => {
      const before = jobsRef.current.find((j) => j.id === jobId)
      if (!before) return
      setJobs((cur) => cur.map((j) => (j.id === jobId ? { ...j, tasks: (j.tasks ?? []).map((t) => (t.id === taskId ? { ...t, ...patch } : t)), ...(patch.status ? { activityLog: logLocal(j, 'Task status', patch.status) } : {}) } : j)))
      const res = await api(`/api/jobs/${jobId}/tasks/${taskId}`, json('PATCH', patch))
      if (!res.ok) {
        setJobs((cur) => cur.map((j) => (j.id === jobId ? before : j)))
        toast(res.data.error || 'We could not save that task.')
      }
    },
    [toast],
  )

  /* ── Documents ──────────────────────────────────── */

  const toMeta = (d: DocumentApiRow): DocMeta => ({ id: d.id, type: d.document_type, name: d.name, isDefault: !!d.is_default, jobId: d.job_id ?? null, createdAt: d.created_at })

  const saveDoc: Ctx['saveDoc'] = useCallback(
    async ({ type, name, content, jobId, isDefault }) => {
      const r = await api<DocumentApiRow>('/api/user-documents', json('POST', { documentType: type, name, content, jobId, isDefault: !!isDefault }))
      if (!r.ok) {
        toast(r.data.error || 'We could not save that document. Please try again.')
        return null
      }
      const meta = toMeta(r.data)
      setDocs((cur) => [meta, ...(isDefault ? cur.map((d) => (d.type === type ? { ...d, isDefault: false } : d)) : cur)])
      if (jobId) setJobs((cur) => cur.map((j) => (j.id === jobId ? { ...j, activityLog: logLocal(j, type === 'cv' ? 'Tailored CV approved' : 'Cover letter approved', name) } : j)))
      return meta
    },
    [toast],
  )

  const removeDoc: Ctx['removeDoc'] = useCallback(
    async (id) => {
      const r = await api(`/api/user-documents?id=${id}`, { method: 'DELETE' })
      if (!r.ok) {
        toast(r.data.error || 'We could not delete that document.')
        return false
      }
      setDocs((cur) => cur.filter((d) => d.id !== id))
      return true
    },
    [toast],
  )

  const fetchDocText: Ctx['fetchDocText'] = useCallback(async (id) => {
    const r = await api<{ content: string }>(`/api/user-documents?id=${id}`)
    return r.ok ? r.data.content : null
  }, [])

  const masterCv = useMemo(() => docs.find((d) => d.type === 'cv' && d.isDefault), [docs])
  const masterCvText = useCallback(async () => (masterCv ? fetchDocText(masterCv.id) : null), [masterCv, fetchDocText])
  const masterCl = useMemo(() => docs.find((d) => d.type === 'cover_letter' && d.isDefault), [docs])
  const masterClText = useCallback(async () => (masterCl ? fetchDocText(masterCl.id) : null), [masterCl, fetchDocText])

  /* ── Plan, profile, account ─────────────────────── */

  const startCheckout = useCallback((tier: 'pro' | 'premium') => setModal({ type: 'checkout', tier, step: 'confirm' }), [])

  const continueToRazorpay: Ctx['continueToRazorpay'] = useCallback(
    async (tier) => {
      setModal({ type: 'checkout', tier, step: 'handoff' })
      try {
        const order = await api<{ orderId: string; amount: number; currency: string; keyId: string }>('/api/payment/create-order', json('POST', { tier }))
        if (!order.ok) throw new Error(order.data.error || 'order')
        await loadRazorpay()
        const rz = new window.Razorpay({
          key: order.data.keyId,
          amount: order.data.amount,
          currency: order.data.currency,
          order_id: order.data.orderId,
          name: 'Pursuitz',
          description: `${planOf(tier).name} plan`,
          prefill: { name: account.name, email: account.email },
          theme: { color: '#163A66' },
          modal: { ondismiss: () => setModal(null) },
          handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const v = await api('/api/payment/verify', json('POST', { orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature }))
            setModal(null)
            if (!v.ok) {
              toast(v.data.error || 'We could not confirm your payment. If you were charged, email info@pursuitz.co.')
              return
            }
            setAccount((a) => ({ ...a, tier }))
            await refreshTokens()
            toast(`You are on ${planOf(tier).name}. Your tokens have been added.`)
            router.refresh()
          },
        })
        rz.open()
      } catch {
        setModal(null)
        toast('We could not start checkout. Please try again.')
      }
    },
    [account.email, account.name, refreshTokens, router, toast],
  )

  const confirmDowngrade: Ctx['confirmDowngrade'] = useCallback(
    async (tier) => {
      const r = await api('/api/subscription/change-tier', json('POST', { tier }))
      setModal(null)
      if (!r.ok) {
        toast(r.data.error || 'We could not change your plan. Please try again.')
        return
      }
      setAccount((a) => ({ ...a, tier }))
      await refreshTokens()
      toast(`Switched to ${planOf(tier).name}. This took effect straight away.`)
      router.refresh()
    },
    [refreshTokens, router, toast],
  )

  const saveName: Ctx['saveName'] = useCallback(
    async (name) => {
      const r = await api('/api/profile', json('PATCH', { full_name: name }))
      if (!r.ok) {
        toast(r.data.error || 'We could not save your name.')
        return false
      }
      setAccount((a) => ({ ...a, name: name.trim() }))
      toast('Display name saved.')
      return true
    },
    [toast],
  )

  const deleteAccount: Ctx['deleteAccount'] = useCallback(async (email) => {
    const r = await api('/api/account', json('DELETE', { email }))
    if (r.status === 409) return 'support'
    return r.ok ? 'deleted' : 'error'
  }, [])

  const logout: Ctx['logout'] = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }, [router])

  const value: Ctx = {
    today, jobs, account, tokens, docs, loadError, newJobId, nudge, setNudge,
    clearNew: () => { setNewJobId(null); setNudge(false) },
    toast, modal, openModal, closeModal,
    getJob, addJob, patchJob, setStatus, removeJob,
    addRound, patchRound, addTask, patchTask,
    saveDoc, removeDoc, fetchDocText, masterCv, masterCvText, masterCl, masterClText,
    refreshTokens, noteTokenUsed, startCheckout, continueToRazorpay, confirmDowngrade, saveName, deleteAccount, logout,
  }

  return (
    <AppCtx.Provider value={value}>
      {children}
      <Modals />
      {toastMsg && (
        <div className="toast" role="status" style={{ bottom: 'var(--toast-bottom, 24px)' }}>
          <span>{toastMsg}</span>
          {toastAction && (
            <button
              type="button"
              onClick={() => {
                const a = toastAction
                clearTimeout(toastTimer.current)
                setToastMsg(null)
                setToastAction(null)
                a.run()
              }}
            >
              {toastAction.label}
            </button>
          )}
        </div>
      )}
    </AppCtx.Provider>
  )
}
