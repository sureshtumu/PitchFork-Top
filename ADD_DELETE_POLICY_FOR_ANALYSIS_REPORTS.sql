-- Add DELETE policy for analysis_reports table
-- Run this in your Supabase SQL Editor

-- Allow authenticated users to delete analysis reports
-- This policy allows any authenticated user to delete any report
-- You can make it more restrictive if needed (e.g., only allow deletion by the user who created the report)

CREATE POLICY "Authenticated users can delete analysis reports"
  ON analysis_reports
  FOR DELETE
  TO authenticated
  USING (true);

-- Alternative more restrictive policy (uncomment if you want to restrict deletion):
-- Only allow deletion by the user who generated the report
-- CREATE POLICY "Users can delete their own analysis reports"
--   ON analysis_reports
--   FOR DELETE
--   TO authenticated
--   USING (generated_by = auth.uid());

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'analysis_reports';
