-- ============================================================
-- Расширение механики квестов: recurring, NPC-visibility,
-- prerequisite, seasonal dates, reactivation counter
-- ============================================================

-- 1. Новые поля в quests
ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS is_recurring         BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_npc_on_complete BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prerequisite_quest_id UUID     REFERENCES quests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS available_from       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS available_until      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS quests_prerequisite ON quests (prerequisite_quest_id) WHERE prerequisite_quest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS quests_available    ON quests (available_from, available_until) WHERE is_active = true;

-- 2. Счётчик реактиваций в user_quests
ALTER TABLE user_quests
  ADD COLUMN IF NOT EXISTS reactivated_count INTEGER NOT NULL DEFAULT 0;
