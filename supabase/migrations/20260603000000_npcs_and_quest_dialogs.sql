-- ============================================================
-- NPC-персонажи как полноценные сущности + диалоги квестов
-- ============================================================

-- 1. Таблица персонажей NPC
CREATE TABLE npcs (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT         NOT NULL DEFAULT 'Ведун',
  portrait_url TEXT,
  position_x   NUMERIC(5,2) NOT NULL DEFAULT 50,
  position_y   NUMERIC(5,2) NOT NULL DEFAULT 50,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  sort_order   INTEGER      NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX npcs_active_sort ON npcs (is_active, sort_order);

-- 2. RLS
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY npcs_select_public ON npcs
  FOR SELECT USING (is_active = true);

CREATE POLICY npcs_all_admin ON npcs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','moderator')
    )
  );

-- 3. Перенести существующий NPC из settings в таблицу npcs
--    (Если ключей нет, INSERT всё равно создаст дефолтного Ведуна)
INSERT INTO npcs (name, portrait_url, position_x, position_y, is_active, sort_order)
SELECT
  COALESCE(
    (SELECT value #>> '{}' FROM settings WHERE key = 'npc_name'),
    'Ведун'
  ),
  NULLIF(
    COALESCE((SELECT value #>> '{}' FROM settings WHERE key = 'npc_portrait_url'), ''),
    ''
  ),
  COALESCE(
    (SELECT (value #>> '{}')::numeric FROM settings WHERE key = 'npc_position_x'),
    50
  ),
  COALESCE(
    (SELECT (value #>> '{}')::numeric FROM settings WHERE key = 'npc_position_y'),
    50
  ),
  true,
  1;

-- 4. Удалить NPC-ключи из settings
DELETE FROM settings WHERE key IN ('npc_name','npc_position_x','npc_position_y','npc_portrait_url');

-- ============================================================
-- 5. Расширить quests: npc_id + dialogs
-- ============================================================

ALTER TABLE quests
  ADD COLUMN npc_id  UUID REFERENCES npcs(id) ON DELETE SET NULL,
  ADD COLUMN dialogs JSONB NOT NULL DEFAULT '[]';

CREATE INDEX quests_npc_id ON quests (npc_id);

-- 6. Привязать существующие квесты к первому NPC (Ведуну)
UPDATE quests
SET npc_id = (SELECT id FROM npcs ORDER BY sort_order LIMIT 1)
WHERE npc_id IS NULL;

-- 7. Перенести description в первый dialog-шаг для существующих квестов
UPDATE quests
SET dialogs = jsonb_build_array(
  jsonb_build_object('type', 'text', 'text', description)
)
WHERE dialogs = '[]'::jsonb
  AND description IS NOT NULL
  AND description != '';
