/*
  # Create founder messages table

  1. New Tables
    - `founder_messages`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `title` (text)
      - `message` (text)
      - `status` (text, default 'unread')
      - `date_sent` (timestamp)

  2. Security
    - Enable RLS on `founder_messages` table
    - Add policy for authenticated users to read messages for their companies
*/

CREATE TABLE IF NOT EXISTS founder_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread',
  date_sent timestamptz DEFAULT now()
);

ALTER TABLE founder_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders can read messages for their companies"
  ON founder_messages
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE email_1 = auth.email()
    )
  );

CREATE POLICY "System can insert messages"
  ON founder_messages
  FOR INSERT
  TO authenticated
  USING (true);

CREATE INDEX founder_messages_company_id_idx ON founder_messages(company_id);
CREATE INDEX founder_messages_date_sent_idx ON founder_messages(date_sent DESC);