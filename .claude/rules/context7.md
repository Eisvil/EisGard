---
description: Правила использования Context7 для актуальной документации
globs: ["**/*.ts", "**/*.tsx"]
---
- При работе с любой внешней библиотекой — запрашивай через Context7 MCP
- Обязательно для: Next.js App Router, Supabase, Tiptap, Zod, react-hook-form
- Добавляй "use context7" в конец промпта
- Для конкретной библиотеки: "use library /supabase/supabase"
