# Живое Городище

## Ключевые файлы проекта
- **SPEC.md** — полная техническая спецификация (источник истины по требованиям)
- **PROGRESS.md** — что сделано, что в работе, что следующее
- **DECISIONS.md** — принятые решения, отступающие от спеки

**Перед каждой задачей читай SPEC.md и PROGRESS.md. После — обновляй PROGRESS.md.**

## Обзор
Платформа сопричастности к историческому поселению: интерактивная карта объектов,
сбор пожертвований (деньги / материалы / труд), волонтёрские заезды, летопись вкладов,
статусная система «Жизненная сила».

## Стек технологий
- Frontend: Next.js 16 (App Router, Turbopack), TypeScript
- Шрифты: Lora (Google Fonts, `next/font/google`, Latin+Cyrillic) → CSS var `--font-lora`
- CSS: кастомная дизайн-система (src/styles/), Tailwind только для /admin
- UI-компоненты: shadcn/ui только для /admin/*; lucide-react для иконок на публичных страницах
- Backend: Supabase (PostgreSQL 15, Auth, RLS, Storage, Realtime)
- Деплой: Vercel (фронт), Beget VPS (PDF, фоновые задачи)
- Платежи: ЮMoney (вебхуки), ручное подтверждение Т-Банк / Сбербанк
- PDF: Puppeteer на VPS (сертификаты участников)
- Редактор: Tiptap (WYSIWYG для новостей)

## Архитектура
```
src/
  app/
    (public)/            — публичные страницы (кастомный CSS)
    (auth)/              — вход, регистрация, восстановление
    (cabinet)/profile/   — личный кабинет
    (admin)/admin/       — административная панель (shadcn/ui)
    api/                 — вебхуки ЮMoney, PDF-генерация
  components/
    features/            — MapCanvas, SlotCard, ChronicleEntry, PointsBar, PlayerHud
    layouts/             — Header, Footer, AdminSidebar
  lib/
    constants/           — objectStatus.ts, zones.ts, objectIcons.ts
    supabase/            — server/browser clients
    payments/            — ЮMoney webhook верификация
    points/              — awardPoints(), пересчёт титулов
  styles/
    globals.css          — CSS-переменные :root
    components.css       — panel, primary-button, badge, progress
    layout.css           — dashboard grid, header, footer
    map.css              — map-canvas, hotspot, player-hud, legend
    responsive.css       — breakpoints 1399 / 920 / 760 / 430px
  types/
    database.ts          — npx supabase gen types typescript
```

## Правила кодирования
- TypeScript strict mode, без any
- camelCase переменные, PascalCase компоненты, snake_case таблицы БД
- Один компонент = один файл, максимум 200 строк
- Импорты через @/ алиас
- Денежные значения: INTEGER копейки, выводить через formatMoney(kopecks)
- Статусы объектов: только planned | building | done | working
- Начисление баллов: только через lib/points/awardPoints()

## Работа с Supabase
- Изменения схемы — только через миграции supabase/migrations/
- RLS обязательна для каждой таблицы
- Типы: npx supabase gen types typescript --project-id $PROJECT_REF > src/types/database.ts

## Context7
При работе с любыми внешними библиотеками ВСЕГДА используй Context7 MCP.
Добавляй "use context7" к запросам, связанным с API библиотек.

## Команды
- npm run dev
- npm run build
- npm run lint
- npx supabase db push
- npx supabase gen types typescript --project-id $PROJECT_REF > src/types/database.ts

## Субагенты
- database-architect — схема БД, миграции, RLS (opus)
- payments-specialist — ЮMoney, начисление баллов за донаты (opus)
- backend-engineer — Server Actions, middleware, авторизация (opus)
- frontend-developer — UI, карта, формы, личный кабинет (sonnet)
- qa-reviewer — RLS, безопасность, edge cases (sonnet)
