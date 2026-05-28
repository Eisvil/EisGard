---
name: create-migration
description: "Создаёт SQL-миграцию для Supabase."
---

Создай supabase/migrations/YYYYMMDDHHMMSS_$ARGUMENTS.sql:

```sql
-- Описание миграции
CREATE TABLE [name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON [name]
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE INDEX idx_[name]_[field] ON [name]([field]);
ALTER TABLE [name] ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;
COMMENT ON TABLE [name] IS '...';
```

Если доступен Supabase MCP — выполни через него.
После: npx supabase gen types typescript > src/types/database.ts
