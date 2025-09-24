/*
  # Add description field to prompts table

  1. Changes
    - Add `description` column to `prompts` table
    - Set default value to empty string for consistency
    - Make it nullable to handle existing records

  2. Notes
    - Existing records will have null description initially
    - New records can include description
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'description'
  ) THEN
    ALTER TABLE prompts ADD COLUMN description text DEFAULT '';
  END IF;
END $$;