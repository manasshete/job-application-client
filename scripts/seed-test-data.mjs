// Seeds a TEST Supabase project with fake users and jobs.
//
//   node --env-file=.env.local scripts/seed-test-data.mjs
//
// Refuses to run against the client's production project.
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const PRODUCTION_REF = 'qoekdspxbdbywyenyzah'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  process.exit(1)
}
if (url.includes(PRODUCTION_REF)) {
  console.error('Refusing to seed: this env points at the production project.')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const PASSWORD = 'Test1234!'

const users = [
  { email: 'alice@test.local', full_name: 'Alice Tester' },
  { email: 'bob@test.local', full_name: 'Bob Tester' },
  { email: 'admin@test.local', full_name: 'Admin Tester', admin: true },
]

const jobs = [
  { company: 'Acme Corp', position: 'Frontend Engineer', status: 'applied', location: 'Remote' },
  { company: 'Globex', position: 'Backend Engineer', status: 'interview', location: 'Pune' },
  { company: 'Initech', position: 'Full Stack Developer', status: 'offer', location: 'Bengaluru' },
  { company: 'Umbrella', position: 'DevOps Engineer', status: 'rejected', location: 'Remote' },
]

const passwordHash = await bcrypt.hash(PASSWORD, 10)

for (const u of users) {
  const { data: existing } = await admin.from('app_users').select('id').eq('email', u.email).maybeSingle()
  const { data: user, error } = existing
    ? await admin
        .from('app_users')
        .update({ password_hash: passwordHash, full_name: u.full_name })
        .eq('id', existing.id)
        .select('id')
        .single()
    : await admin
        .from('app_users')
        .insert({ email: u.email, password_hash: passwordHash, full_name: u.full_name })
        .select('id')
        .single()
  if (error) {
    console.error(`Could not create ${u.email}:`, error.message)
    process.exit(1)
  }

  if (u.admin) {
    await admin.from('profiles').update({ is_admin: true }).eq('id', user.id)
  }

  await admin.from('jobs').delete().eq('user_id', user.id)
  const { error: jobError } = await admin.from('jobs').insert(
    jobs.map((j, i) => ({
      ...j,
      user_id: user.id,
      date_applied: new Date(Date.now() - i * 5 * 86400000).toISOString().slice(0, 10),
    })),
  )
  if (jobError) console.warn(`Jobs for ${u.email}:`, jobError.message)
  console.log(`seeded ${u.email}${u.admin ? ' (admin)' : ''}`)
}

console.log(`\nDone. Log in with any of the emails above, password: ${PASSWORD}`)
