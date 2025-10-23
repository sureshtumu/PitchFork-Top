/*
  # Create Analysis Output Documents Storage Bucket
  
  1. New Bucket
    - `analysis-output-docs` - Stores generated PDF reports from analyses
    - Private bucket (not publicly accessible)
    - Only authenticated users can access
  
  2. Security Policies
    - Authenticated users can upload reports
    - Authenticated users can read reports
    - Users can only access reports they're authorized for
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'analysis-output-docs',
  'analysis-output-docs',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload analysis reports
CREATE POLICY "Authenticated users can upload analysis reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'analysis-output-docs' AND
  auth.role() = 'authenticated'
);

-- Policy: Authenticated users can read analysis reports
CREATE POLICY "Authenticated users can read analysis reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'analysis-output-docs');

-- Policy: Users can update their own reports
CREATE POLICY "Users can update their own analysis reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'analysis-output-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'analysis-output-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own reports
CREATE POLICY "Users can delete their own analysis reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'analysis-output-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
