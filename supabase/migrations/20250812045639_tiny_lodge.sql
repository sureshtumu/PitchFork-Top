/*
  # Create messaging system for investors and founders

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies)
      - `sender_type` (text: 'system', 'investor', 'founder')
      - `sender_id` (uuid, nullable for system messages)
      - `recipient_type` (text: 'investor', 'founder')
      - `recipient_id` (uuid, nullable for broadcast messages)
      - `message_title` (text)
      - `message_detail` (text)
      - `message_status` (text: 'unread', 'read')
      - `date_sent` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `messages` table
    - Add policies for authenticated users to read/write their messages
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('system', 'investor', 'founder')),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('investor', 'founder')),
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message_title text NOT NULL DEFAULT '',
  message_detail text NOT NULL DEFAULT '',
  message_status text NOT NULL DEFAULT 'unread' CHECK (message_status IN ('unread', 'read')),
  date_sent timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for founders to read messages for their companies
CREATE POLICY "Founders can read messages for their companies"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    recipient_type = 'founder' AND
    company_id IN (
      SELECT id FROM companies 
      WHERE email_1 = auth.jwt() ->> 'email'
    )
  );

-- Policy for investors to read all messages
CREATE POLICY "Investors can read all messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (recipient_type = 'investor');

-- Policy for authenticated users to insert messages
CREATE POLICY "Authenticated users can insert messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to update message status
CREATE POLICY "Authenticated users can update message status"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    (recipient_type = 'founder' AND company_id IN (
      SELECT id FROM companies 
      WHERE email_1 = auth.jwt() ->> 'email'
    )) OR
    (recipient_type = 'investor')
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_company_id_idx ON messages(company_id);
CREATE INDEX IF NOT EXISTS messages_recipient_type_idx ON messages(recipient_type);
CREATE INDEX IF NOT EXISTS messages_date_sent_idx ON messages(date_sent DESC);
CREATE INDEX IF NOT EXISTS messages_status_idx ON messages(message_status);