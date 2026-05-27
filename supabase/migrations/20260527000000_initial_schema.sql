-- Живое Городище — Initial Schema v1.0
-- Порядок: titles → skills → profiles → user_skills → objects → slots →
--           materials → volunteer_camps → subscriptions → donations →
--           volunteer_applications → material_applications → partner_applications →
--           object_partners → chronicle_events → news → object_views →
--           settings → static_pages

-- Расширения
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. titles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE titles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 60),
  min_points  INTEGER NOT NULL DEFAULT 0 CHECK (min_points >= 0),
  description TEXT,
  privileges  TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_titles_min_points ON titles(min_points ASC);
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "titles_select_public" ON titles FOR SELECT USING (true);
CREATE POLICY "titles_all_admin" ON titles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE TRIGGER titles_updated_at BEFORE UPDATE ON titles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

INSERT INTO titles (name, min_points, description, privileges, sort_order) VALUES
  ('Странник',  0,    'Только начинает путь',         'Доступ к летописи',               1),
  ('Доброхот',  1000, 'Внёс первый вклад',            'Именной сертификат',              2),
  ('Витязь',    2000, 'Верный участник',              'Бесплатный вход раз в год',       3),
  ('Поселенец', 5000, 'Один из основателей городища', 'Бесплатное проживание до 7 дней', 4);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. skills
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE skills (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 80),
  category   TEXT NOT NULL DEFAULT 'general'
               CHECK (category IN ('craft','building','farming','cooking','other','general')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_select_public" ON skills FOR SELECT USING (true);
CREATE POLICY "skills_all_admin" ON skills FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO skills (name, category, sort_order) VALUES
  ('Кузнечное дело',   'craft',    1),
  ('Плотницкое дело',  'building', 2),
  ('Гончарство',       'craft',    3),
  ('Огородничество',   'farming',  4),
  ('Готовка на огне',  'cooking',  5),
  ('Кладка из камня',  'building', 6),
  ('Ткачество',        'craft',    7),
  ('Кожевенное дело',  'craft',    8);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. profiles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  birth_date   DATE,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'user'
                 CHECK (role IN ('user','moderator','admin')),
  title_id     UUID REFERENCES titles(id) ON DELETE SET NULL,
  points       INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  in_chronicle BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_profiles_role   ON profiles(role);
CREATE INDEX idx_profiles_points ON profiles(points DESC);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Автосоздание профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Участник'));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Атомарное начисление баллов
CREATE OR REPLACE FUNCTION increment_points(p_user_id UUID, p_points INTEGER)
RETURNS profiles LANGUAGE plpgsql AS $$
DECLARE result profiles;
BEGIN
  UPDATE profiles SET points = points + p_points
  WHERE id = p_user_id RETURNING * INTO result;
  RETURN result;
END;
$$;

-- Пересчёт всех титулов
CREATE OR REPLACE FUNCTION recalc_all_titles()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles SET title_id = (
    SELECT id FROM titles
    WHERE min_points <= profiles.points
    ORDER BY min_points DESC LIMIT 1
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. user_skills
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE user_skills (
  user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id)   ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_skills_select_public" ON user_skills FOR SELECT USING (true);
CREATE POLICY "user_skills_manage_own"    ON user_skills FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. objects
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE objects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  short_name       TEXT CHECK (char_length(short_name) <= 30),
  zone             TEXT NOT NULL
                     CHECK (zone IN ('craft','public','farming','military','residential')),
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','planned','building','done','working')),
  description      JSONB,
  historical_note  JSONB,
  cover_url        TEXT,
  icon_key         TEXT,
  map_position_x   NUMERIC(5,2),
  map_position_y   NUMERIC(5,2),
  total_goal_rub   INTEGER NOT NULL DEFAULT 0,
  total_raised_rub INTEGER NOT NULL DEFAULT 0,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_objects_status ON objects(status);
CREATE INDEX idx_objects_zone   ON objects(zone);
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objects_select_public" ON objects FOR SELECT USING (status != 'draft');
CREATE POLICY "objects_all_admin"     ON objects FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER objects_updated_at BEFORE UPDATE ON objects
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. slots
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id     UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  slot_type     TEXT NOT NULL CHECK (slot_type IN ('money','materials','labor')),
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  goal_value    INTEGER NOT NULL CHECK (goal_value > 0),
  unit          TEXT NOT NULL DEFAULT 'RUB',
  current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  is_closed     BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_slots_object_id ON slots(object_id);
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slots_select_public" ON slots FOR SELECT USING (true);
CREATE POLICY "slots_all_admin"     ON slots FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE TRIGGER slots_updated_at BEFORE UPDATE ON slots
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. materials
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE materials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  description  TEXT,
  unit         TEXT NOT NULL DEFAULT 'шт',
  needed_qty   NUMERIC(10,2) CHECK (needed_qty > 0),
  received_qty NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  object_id    UUID REFERENCES objects(id) ON DELETE SET NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_select_public" ON materials FOR SELECT USING (is_active = true);
CREATE POLICY "materials_all_admin"     ON materials FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE TRIGGER materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. volunteer_camps
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE volunteer_camps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  date_from      DATE NOT NULL,
  date_to        DATE NOT NULL CHECK (date_to >= date_from),
  max_volunteers INTEGER NOT NULL DEFAULT 20 CHECK (max_volunteers > 0),
  description    TEXT,
  is_open        BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_camps_date_from ON volunteer_camps(date_from);
ALTER TABLE volunteer_camps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camps_select_public" ON volunteer_camps FOR SELECT USING (true);
CREATE POLICY "camps_all_admin"     ON volunteer_camps FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER volunteer_camps_updated_at BEFORE UPDATE ON volunteer_camps
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. subscriptions (до donations — donations.subscription_id FK → subscriptions)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  object_id         UUID REFERENCES objects(id) ON DELETE SET NULL,
  amount_kopecks    INTEGER NOT NULL CHECK (amount_kopecks >= 30000),
  ymoney_token      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paused','cancelled','payment_failed')),
  failed_attempts   INTEGER NOT NULL DEFAULT 0,
  next_payment_date DATE NOT NULL,
  last_payment_date DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subs_user        ON subscriptions(user_id);
CREATE INDEX idx_subs_active_next ON subscriptions(next_payment_date) WHERE status = 'active';
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_manage_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_all_admin"  ON subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. donations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE donations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES profiles(id)      ON DELETE SET NULL,
  object_id           UUID REFERENCES objects(id)       ON DELETE SET NULL,
  slot_id             UUID REFERENCES slots(id)         ON DELETE SET NULL,
  subscription_id     UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_kopecks      INTEGER NOT NULL CHECK (amount_kopecks >= 10000),
  display_name        TEXT NOT NULL DEFAULT '',
  is_anonymous        BOOLEAN NOT NULL DEFAULT false,
  source              TEXT NOT NULL DEFAULT 'ymoney'
                        CHECK (source IN ('ymoney','tbank','sber','manual')),
  ymoney_operation_id TEXT UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','failed','refunded')),
  points_awarded      INTEGER NOT NULL DEFAULT 0,
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_donations_user_id   ON donations(user_id);
CREATE INDEX idx_donations_object_id ON donations(object_id);
CREATE INDEX idx_donations_status    ON donations(status);
CREATE INDEX idx_donations_ymoney_op ON donations(ymoney_operation_id)
  WHERE ymoney_operation_id IS NOT NULL;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_select_own"              ON donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "donations_select_public_confirmed" ON donations FOR SELECT
  USING (status = 'confirmed' AND is_anonymous = false);
CREATE POLICY "donations_insert_any"              ON donations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "donations_all_admin"               ON donations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER donations_updated_at BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. volunteer_applications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE volunteer_applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id)        ON DELETE CASCADE,
  camp_id        UUID NOT NULL REFERENCES volunteer_camps(id) ON DELETE CASCADE,
  object_id      UUID REFERENCES objects(id)                  ON DELETE SET NULL,
  comment        TEXT CHECK (char_length(comment) <= 1000),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','completed')),
  days_worked    INTEGER CHECK (days_worked >= 0),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, camp_id)
);
CREATE INDEX idx_vol_apps_user   ON volunteer_applications(user_id);
CREATE INDEX idx_vol_apps_camp   ON volunteer_applications(camp_id);
CREATE INDEX idx_vol_apps_status ON volunteer_applications(status);
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vol_apps_select_own" ON volunteer_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vol_apps_insert_own" ON volunteer_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vol_apps_all_admin"  ON volunteer_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER vol_apps_updated_at BEFORE UPDATE ON volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. material_applications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE material_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  material_id      UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  object_id        UUID REFERENCES objects(id)            ON DELETE SET NULL,
  quantity         NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  actual_qty       NUMERIC(10,2) CHECK (actual_qty > 0),
  contact_phone    TEXT CHECK (contact_phone ~ '^\+?[0-9\s\-\(\)]{7,20}$'),
  contact_telegram TEXT,
  comment          TEXT CHECK (char_length(comment) <= 500),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','contacted','not_contacted','received','cancelled')),
  points_awarded   INTEGER NOT NULL DEFAULT 0,
  admin_note       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mat_apps_user     ON material_applications(user_id);
