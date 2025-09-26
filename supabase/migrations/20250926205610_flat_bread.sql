/*
  # Fix Companies Table Schema

  1. Tables
    - Ensure `companies` table has all required columns
    - Ensure `documents` table has all required columns

  2. Security
    - Maintain RLS policies
*/

-- First, let's ensure the companies table exists with all required columns
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

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Check and add contact_name_2 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'contact_name_2'
  ) THEN
    ALTER TABLE companies ADD COLUMN contact_name_2 text DEFAULT '';
  END IF;

  -- Check and add title_2 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'title_2'
  ) THEN
    ALTER TABLE companies ADD COLUMN title_2 text DEFAULT '';
  END IF;

  -- Check and add email_2 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'email_2'
  ) THEN
    ALTER TABLE companies ADD COLUMN email_2 text DEFAULT '';
  END IF;

  -- Check and add phone_2 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'phone_2'
  ) THEN
    ALTER TABLE companies ADD COLUMN phone_2 text DEFAULT '';
  END IF;

  -- Check and add industry column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'industry'
  ) THEN
    ALTER TABLE companies ADD COLUMN industry text DEFAULT '';
  END IF;

  -- Check and add address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address'
  ) THEN
    ALTER TABLE companies ADD COLUMN address text DEFAULT '';
  END IF;

  -- Check and add country column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'country'
  ) THEN
    ALTER TABLE companies ADD COLUMN country text DEFAULT '';
  END IF;

  -- Check and add contact_name_1 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'contact_name_1'
  ) THEN
    ALTER TABLE companies ADD COLUMN contact_name_1 text DEFAULT '';
  END IF;

  -- Check and add title_1 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'title_1'
  ) THEN
    ALTER TABLE companies ADD COLUMN title_1 text DEFAULT '';
  END IF;

  -- Check and add email_1 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'email_1'
  ) THEN
    ALTER TABLE companies ADD COLUMN email_1 text DEFAULT '';
  END IF;

  -- Check and add phone_1 column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'phone_1'
  ) THEN
    ALTER TABLE companies ADD COLUMN phone_1 text DEFAULT '';
  END IF;

  -- Check and add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'description'
  ) THEN
    ALTER TABLE companies ADD COLUMN description text DEFAULT '';
  END IF;

  -- Check and add funding_sought column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'funding_sought'
  ) THEN
    ALTER TABLE companies ADD COLUMN funding_sought text DEFAULT '';
  END IF;
END $$;

-- Ensure documents table exists with required columns
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

-- Add missing columns to documents table if they don't exist
DO $$
BEGIN
  -- Check and add document_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'document_name'
  ) THEN
    ALTER TABLE documents ADD COLUMN document_name text NOT NULL DEFAULT '';
  END IF;

  -- Check and add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'description'
  ) THEN
    ALTER TABLE documents ADD COLUMN description text DEFAULT '';
  END IF;

  -- Check and add date_added column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'date_added'
  ) THEN
    ALTER TABLE documents ADD COLUMN date_added timestamptz DEFAULT now();
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for companies (only if they don't exist)
DO $$
BEGIN
  -- Companies policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Authenticated users can read companies'
  ) THEN
    CREATE POLICY "Authenticated users can read companies"
      ON companies
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Authenticated users can insert companies'
  ) THEN
    CREATE POLICY "Authenticated users can insert companies"
      ON companies
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Authenticated users can update companies'
  ) THEN
    CREATE POLICY "Authenticated users can update companies"
      ON companies
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Authenticated users can delete companies'
  ) THEN
    CREATE POLICY "Authenticated users can delete companies"
      ON companies
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;

  -- Documents policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Authenticated users can read documents'
  ) THEN
    CREATE POLICY "Authenticated users can read documents"
      ON documents
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Authenticated users can insert documents'
  ) THEN
    CREATE POLICY "Authenticated users can insert documents"
      ON documents
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Authenticated users can update documents'
  ) THEN
    CREATE POLICY "Authenticated users can update documents"
      ON documents
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Authenticated users can delete documents'
  ) THEN
    CREATE POLICY "Authenticated users can delete documents"
      ON documents
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS companies_name_idx ON companies(name);
CREATE INDEX IF NOT EXISTS documents_company_id_idx ON documents(company_id);
CREATE INDEX IF NOT EXISTS documents_date_added_idx ON documents(date_added);