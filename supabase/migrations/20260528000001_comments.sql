-- 1. allow_comments на объектах
ALTER TABLE objects ADD COLUMN allow_comments BOOLEAN NOT NULL DEFAULT false;

-- 2. Минимум подписки: 300 ₽ → 100 ₽
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_amount_kopecks_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_amount_kopecks_check
  CHECK (amount_kopecks >= 10000);

-- 3. Таблица банов (создаём ПЕРВОЙ, до политик object_comments)
CREATE TABLE comment_bans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_until TIMESTAMPTZ,
  reason       TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bans_user_active ON comment_bans(user_id) WHERE is_active = true;
ALTER TABLE comment_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bans_all_admin" ON comment_bans FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

CREATE POLICY "bans_select_own" ON comment_bans FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Таблица комментариев
CREATE TABLE object_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id   UUID NOT NULL REFERENCES objects(id)  ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES object_comments(id)   ON DELETE CASCADE,
  body        JSONB NOT NULL,
  photos      TEXT[] NOT NULL DEFAULT '{}',
  is_deleted  BOOLEAN NOT NULL DEFAULT false,
  deleted_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_object ON object_comments(object_id, created_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_comments_parent ON object_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_user   ON object_comments(user_id);

ALTER TABLE object_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_public" ON object_comments FOR SELECT
  USING (
    is_deleted = false AND
    EXISTS (SELECT 1 FROM objects o WHERE o.id = object_id AND o.allow_comments = true)
  );

CREATE POLICY "comments_insert_auth" ON object_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM comment_bans cb
      WHERE cb.user_id = auth.uid()
        AND cb.is_active = true
        AND (cb.banned_until IS NULL OR cb.banned_until > NOW())
    ) AND
    EXISTS (SELECT 1 FROM objects o WHERE o.id = object_id AND o.allow_comments = true)
  );

CREATE POLICY "comments_update_own" ON object_comments FOR UPDATE
  USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '24 hours' AND
    is_deleted = false
  );

CREATE POLICY "comments_all_admin" ON object_comments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

CREATE TRIGGER object_comments_updated_at
  BEFORE UPDATE ON object_comments
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- 5. Storage bucket для фото комментариев
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comment-photos', 'comment-photos', true, 2097152,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "comment_photos_insert_auth" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comment-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "comment_photos_select_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'comment-photos');

CREATE POLICY "comment_photos_delete_own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'comment-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
