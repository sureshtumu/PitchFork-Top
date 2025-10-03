/*
  # Add user_id to companies table

  1. Changes
    - Add `user_id` column to companies table to link companies to founders
    - Add foreign key constraint to auth.users
    - Create index on user_id for faster lookups
  
  2. Security
    - Update RLS policies to use user_id for founder access
*/

-- Add user_id column to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
  END IF;
END $$;

-- Update existing RLS policies to consider user_id
DROP POLICY IF EXISTS "Allow authenticated users to read companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to insert companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to update companies" ON companies;

-- Allow all authenticated users to read all companies (for investors)
CREATE POLICY "Authenticated users can view all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Allow founders to insert their own companies
CREATE POLICY "Founders can insert their own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow founders to update their own companies, investors can update any
CREATE POLICY "Users can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.user_type = 'investor'
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.user_type = 'investor'
    )
  );
