-- ============================================================
-- 1. Добавить тип 'dialog' в quests.action_type
-- ============================================================

ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_action_type_check;
ALTER TABLE quests ADD CONSTRAINT quests_action_type_check
  CHECK (action_type IN ('donate','subscribe','volunteer','material','partner','dialog'));

-- ============================================================
-- 2. Добавить user_id в partner_applications (для auto-complete квестов)
-- ============================================================

ALTER TABLE partner_applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partner_apps_user_id ON partner_applications(user_id);
