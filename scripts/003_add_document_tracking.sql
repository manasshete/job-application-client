-- Add documents_generated_this_month column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS documents_generated_this_month INTEGER DEFAULT 0;

-- Create a function to reset document counts monthly (can be called via cron)
CREATE OR REPLACE FUNCTION reset_monthly_document_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles SET documents_generated_this_month = 0;
END;
$$;
