/*
  # Enhanced Company and Document Management

  1. Enhanced Tables
    - `companies` table with additional business fields
      - Basic info: name, industry, address, country
      - Contact 1: name, title, email, phone
      - Contact 2: name, title, email, phone  
      - Business: description, funding_sought
    - `documents` table with metadata fields
      - Enhanced with: document_name, description, date_added

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
*/

-- Drop existing tables to recreate with new schema
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS companies;

-- Create enhanced companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  industry text DEFAULT '',
  address text DEFAULT '',
  country text DEFAULT '',
  contact_name_1 text DEFAULT '',
  title_1 text DEFAULT '',
  email_1 text DEFAULT '',
  phone_1 text DEFAULT '',
  contact_name_2 text DEFAULT '',
  title_2 text DEFAULT '',
  email_2 text DEFAULT '',
  phone_2 text DEFAULT '',
  description text DEFAULT '',
  funding_sought text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create enhanced documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  filename text NOT NULL,
  document_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  path text NOT NULL,
  date_added timestamptz DEFAULT now(),
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Authenticated users can read companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete companies"
  ON companies
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for documents
CREATE POLICY "Authenticated users can read documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS companies_name_idx ON companies(name);
CREATE INDEX IF NOT EXISTS documents_company_id_idx ON documents(company_id);
CREATE INDEX IF NOT EXISTS documents_date_added_idx ON documents(date_added);