/*
  # Create profile images storage bucket

  1. New Storage Buckets
    - `profile-images`
      - Public bucket for profile and banner images
      - Organized by: profile_pic/{user_uuid} and Banner/{user_uuid}

  2. Modified Tables
    - `profiles`
      - Added `banner_url` (text, default '') for banner image URLs

  3. Security
    - Storage policies allow:
      - Anyone can view images (public read)
      - Authenticated users can upload/update their own images
      - Users can only delete their own images
    - RLS enabled on profiles table

  4. Notes
    - Images are stored at: profile_pic/{user_uuid} and Banner/{user_uuid}
    - Old avatar_url column remains for backwards compatibility
    - New uploads will use storage bucket URLs
*/

-- Add banner_url column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url text NOT NULL DEFAULT '';

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile pictures (profile_pic/{user_uuid})
CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload own profile picture"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = 'profile_pic' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can update own profile picture"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = 'profile_pic' AND
    (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = 'profile_pic' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can delete own profile picture"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = 'profile_pic' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Storage policies for banner pictures (Banner/{user_uuid})
CREATE POLICY "Users can upload own banner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = 'Banner' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can update own banner"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = 'Banner' AND
    (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = 'Banner' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can delete own banner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = 'Banner' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );
