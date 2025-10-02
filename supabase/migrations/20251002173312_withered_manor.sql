/*
  # Create uploaded-files table

  1. New Tables
    - `uploaded-files`
      - `id` (uuid, primary key)
      - `name` (text, not null) - User-provided name for the file
      - `file_path` (text, not null) - Path to file in Supabase storage
      - `original_filename` (text, not null) - Original filename from upload
      - `file_size` (bigint, not null) - File size in bytes
      - `content_type` (text, not null) - MIME type of the file
      - `created_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `uploaded-files` table
    - Add policy for authenticated users to manage their uploaded files
*/

CREATE TABLE IF NOT EXISTS "uploaded-files" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  content_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "uploaded-files" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage uploaded files"
  ON "uploaded-files"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);