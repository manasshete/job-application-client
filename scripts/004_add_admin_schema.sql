-- Admin Dashboard Schema
-- 1. Add is_admin flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Security-definer function to check admin status (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 3. Admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_logs;
CREATE POLICY "Admins can insert audit logs" ON public.admin_logs
  FOR INSERT WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- 4. Admin-wide read policies on existing tables
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
CREATE POLICY "Admins can view all jobs" ON public.jobs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all interviews" ON public.interviews;
CREATE POLICY "Admins can view all interviews" ON public.interviews
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR SELECT USING (public.is_admin());

-- 5. Designate the first admin (run manually with your email):
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your@email.com';
