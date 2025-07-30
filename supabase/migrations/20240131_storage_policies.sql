-- Create storage bucket for question set artwork if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-set-artwork',
  'question-set-artwork',
  true, -- Public bucket so images can be viewed
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload artwork" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update artwork" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete artwork" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view artwork" ON storage.objects;

-- Allow authenticated users to upload artwork
CREATE POLICY "Authenticated users can upload artwork"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'question-set-artwork' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their own artwork
CREATE POLICY "Authenticated users can update artwork"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'question-set-artwork' AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'question-set-artwork' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own artwork
CREATE POLICY "Authenticated users can delete artwork"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'question-set-artwork' AND
  auth.uid() IS NOT NULL
);

-- Allow anyone to view artwork (since it's a public bucket)
CREATE POLICY "Anyone can view artwork"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'question-set-artwork');