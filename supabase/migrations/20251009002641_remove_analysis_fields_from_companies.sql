/*
  # Remove Analysis Fields from Companies Table

  ## Summary
  Removes investor-specific analysis fields from the companies table since they now belong in the analysis table.

  ## Changes
  - Remove `overall_score` column
  - Remove `recommendation` column
  - Remove `Investor_user_id` column
  - Keep `status` as it tracks company submission status, not analysis status

  ## Important Notes
  - This migration only removes columns that are now tracked per-investor in the analysis table
  - The `status` field remains as it tracks the company's overall submission status
*/

-- Remove overall_score column (now in analysis table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'overall_score'
  ) THEN
    ALTER TABLE companies DROP COLUMN overall_score;
  END IF;
END $$;

-- Remove recommendation column (now in analysis table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'recommendation'
  ) THEN
    ALTER TABLE companies DROP COLUMN recommendation;
  END IF;
END $$;

-- Remove Investor_user_id column (analysis now links to investor_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'Investor_user_id'
  ) THEN
    ALTER TABLE companies DROP COLUMN "Investor_user_id";
  END IF;
END $$;