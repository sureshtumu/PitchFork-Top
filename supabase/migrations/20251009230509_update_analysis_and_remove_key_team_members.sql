/*
  # Update Analysis Table and Remove Key Team Members
  
  1. Analysis Table Changes
    - Add recommendation_reason (text) - Why the recommendation was made
    - Add history (text) - Track changes/updates to the analysis
  
  2. Companies Table Changes
    - Remove key_team_members field (moved to team analysis reports)
  
  3. Rationale
    - recommendation_reason helps track investment decision logic
    - history provides audit trail of analysis changes
    - key_team_members better suited for dedicated team analysis, not general company info
*/

-- Add fields to analysis table
ALTER TABLE analysis
  ADD COLUMN IF NOT EXISTS recommendation_reason text,
  ADD COLUMN IF NOT EXISTS history text DEFAULT '';

-- Add comments for documentation
COMMENT ON COLUMN analysis.recommendation_reason IS 'Explanation of why this recommendation was made';
COMMENT ON COLUMN analysis.history IS 'Audit trail of changes and updates to this analysis';

-- Remove key_team_members from companies table
ALTER TABLE companies
  DROP COLUMN IF EXISTS key_team_members;
