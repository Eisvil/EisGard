---
description: Правила для Server Actions и API Route Handlers
globs: ["src/app/api/**", "src/actions/**", "src/app/**/actions.ts"]
---
- Server Actions для мутаций, Route Handlers только для вебхуков и PDF
- Zod-валидация на каждом Action до обращения к Supabase
- auth.getUser() проверять на сервере — не доверять клиенту
- Роль проверять в Action, не только в middleware
- Баллы начислять только через lib/points/awardPoints()
- Суммы принимать и возвращать в копейках (INTEGER)
- HTTP-коды: 400, 401, 403, 404, 500
