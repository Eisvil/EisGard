---
description: Правила работы с базой данных Supabase
globs: ["supabase/**", "src/lib/supabase/**"]
---
- Изменения схемы только через supabase/migrations/YYYYMMDDHHMMSS_описание.sql
- RLS обязательна для каждой таблицы без исключений
- Денежные поля: INTEGER (копейки), никогда DECIMAL или FLOAT
- objects.status CHECK: ('planned','building','done','working')
- objects.zone CHECK: ('Ремесленная','Общественная','Хозяйственная','Жилая','Воинская')
- Индексы на все FK и поля фильтрации
- После каждой миграции: npx supabase gen types typescript
