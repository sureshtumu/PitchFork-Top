/*
  # Add date_submitted field to companies table

  1. New Fields
    - `date_submitted` (timestamptz, default now())
      - Tracks when the company was first submitted to the system
      - For existing data, set to August 1, 2025
      - For new records, defaults to current timestamp

  2. Performance
    - Add index on date_submitted for sorting and filtering
*/

-- Add the date_submitted field
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS date_submitted timestamptz DEFAULT now();

-- Update existing records to have August 1, 2025 as date_submitted
UPDATE companies 
SET date_submitted = '2025-08-01 00:00:00+00'::timestamptz 
WHERE date_submitted IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS companies_date_submitted_idx ON companies (date_submitted);