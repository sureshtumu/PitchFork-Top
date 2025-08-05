/*
  # Add analysis fields to companies table

  1. New Fields
    - `date_submitted` (timestamptz) - When the company was submitted for analysis
    - `overall_score` (numeric) - Overall analysis score (0-10 scale)
    - `recommendation` (text) - Analysis recommendation with default "Pending Analysis"

  2. Changes
    - Add date_submitted field with default to current timestamp
    - Add overall_score field (nullable for pending analysis)
    - Add recommendation field with default "Pending Analysis"
    - Add index on date_submitted for performance
    - Add index on overall_score for filtering/sorting
    - Add check constraint on overall_score to ensure valid range (0-10)

  3. Data Migration
    - Set date_submitted to created_at for existing records
    - Set recommendation to "Pending Analysis" for existing records
    - Leave overall_score as null for existing records (pending analysis)
*/

-- Add the new fields to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS date_submitted timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS overall_score numeric(3,1) CHECK (overall_score >= 0 AND overall_score <= 10),
ADD COLUMN IF NOT EXISTS recommendation text DEFAULT 'Pending Analysis';

-- Update existing records to set date_submitted to created_at if it exists
UPDATE companies 
SET date_submitted = created_at 
WHERE date_submitted IS NULL AND created_at IS NOT NULL;

-- Update existing records to set recommendation to default value
UPDATE companies 
SET recommendation = 'Pending Analysis' 
WHERE recommendation IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS companies_date_submitted_idx ON companies (date_submitted);
CREATE INDEX IF NOT EXISTS companies_overall_score_idx ON companies (overall_score);
CREATE INDEX IF NOT EXISTS companies_recommendation_idx ON companies (recommendation);