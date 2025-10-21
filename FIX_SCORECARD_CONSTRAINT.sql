-- Fix: Add scorecard-analysis to analysis_reports constraint
-- Run this in Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE analysis_reports DROP CONSTRAINT IF EXISTS analysis_reports_report_type_check;

-- Add the updated constraint with 'scorecard-analysis' (the edge function uses this format)
ALTER TABLE analysis_reports
  ADD CONSTRAINT analysis_reports_report_type_check
  CHECK (report_type IN ('summary', 'detailed', 'feedback', 'team-analysis', 'product-analysis', 'market-analysis', 'financial-analysis', 'scorecard-analysis'));

-- Verify the constraint was updated
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'analysis_reports_report_type_check';

