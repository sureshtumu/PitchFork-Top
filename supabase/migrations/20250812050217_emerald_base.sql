/*
  # Add welcome messages for existing companies

  1. Messages
    - Create welcome messages for all existing companies
    - Set proper sender/recipient information
    - Mark as unread for founder attention

  2. Security
    - Messages will be accessible via existing RLS policies
*/

-- Insert welcome messages for all existing companies
INSERT INTO messages (
  company_id,
  sender_type,
  sender_id,
  recipient_type,
  recipient_id,
  message_title,
  message_detail,
  message_status
)
SELECT 
  c.id as company_id,
  'system' as sender_type,
  NULL as sender_id,
  'founder' as recipient_type,
  up.user_id as recipient_id,
  'Company Submitted' as message_title,
  'Thank you for submitting your company information' as message_detail,
  'unread' as message_status
FROM companies c
LEFT JOIN user_profiles up ON up.user_type = 'founder'
WHERE NOT EXISTS (
  SELECT 1 FROM messages m 
  WHERE m.company_id = c.id 
  AND m.message_title = 'Company Submitted'
);