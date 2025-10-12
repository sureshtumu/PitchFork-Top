/*
  # Add 'Screened' Status to Analysis Table
  
  1. Changes
    - Update analysis_status_check constraint to include 'Screened' status
    - This allows the AI screening workflow to set status to 'Screened'
  
  2. Status Values
    - 'submitted': Initial submission
    - 'Screened': AI screening completed (new!)
    - 'in_progress': Manual analysis in progress
    - 'completed': Analysis completed
    - 'rejected': Rejected by investor
*/

-- Drop the existing constraint
ALTER TABLE analysis DROP CONSTRAINT IF EXISTS analysis_status_check;

-- Add the updated constraint with 'Screened' status
ALTER TABLE analysis
  ADD CONSTRAINT analysis_status_check 
  CHECK (status IN ('submitted', 'Screened', 'in_progress', 'completed', 'rejected'));

-- Add comment for documentation
COMMENT ON COLUMN analysis.status IS 'Analysis status: submitted (initial), Screened (AI screening done), in_progress (manual analysis), completed (analysis done), rejected (investor rejected)';


