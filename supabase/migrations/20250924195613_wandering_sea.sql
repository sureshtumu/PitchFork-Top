/*
  # Create prompts table for AI prompt management

  1. New Tables
    - `prompts`
      - `id` (uuid, primary key)
      - `prompt_name` (text, unique)
      - `prompt_detail` (text)
      - `preferred_llm` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `prompts` table
    - Add policy for authenticated users to manage prompts
*/

CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name text UNIQUE NOT NULL,
  prompt_detail text NOT NULL,
  preferred_llm text DEFAULT 'GPT-4',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage prompts"
  ON prompts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX prompts_name_idx ON prompts (prompt_name);
CREATE INDEX prompts_created_at_idx ON prompts (created_at DESC);

-- Insert some default prompts
INSERT INTO prompts (prompt_name, prompt_detail, preferred_llm) VALUES
('Company Analysis', 'Analyze the provided company documents and generate a comprehensive investment analysis including market assessment, team evaluation, financial projections, and risk factors.', 'GPT-4'),
('Market Research', 'Conduct detailed market research based on the company information provided, including market size, competition analysis, and growth potential.', 'Claude-3'),
('Financial Analysis', 'Perform thorough financial analysis of the company including revenue projections, burn rate, funding requirements, and valuation assessment.', 'GPT-4');