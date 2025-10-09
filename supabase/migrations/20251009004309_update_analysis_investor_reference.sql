/*
  # Update Analysis Table to Reference User IDs

  ## Summary
  Updates the analysis table to reference investor user_id from auth.users instead of the dummy investors table.

  ## Changes
  - Rename investor_id column to investor_user_id for clarity
  - Update foreign key to reference auth.users instead of investors table
  - Update unique constraint
  - Update indexes

  ## Important Notes
  - The investor_id field now references actual user accounts
  - Existing data will be preserved if any
*/

-- Drop the existing foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'analysis_investor_id_fkey'
    AND table_name = 'analysis'
  ) THEN
    ALTER TABLE analysis DROP CONSTRAINT analysis_investor_id_fkey;
  END IF;
END $$;

-- Drop the existing unique constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'analysis_company_investor_unique'
    AND table_name = 'analysis'
  ) THEN
    ALTER TABLE analysis DROP CONSTRAINT analysis_company_investor_unique;
  END IF;
END $$;

-- Rename the column for clarity (investor_id -> investor_user_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analysis' AND column_name = 'investor_id'
  ) THEN
    ALTER TABLE analysis RENAME COLUMN investor_id TO investor_user_id;
  END IF;
END $$;

-- Add new foreign key constraint to auth.users
ALTER TABLE analysis
  ADD CONSTRAINT analysis_investor_user_id_fkey
  FOREIGN KEY (investor_user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Recreate unique constraint with new column name
ALTER TABLE analysis
  ADD CONSTRAINT analysis_company_investor_user_unique
  UNIQUE (company_id, investor_user_id);

-- Drop old index and create new one
DROP INDEX IF EXISTS idx_analysis_investor_id;
CREATE INDEX IF NOT EXISTS idx_analysis_investor_user_id ON analysis(investor_user_id);