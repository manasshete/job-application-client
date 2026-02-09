import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/data/profiles'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const profile = await getProfile()
  
  if (!profile) {
    redirect('/auth/login')
  }

  return <SettingsClient profile={profile} />
}
