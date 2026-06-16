import { redirect } from 'next/navigation'
import { verifyAdmin } from '@/lib/admin/auth'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

// Admin dashboard is always dynamic — never cached/prerendered
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const check = await verifyAdmin()

  // Non-admins and unauthenticated users are redirected away.
  // We do not reveal that this route exists.
  if (!check.ok) {
    redirect('/dashboard')
  }

  return <AdminDashboard adminEmail={check.user.email ?? 'Admin'} />
}
