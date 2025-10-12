-- Add 'Screened' Status to Analysis Table
-- Run this in Supabase Dashboard → SQL Editor

-- Drop the existing constraint
ALTER TABLE analysis DROP CONSTRAINT IF EXISTS analysis_status_check;

-- Add the updated constraint with 'Screened' status
ALTER TABLE analysis
  ADD CONSTRAINT analysis_status_check 
  CHECK (status IN ('submitted', 'Screened', 'in_progress', 'completed', 'rejected'));

-- Verify it worked
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'analysis'::regclass
AND con.conname = 'analysis_status_check';