CREATE INDEX idx_mat_apps_status   ON material_applications(status);
CREATE INDEX idx_mat_apps_material ON material_applications(material_id);
ALTER TABLE material_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mat_apps_select_own" ON material_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mat_apps_insert_own" ON material_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mat_apps_all_admin"  ON material_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER mat_apps_updated_at BEFORE UPDATE ON material_applications
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Триггер: автообновление materials.received_qty
CREATE OR REPLACE FUNCTION update_material_received_qty()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'received' AND OLD.status != 'received' THEN
    UPDATE materials
    SET received_qty = received_qty + COALESCE(NEW.actual_qty, NEW.quantity)
    WHERE id = NEW.material_id;
  END IF;
  IF OLD.status = 'received' AND NEW.status = 'cancelled' THEN
    UPDATE materials
    SET received_qty = GREATEST(0, received_qty - COALESCE(NEW.actual_qty, NEW.quantity))
    WHERE id = NEW.material_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER material_app_received
  AFTER UPDATE ON material_applications
  FOR EACH ROW EXECUTE FUNCTION update_material_received_qty();

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. partner_applications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE partner_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name      TEXT NOT NULL CHECK (char_length(org_name) BETWEEN 2 AND 200),
  inn           TEXT CHECK (inn ~ '^\d{10}(\d{2})?$'),
  support_type  TEXT NOT NULL CHECK (support_type IN ('money','materials','services','complex')),
  description   TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  contact_name  TEXT NOT NULL CHECK (char_length(contact_name) BETWEEN 2 AND 120),
  contact_email TEXT NOT NULL CHECK (contact_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  contact_phone TEXT,
  object_id     UUID REFERENCES objects(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','contacted','approved','rejected')),
  logo_url      TEXT,
  admin_note    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_partner_apps_status ON partner_applications(status);
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partner_apps_insert_public" ON partner_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "partner_apps_all_admin"     ON partner_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. object_partners
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE object_partners (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id    UUID REFERENCES objects(id) ON DELETE CASCADE,
  org_name     TEXT NOT NULL,
  logo_url     TEXT,
  support_type TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE object_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "object_partners_select_public" ON object_partners FOR SELECT USING (true);
CREATE POLICY "object_partners_all_admin"     ON object_partners FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. chronicle_events
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE chronicle_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     TEXT NOT NULL
                   CHECK (event_type IN ('donation','volunteer','material','object_done','manual')),
  user_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  object_id      UUID REFERENCES objects(id)  ON DELETE SET NULL,
  display_name   TEXT NOT NULL DEFAULT '',
  is_anonymous   BOOLEAN NOT NULL DEFAULT false,
  amount_kopecks INTEGER,
  points         INTEGER,
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_chronicle_created ON chronicle_events(created_at DESC);
CREATE INDEX idx_chronicle_object  ON chronicle_events(object_id);
ALTER TABLE chronicle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chronicle_select_public"  ON chronicle_events FOR SELECT USING (true);
CREATE POLICY "chronicle_insert_service" ON chronicle_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "chronicle_all_admin"      ON chronicle_events FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. news
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE news (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  summary      TEXT CHECK (char_length(summary) <= 500),
  body         JSONB NOT NULL DEFAULT '{}',
  cover_url    TEXT,
  tag          TEXT CHECK (char_length(tag) <= 60),
  published    BOOLEAN NOT NULL DEFAULT false,
  author_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_news_published ON news(published_at DESC) WHERE published = true;
CREATE INDEX idx_news_slug      ON news(slug);
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_select_public" ON news FOR SELECT USING (published = true);
CREATE POLICY "news_all_admin"     ON news FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER news_updated_at BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. object_views
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE object_views (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES objects(id)  ON DELETE CASCADE,
  ip_hash   TEXT NOT NULL,
  user_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (object_id, ip_hash, viewed_at)
);
CREATE INDEX idx_object_views_object_date ON object_views(object_id, viewed_at DESC);
ALTER TABLE object_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "object_views_insert_public" ON object_views FOR INSERT WITH CHECK (true);
CREATE POLICY "object_views_select_admin"  ON object_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_public" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_all_admin"     ON settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO settings (key, value, description) VALUES
  ('points_per_ruble',           '1',                      'Баллов за 1 рубль пожертвования'),
  ('points_per_day',             '1000',                   'Баллов за 1 день волонтёрства'),
  ('ymoney_notification_secret', '"REPLACE_ME"',           'Секрет для проверки webhook ЮMoney'),
  ('ymoney_wallet',              '"REPLACE_ME"',           'Номер кошелька ЮMoney'),
  ('site_name',                  '"Живое Городище"',       'Название сайта'),
  ('map_image_url',              '"/map/settlement.jpg"',  'URL фоновой карты'),
  ('resend_from_email',          '"noreply@gorodische.ru"','Email отправителя'),
  ('admin_notify_email',         '"admin@gorodische.ru"',  'Email уведомлений администратора');

-- ─────────────────────────────────────────────────────────────────────────────
-- 19. static_pages
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE static_pages (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  body       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "static_pages_select_public" ON static_pages FOR SELECT USING (true);
CREATE POLICY "static_pages_all_admin"     ON static_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO static_pages (slug, title) VALUES
  ('about',         'О проекте'),
  ('privacy',       'Политика конфиденциальности'),
  ('personal-data', 'Обработка персональных данных');

COMMENT ON TABLE profiles           IS 'Профили пользователей с баллами и титулами';
COMMENT ON TABLE objects            IS 'Объекты поселения: кузница, избы и т.д.';
COMMENT ON TABLE slots              IS 'Слоты финансирования объектов';
COMMENT ON TABLE donations          IS 'Пожертвования (деньги)';
COMMENT ON TABLE volunteer_camps    IS 'Волонтёрские заезды с датами и лимитом';
COMMENT ON TABLE chronicle_events   IS 'Летопись — публичная история вкладов';
COMMENT ON TABLE settings           IS 'Настройки системы (ключ/значение)';
