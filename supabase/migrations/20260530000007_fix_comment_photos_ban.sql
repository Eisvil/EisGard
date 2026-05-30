-- Security: banned users should not be able to upload comment photos
-- even if they somehow bypass the API comment-insert ban check.
-- The old policy only checked auth.role() = 'authenticated'.

-- Re-create the storage INSERT policy with ban status check.
-- Note: Storage RLS policies live in the storage schema.

DROP POLICY IF EXISTS "comment_photos_insert_auth" ON storage.objects;

CREATE POLICY "comment_photos_insert_auth" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'comment-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND NOT EXISTS (
      SELECT 1 FROM public.comment_bans cb
      WHERE cb.user_id = auth.uid()
        AND cb.is_active = true
        AND (cb.banned_until IS NULL OR cb.banned_until > NOW())
    )
  );
