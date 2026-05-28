-- Storage bucket для обложек объектов
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Публичное чтение
CREATE POLICY IF NOT EXISTS "covers_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

-- Загрузка только admin/moderator
CREATE POLICY IF NOT EXISTS "covers_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY IF NOT EXISTS "covers_update_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY IF NOT EXISTS "covers_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );
