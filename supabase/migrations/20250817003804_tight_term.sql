/*
  # Add analysis reports table

  1. New Tables
    - `analysis_reports`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `report_type` (text: summary, detailed, feedback)
      - `file_name` (text)
      - `file_path` (text)
      - `generated_at` (timestamp)
      - `generated_by` (uuid, foreign key to users)

  2. Security
    - Enable RLS on `analysis_reports` table
    - Add policies for authenticated users to read reports
    - Add policy for investors to create reports
*/

CREATE TABLE IF NOT EXISTS analysis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('summary', 'detailed', 'feedback')),
  file_name text NOT NULL,
  file_path text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read analysis reports"
  ON analysis_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create analysis reports"
  ON analysis_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX analysis_reports_company_id_idx ON analysis_reports(company_id);
CREATE INDEX analysis_reports_report_type_idx ON analysis_reports(report_type);
CREATE INDEX analysis_reports_generated_at_idx ON analysis_reports(generated_at DESC);