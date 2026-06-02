-- ============================================================
-- Система квестов: таблицы quests + user_quests, NPC-настройки
-- ============================================================

-- Таблица квестов
CREATE TABLE quests (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  reward_text   TEXT,
  action_type   TEXT        NOT NULL
    CHECK (action_type IN ('donate','subscribe','volunteer','material','partner')),
  action_url    TEXT,
  reward_points INTEGER     NOT NULL DEFAULT 0,
  object_id     UUID        REFERENCES objects(id) ON DELETE SET NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX quests_active_sort ON quests (is_active, sort_order);
CREATE INDEX quests_object_id   ON quests (object_id);

-- Таблица прогресса квестов пользователей
CREATE TABLE user_quests (
  user_id      UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  quest_id     UUID        NOT NULL REFERENCES quests(id)    ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'offered'
    CHECK (status IN ('offered','accepted','completed')),
  offered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, quest_id)
);

CREATE INDEX user_quests_user_id  ON user_quests (user_id);
CREATE INDEX user_quests_quest_id ON user_quests (quest_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE quests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

-- quests: публичный SELECT только активных
CREATE POLICY quests_select_public ON quests
  FOR SELECT USING (is_active = true);

-- quests: admin/moderator — полный доступ
CREATE POLICY quests_all_admin ON quests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','moderator')
    )
  );

-- user_quests: пользователь видит только свои записи
CREATE POLICY user_quests_select_own ON user_quests
  FOR SELECT USING (auth.uid() = user_id);

-- user_quests: аутентифицированный пользователь может вставлять свои записи
CREATE POLICY user_quests_insert_own ON user_quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_quests: пользователь может обновлять только свои записи
CREATE POLICY user_quests_update_own ON user_quests
  FOR UPDATE USING (auth.uid() = user_id);

-- user_quests: admin видит всё
CREATE POLICY user_quests_all_admin ON user_quests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','moderator')
    )
  );

-- ============================================================
-- NPC-настройки в таблице settings
-- ============================================================

INSERT INTO settings (key, value, description) VALUES
  ('npc_name',        '"Ведун"',  'Имя NPC на карте'),
  ('npc_position_x',  '50',       'Позиция NPC по X (0–100%)'),
  ('npc_position_y',  '50',       'Позиция NPC по Y (0–100%)'),
  ('npc_portrait_url','""',       'URL портрета NPC')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Начальные квесты (seed)
-- ============================================================

INSERT INTO quests (title, description, reward_text, action_type, action_url, reward_points, sort_order)
VALUES
  (
    'Помоги поселению рублём',
    'Городищу нужны твои средства, путник. Каждая копейка приближает нас к завершению строительства. Сделай пожертвование — и твоё имя войдёт в Летопись.',
    'Ты получишь 500 баллов и запись в Летописи.',
    'donate',
    '/donate',
    500,
    1
  ),
  (
    'Стань частью общины',
    'Оформи подписку и стань постоянным участником жизни поселения. Вместе мы построим крепкое Городище.',
    'Ты получишь 300 баллов и статус подписчика.',
    'subscribe',
    '/subscribe',
    300,
    2
  ),
  (
    'Приедь на заезд',
    'Руки важнее золота, путник. Запишись добровольцем на ближайший заезд — потрудись вместе с нами на земле.',
    'Ты получишь 1000 баллов за каждый день труда.',
    'volunteer',
    '/camps',
    1000,
    3
  );
