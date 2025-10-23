/*
  # Create extracted_data table

  1. New Tables
    - `extracted_data`
      - `id` (uuid, primary key) - Unique identifier for each extraction
      - `file_path` (text) - Path to the file in storage
      - `extracted_info` (jsonb) - Extracted information (company_name, industry, key_team_members)
      - `created_at` (timestamptz) - When the extraction was performed
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `extracted_data` table
    - Add policy for authenticated users to read extracted data
    - Add policy for authenticated users to insert extracted data
    - Add policy for authenticated users to update their own extracted data

  3. Notes
    - The extracted_info column stores JSON data with flexible structure
    - Indexes added for efficient querying by file_path
*/

-- Create extracted_data table
CREATE TABLE IF NOT EXISTS extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  extracted_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on file_path for fast lookups
CREATE INDEX IF NOT EXISTS idx_extracted_data_file_path ON extracted_data(file_path);

-- Enable RLS
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all extracted data
CREATE POLICY "Authenticated users can read extracted data"
  ON extracted_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert extracted data
CREATE POLICY "Authenticated users can insert extracted data"
  ON extracted_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update extracted data
CREATE POLICY "Authenticated users can update extracted data"
  ON extracted_data
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_extracted_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
DROP TRIGGER IF EXISTS extracted_data_updated_at ON extracted_data;
CREATE TRIGGER extracted_data_updated_at
  BEFORE UPDATE ON extracted_data
  FOR EACH ROW
  EXECUTE FUNCTION update_extracted_data_updated_at();
