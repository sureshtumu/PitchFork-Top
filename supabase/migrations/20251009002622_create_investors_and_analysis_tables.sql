/*
  # Create Investors and Analysis Tables

  ## Summary
  Creates the infrastructure for investor-based analysis workflow where founders can submit companies to multiple investors and track analysis results per investor.

  ## New Tables

  ### `investors`
  Stores investor information that founders can select when submitting companies.
  - `id` (uuid, primary key)
  - `name` (text, not null) - Investor name
  - `firm_name` (text) - Investment firm name
  - `email` (text) - Contact email
  - `focus_areas` (text) - Investment focus areas/industries
  - `description` (text) - Brief description of investor
  - `is_active` (boolean, default true) - Whether investor is available for selection
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `analysis`
  Stores analysis results for each company-investor pair.
  - `id` (uuid, primary key)
  - `company_id` (uuid, foreign key to companies)
  - `investor_id` (uuid, foreign key to investors)
  - `status` (text, default 'submitted') - Analysis status (submitted, in_progress, completed, rejected)
  - `overall_score` (numeric, 0-10)
  - `recommendation` (text) - Investment recommendation
  - `comments` (text) - Analysis comments/notes
  - `analyzed_at` (timestamptz) - When analysis was completed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on both tables
  - Investors table: authenticated users can read, only admins can write
  - Analysis table: founders can read their own company analyses, investors can read/write analyses for their companies

  ## Important Notes
  - This migration sets up the new structure for multi-investor analysis
  - The companies table will be modified in a separate migration to remove investor-specific fields
  - Unique constraint on (company_id, investor_id) ensures one analysis per company-investor pair
*/

-- Create investors table
CREATE TABLE IF NOT EXISTS investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  firm_name text,
  email text,
  focus_areas text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analysis table
CREATE TABLE IF NOT EXISTS analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  status text DEFAULT 'submitted',
  overall_score numeric,
  recommendation text,
  comments text,
  analyzed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT analysis_company_investor_unique UNIQUE (company_id, investor_id),
  CONSTRAINT analysis_score_range CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 10)),
  CONSTRAINT analysis_status_check CHECK (status IN ('submitted', 'in_progress', 'completed', 'rejected'))
);

-- Enable RLS
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;

-- Investors policies: anyone authenticated can read active investors
CREATE POLICY "Authenticated users can view active investors"
  ON investors FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Analysis policies: founders can read analysis for their companies
CREATE POLICY "Founders can view analysis for their companies"
  ON analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = analysis.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Analysis policies: investors can view all analysis (will be refined with investor user_id later)
CREATE POLICY "Investors can view all analysis"
  ON analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'investor'
    )
  );

-- Analysis policies: investors can update analysis
CREATE POLICY "Investors can update analysis"
  ON analysis FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'investor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'investor'
    )
  );

-- Analysis policies: system can insert analysis entries
CREATE POLICY "System can insert analysis"
  ON analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_company_id ON analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_analysis_investor_id ON analysis(investor_id);
CREATE INDEX IF NOT EXISTS idx_analysis_status ON analysis(status);

-- Insert sample investors
INSERT INTO investors (name, firm_name, email, focus_areas, description) VALUES
  ('Sarah Chen', 'TechVentures Capital', 'sarah@techventures.com', 'SaaS, AI, Enterprise Software', 'Focused on early-stage B2B SaaS companies with strong product-market fit'),
  ('Michael Rodriguez', 'Innovation Partners', 'michael@innovationpartners.com', 'FinTech, Healthcare, Climate Tech', 'Seed to Series A investments in disruptive technology companies'),
  ('Emily Thompson', 'Growth Equity Fund', 'emily@growthequity.com', 'E-commerce, Consumer Tech, MarketPlaces', 'Series B+ investments in high-growth consumer companies'),
  ('David Kim', 'Quantum Ventures', 'david@quantumvc.com', 'Deep Tech, Quantum Computing, Robotics', 'Investing in cutting-edge technology and hardware innovations')
ON CONFLICT DO NOTHING;