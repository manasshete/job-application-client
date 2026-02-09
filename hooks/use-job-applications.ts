'use client'

import { useEffect, useState } from 'react'
import type { JobApplication } from '@/lib/types'

const STORAGE_KEY = 'job-applications'

export function useJobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setApplications(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored applications:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications))
    }
  }, [applications, isLoaded])

  const addApplication = (application: Omit<JobApplication, 'id'>) => {
    const newApp: JobApplication = {
      ...application,
      id: crypto.randomUUID(),
    }
    setApplications((prev) => [newApp, ...prev])
    return newApp
  }

  const updateApplication = (id: string, updates: Partial<JobApplication>) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...updates } : app))
    )
  }

  const deleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id))
  }

  return {
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
    isLoaded,
  }
}
