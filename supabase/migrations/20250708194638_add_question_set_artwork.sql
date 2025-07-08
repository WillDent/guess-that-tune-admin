-- Add artwork_url column to question_sets table
ALTER TABLE question_sets 
ADD COLUMN artwork_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN question_sets.artwork_url IS 'URL to the question set artwork stored in Supabase Storage';

-- Create storage bucket for question set artwork
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-set-artwork', 
  'question-set-artwork', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can upload artwork for their own question sets
CREATE POLICY "Users can upload their own question set artwork"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'question-set-artwork' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can update their own question set artwork
CREATE POLICY "Users can update their own question set artwork"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'question-set-artwork' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can delete their own question set artwork
CREATE POLICY "Users can delete their own question set artwork"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'question-set-artwork' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Anyone can view question set artwork (public bucket)
CREATE POLICY "Anyone can view question set artwork"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-set-artwork');