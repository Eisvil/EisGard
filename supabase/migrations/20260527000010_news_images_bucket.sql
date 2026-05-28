-- Storage bucket for news cover images and Tiptap inline images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-images',
  'news-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "news_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'news-images');

-- Admin/moderator can upload
CREATE POLICY "news_images_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'news-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Admin/moderator can delete
CREATE POLICY "news_images_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'news-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
