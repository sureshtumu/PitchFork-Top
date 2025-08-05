/*
  # Add status field to companies table

  1. Changes
    - Add `status` column to `companies` table with enum constraint
    - Set default value to 'Submitted' for new records
    - Update existing records to have 'Submitted' status

  2. Status Values
    - Submitted: Initial status when company is created
    - Pending: Company is being reviewed
    - Analyzed: Analysis has been completed
    - In-Diligence: Company is in due diligence process
    - Rejected: Company has been rejected
    - DD-Rejected: Company rejected during due diligence
    - Invested: Investment has been made

  3. Security
    - Maintains existing RLS policies
*/

-- Add status column with enum constraint
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Submitted' 
CHECK (status IN ('Submitted', 'Pending', 'Analyzed', 'In-Diligence', 'Rejected', 'DD-Rejected', 'Invested'));

-- Update existing records to have 'Submitted' status
UPDATE companies 
SET status = 'Submitted' 
WHERE status IS NULL;

-- Add index for better query performance on status
CREATE INDEX IF NOT EXISTS companies_status_idx ON companies (status);