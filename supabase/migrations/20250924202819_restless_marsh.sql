/*
  # Add Company Analysis Fields

  1. New Fields Added
    - Serviceable Market Size (value, units, raw, basis)
    - Annual Revenue (value, units, raw, period)
    - Investment Terms (amount, units, raw, instrument, other terms)
    - Valuation (value, units, raw, type)
    - Key Team Members (JSON array)
    - Extraction Metadata (confidence, sources, notes as JSON)

  2. Field Types
    - Numeric fields for structured data analysis
    - Text fields for units and raw extracted text
    - JSONB fields for complex data and metadata
    - Default values to handle existing records

  3. Purpose
    - Enhanced AI extraction and analysis capabilities
    - Better structured data for investment decisions
    - Audit trail for extraction confidence and sources
*/

-- Serviceable Market Size
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS serviceable_market_size_value numeric,
  ADD COLUMN IF NOT EXISTS serviceable_market_size_units text DEFAULT '',
  ADD COLUMN IF NOT EXISTS serviceable_market_size_raw text DEFAULT '',
  ADD COLUMN IF NOT EXISTS serviceable_market_size_basis text DEFAULT '';

-- Annual Revenue
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS annual_revenue_value numeric,
  ADD COLUMN IF NOT EXISTS annual_revenue_units text DEFAULT '',
  ADD COLUMN IF NOT EXISTS annual_revenue_raw text DEFAULT '',
  ADD COLUMN IF NOT EXISTS annual_revenue_period text DEFAULT '';

-- Investment Terms
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS investment_amount_value numeric,
  ADD COLUMN IF NOT EXISTS investment_amount_units text DEFAULT '',
  ADD COLUMN IF NOT EXISTS investment_amount_raw text DEFAULT '',
  ADD COLUMN IF NOT EXISTS investment_instrument text DEFAULT '',
  ADD COLUMN IF NOT EXISTS investment_other_terms text DEFAULT '';

-- Valuation
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS valuation_value numeric,
  ADD COLUMN IF NOT EXISTS valuation_units text DEFAULT '',
  ADD COLUMN IF NOT EXISTS valuation_raw text DEFAULT '',
  ADD COLUMN IF NOT EXISTS valuation_type text DEFAULT '';

-- Key Team Members (store as JSON array)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS key_team_members jsonb DEFAULT '[]';

-- Extraction metadata (optional, helps auditing)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS extraction_confidence jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS extraction_sources jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS extraction_notes jsonb DEFAULT '{}'::jsonb;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS companies_serviceable_market_size_value_idx ON companies (serviceable_market_size_value);
CREATE INDEX IF NOT EXISTS companies_annual_revenue_value_idx ON companies (annual_revenue_value);
CREATE INDEX IF NOT EXISTS companies_investment_amount_value_idx ON companies (investment_amount_value);
CREATE INDEX IF NOT EXISTS companies_valuation_value_idx ON companies (valuation_value);

-- Add GIN indexes for JSONB fields for efficient querying
CREATE INDEX IF NOT EXISTS companies_key_team_members_gin_idx ON companies USING GIN (key_team_members);
CREATE INDEX IF NOT EXISTS companies_extraction_confidence_gin_idx ON companies USING GIN (extraction_confidence);
CREATE INDEX IF NOT EXISTS companies_extraction_sources_gin_idx ON companies USING GIN (extraction_sources);
CREATE INDEX IF NOT EXISTS companies_extraction_notes_gin_idx ON companies USING GIN (extraction_notes);