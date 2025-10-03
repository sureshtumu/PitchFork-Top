/*
  # Add email_1 column to companies table

  1. Changes
    - Add email_1 column to companies table if it doesn't exist
    - Migrate existing email data to email_1 column

  2. Notes
    - Uses safe IF NOT EXISTS check to avoid errors
    - Preserves existing data by copying from email column if it exists
*/

-- Add email_1 column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'email_1'
  ) THEN
    ALTER TABLE companies ADD COLUMN email_1 text DEFAULT '';
    
    -- Copy data from email column to email_1 if email column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'email'
    ) THEN
      UPDATE companies SET email_1 = COALESCE(email, '');
    END IF;
  END IF;
END $$;
