-- Remove the status constraint from analysis table
-- This allows any status value to be used
-- Run this in Supabase Dashboard → SQL Editor

-- Drop the constraint
ALTER TABLE analysis DROP CONSTRAINT IF EXISTS analysis_status_check;

-- Verify it's gone
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'analysis'::regclass
AND con.conname = 'analysis_status_check';

-- Should return no rows if successfully removed


