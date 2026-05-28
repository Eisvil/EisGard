---
name: implement-feature
description: "Реализует фичу по спецификации. Используй когда получаешь SPEC фичи."
---

Реализуй фичу пошагово:
1. Анализ спецификации — определи затронутые модули
2. Context7 MCP — документация библиотек ДО написания кода (use context7)
3. database-architect → миграции, RLS, CHECK constraints
4. backend-engineer → Server Actions, авторизация ролей
5. frontend-developer → UI компоненты, CSS-переменные, Loading/Empty/Error
6. payments-specialist → если есть донаты или начисление баллов
7. qa-reviewer → проверка после реализации
8. Отчёт: что создано, какие файлы изменены

Обязательно перед стартом:
- Баллы только через lib/points/awardPoints()
- Суммы в копейках (INTEGER)
- Статусы объектов: planned|building|done|working
- Публичные страницы: кастомный CSS, не Tailwind
