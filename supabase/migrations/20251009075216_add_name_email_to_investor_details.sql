/*
  # Add Name and Email to Investor Details

  ## Summary
  Adds name and email fields to investor_details table so founders can see investor information without needing admin access.

  ## Changes
  - Add `name` column to investor_details
  - Add `email` column to investor_details

  ## Important Notes
  - These fields will be populated from the user's profile during registration
  - This avoids needing to query auth.users which requires admin privileges
*/

-- Add name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_details' AND column_name = 'name'
  ) THEN
    ALTER TABLE investor_details ADD COLUMN name text DEFAULT '';
  END IF;
END $$;

-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investor_details' AND column_name = 'email'
  ) THEN
    ALTER TABLE investor_details ADD COLUMN email text DEFAULT '';
  END IF;
END $$;