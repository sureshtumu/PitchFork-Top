/*
  # Create Investor Details Table

  ## Summary
  Creates a table to store detailed information about investors when they register. Each investor user will have a corresponding entry in this table.

  ## New Table

  ### `investor_details`
  Stores detailed information about investors who register on the platform.
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Links to the investor's user account
  - `firm_name` (text) - Name of the investment firm
  - `focus_areas` (text) - Investment focus areas/industries
  - `comment` (text) - Additional comments or description
  - `investment_criteria_doc` (text) - Path to uploaded investment criteria document
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on the table
  - Investors can read and update their own details
  - Founders can read all investor details (to see who to submit to)
  - Only authenticated users can access

  ## Important Notes
  - This replaces the dummy "investors" table for displaying real investor users
  - The analysis table will be updated to link to user_id instead of investor_id
*/

-- Create investor_details table
CREATE TABLE IF NOT EXISTS investor_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_name text DEFAULT '',
  focus_areas text DEFAULT '',
  comment text DEFAULT '',
  investment_criteria_doc text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT investor_details_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE investor_details ENABLE ROW LEVEL SECURITY;

-- Policy: Investors can view and update their own details
CREATE POLICY "Investors can view own details"
  ON investor_details FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Investors can update own details"
  ON investor_details FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Founders can view all investor details
CREATE POLICY "Founders can view all investor details"
  ON investor_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'founder'
    )
  );

-- Policy: System can insert investor details during registration
CREATE POLICY "System can insert investor details"
  ON investor_details FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_investor_details_user_id ON investor_details(user_id);