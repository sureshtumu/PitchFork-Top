/*
  # Remove status check constraint from companies table

  1. Changes
    - Remove the `companies_status_check` constraint from the companies table
    - This allows any status value to be stored in the status column

  2. Security
    - No RLS changes needed as this only removes a constraint
*/

ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_status_check;