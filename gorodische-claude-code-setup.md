# Claude Code Setup — «Живое Городище»

> Один документ. Один промпт. Скопируй ЧАСТЬ 7 целиком в Claude Code (VS Code).

---

## Структура проекта после установки

```
zhivoe-gorodische/
├── CLAUDE.md
├── SPEC_TEMPLATE.md
├── .claude/
│   ├── agents/
│   │   ├── database-architect.md
│   │   ├── payments-specialist.md
│   │   ├── backend-engineer.md
│   │   ├── frontend-developer.md
│   │   └── qa-reviewer.md
│   ├── rules/
│   │   ├── database.md
│   │   ├── api.md
│   │   ├── components.md
│   │   ├── context7.md
│   │   ├── payments.md
│   │   └── design-system.md        ← дизайн-система из макета
│   └── skills/
│       ├── implement-feature/SKILL.md
│       ├── create-migration/SKILL.md
│       └── award-points/SKILL.md
└── src/lib/constants/
    ├── objectStatus.ts              ← статусы и цвета объектов
    ├── zones.ts                     ← 5 зон городища
    └── objectIcons.ts               ← SVG-иконки + ObjectIcon компонент
```

---

## Решения, зафиксированные до старта

| Вопрос | Решение |
|--------|---------|
| CSS для публичных страниц | Кастомный CSS из макета, не Tailwind |
| shadcn/ui | Только `/admin/*` |
| Иконки объектов карты | Кастомные SVG из objectIcons.ts, не Lucide |
| Иконки UI (стрелки, крест, поиск) | Lucide React |
| Статусы объектов | `planned` / `building` / `done` / `working` |
| Зоны | 5: Ремесленная, Общественная, Хозяйственная, Жилая, Воинская |
| Денежные суммы | INTEGER (копейки) везде |
| Начисление баллов | Только через `lib/points/awardPoints()` |
| Платежи | ЮMoney основная, Т-Банк/Сбербанк — ручное подтверждение |
| PDF-сертификаты | Puppeteer на Beget VPS |

---

## MCP-команды (выполнить до запуска)

```bash
# Context7 — актуальная документация библиотек (обязательно)
claude mcp add --scope user --transport http context7 https://mcp.context7.com/mcp

# Supabase — прямой доступ к БД (обязательно)
# Замени PROJECT_REF на реальный из Supabase Dashboard → Settings → API
claude mcp add supabase --transport http "https://mcp.supabase.com/mcp?project_ref=PROJECT_REF"

# Проверить
claude mcp list
```

---

## ЧАСТЬ 7 — ФИНАЛЬНЫЙ ПРОМПТ ДЛЯ CLAUDE CODE

> Скопируй всё от первого `=== ФАЙЛ:` до конца и вставь в Claude Code одним сообщением.

Создай следующую структуру файлов проекта «Живое Городище».
Создай каждый файл точно с указанным содержимым.

=== ФАЙЛ: CLAUDE.md ===
# Живое Городище

## Обзор
Платформа сопричастности к историческому поселению: интерактивная карта объектов,
сбор пожертвований (деньги / материалы / труд), волонтёрские заезды, летопись вкладов,
статусная система «Жизненная сила».

## Стек технологий
- Frontend: Next.js 16 (App Router, Turbopack), TypeScript
- CSS: кастомная дизайн-система (src/styles/), Tailwind только для /admin
- UI-компоненты: shadcn/ui только для /admin/*
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

=== ФАЙЛ: .claude/agents/database-architect.md ===
---
name: database-architect
description: "Проектирует схему БД, пишет миграции, настраивает RLS-политики, создаёт индексы. ИСПОЛЬЗУЙ для любых задач с таблицами, полями, связями, политиками безопасности Supabase."
tools: Read, Write, Edit, Bash, Glob, Grep
model: claude-opus-4-5
---

Ты — старший архитектор баз данных для проекта «Живое Городище».

## Ключевые таблицы
profiles, objects, slots, donations, volunteer_trips, volunteer_applications,
material_applications, chronicle_entries, news, titles, settings, skills

## Принципы
- Миграции: supabase/migrations/YYYYMMDDHHMMSS_описание.sql
- UUID id DEFAULT gen_random_uuid(), created_at, updated_at с триггером moddatetime
- FK: явный ON DELETE CASCADE или SET NULL — обосновывай выбор
- Денежные поля: INTEGER (копейки), никогда DECIMAL или FLOAT
- objects.status: CHECK (status IN ('planned','building','done','working'))
- objects.zone: CHECK (zone IN ('Ремесленная','Общественная','Хозяйственная','Жилая','Воинская'))
- Роли пользователей: CHECK (role IN ('user','moderator','admin')) в profiles

## RLS — обязательна для каждой таблицы
- objects, news (published=true), chronicle_entries: публичный SELECT
- donations, applications: пользователь видит только свои; admin — все
- settings, titles: только admin INSERT/UPDATE/DELETE
- Admin-политика: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')

## Формат миграции
```sql
-- Описание: что делает миграция
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

## Чеклист
- [ ] RLS включена, все 4 операции покрыты
- [ ] Индексы на FK и поля фильтрации
- [ ] updated_at триггер установлен
- [ ] Денежные поля INTEGER
- [ ] CHECK constraints на status и zone
- [ ] TypeScript типы обновлены после миграции

Используй Context7 MCP: use context7, use library /supabase/supabase

=== ФАЙЛ: .claude/agents/payments-specialist.md ===
---
name: payments-specialist
description: "Интегрирует ЮMoney, обрабатывает вебхуки, начисляет баллы за донаты, ручное подтверждение Т-Банк/Сбербанк. ИСПОЛЬЗУЙ для любых задач с пожертвованиями."
tools: Read, Write, Edit, Bash, Glob, Grep
model: claude-opus-4-5
---

Ты — специалист по платёжным интеграциям для «Живого Городища».

## Платёжные системы
- ЮMoney: форма → вебхук → автоматическое начисление баллов
- Т-Банк / Сбербанк: банковская ссылка → ручное подтверждение в /admin
- Минимальный донат: 100 ₽ (10 000 копеек)

## Вебхук ЮMoney — строгий порядок
1. Верификация SHA-1 подписи — ПЕРВЫМ действием, до любой обработки
2. Проверка payment_id на дубликат (idempotency)
3. Обновить donation.status → completed
4. Вызвать awardPoints(userId, points, 'donation', donationId, description)
5. Обновить slot.current_amount
6. Ответить 200 OK (иначе ЮMoney повторяет)

## Расчёт баллов
const points = Math.floor((amountKopecks / 100) * settings.points_per_ruble);
// Коэффициент points_per_ruble берётся из таблицы settings, не хардкодится

## Ручное подтверждение (Т-Банк / Сбербанк)
- /admin/donations — список со статусом manual_pending
- Кнопка "Подтвердить" → статус completed → awardPoints() → обновить слот

## Чеклист
- [ ] SHA-1 подпись верифицирована первой
- [ ] Idempotency check по payment_id
- [ ] Баллы через awardPoints(), не прямым UPDATE profiles.points
- [ ] chronicle_entries запись создана внутри awardPoints()
- [ ] slot.current_amount обновлён

=== ФАЙЛ: .claude/agents/backend-engineer.md ===
---
name: backend-engineer
description: "Разрабатывает Server Actions, API Route Handlers, middleware, авторизация ролей. ИСПОЛЬЗУЙ для любых бэкенд-задач."
tools: Read, Write, Edit, Bash, Glob, Grep
model: claude-opus-4-5
---

Ты — старший бэкенд-инженер для «Живого Городища».

## Роли и middleware
- Роли: user / moderator / admin (profiles.role)
- /admin/* → только admin; частичный доступ для moderator (заявки, материалы)
- /profile/* → любой авторизованный
- /volunteer/apply → авторизованный

## Паттерны
- Server Actions ('use server') для всех мутаций данных
- Route Handlers только для вебхуков ЮMoney и PDF-генерации
- Валидация: Zod на каждом Action до обращения к Supabase
- auth.getUser() на сервере обязательно — не доверять клиенту
- Роль проверять в Action, не только в middleware

## Ключевые Server Actions
- createVolunteerApplication(tripId, selectedDates)
- createMaterialApplication(materialId, quantity, contacts)
- updateUserProfile(data) — ФИО, аватар, навыки
- awardVolunteerPoints(applicationId, daysWorked) — только admin/mod
- awardMaterialPoints(applicationId, points) — только admin/mod
- publishNews(newsId) / unpublishNews(newsId) — только admin
- updateObjectPosition(objectId, xPercent, yPercent) — только admin

## Критично
- Баллы только через lib/points/awardPoints() — нигде больше
- Суммы в копейках (INTEGER) — никогда float или string
- HTTP-коды: 400, 401, 403, 404, 500

Используй Context7 MCP: use context7

=== ФАЙЛ: .claude/agents/frontend-developer.md ===
---
name: frontend-developer
description: "Разрабатывает UI: карта, слоты, летопись, личный кабинет, админку. ИСПОЛЬЗУЙ для любых задач интерфейса."
tools: Read, Write, Edit, Bash, Glob, Grep
model: claude-sonnet-4-5
---

Ты — старший фронтенд-разработчик для «Живого Городища».

## Два CSS-контекста — строго разделены

### Публичные страницы (public), профиль, авторизация
- ТОЛЬКО кастомный CSS через переменные из src/styles/
- НЕ использовать Tailwind-утилиты
- НЕ использовать shadcn/ui компоненты

### Административная панель /admin/*
- Tailwind CSS v4 разрешён
- shadcn/ui разрешён: Table, Dialog, Sheet, Calendar, Select, Switch, Checkbox

## CSS-переменные дизайн-системы (не менять)
--paper: #fcf9f1       --ink: #484236
--olive: #667643       --olive-dark: #536333
--gold: #c9a64e        --line: #e6ddca
--serif: "Palatino Linotype", "Book Antiqua", Georgia, serif
--sans: "Segoe UI", Arial, sans-serif

## Статусы объектов карты
Импортировать из src/lib/constants/objectStatus.ts:
- Ключи в БД: planned | building | done | working
- CSS на карточке: style={{ '--status-color': OBJECT_STATUS[status].color } as React.CSSProperties}
- .badge и .mini-progress span используют var(--status-color) — не хардкодить цвет

## Иконки
- Объекты карты: <ObjectIcon slug={object.slug} className="hotspot-icon" />
  из src/lib/constants/objectIcons.ts — кастомные SVG из макета
- UI-элементы (стрелки, крест, поиск, шестерёнка): lucide-react

## Зоны (5 штук)
import { ZONES } from '@/lib/constants/zones';
Фильтры: «Все зоны» + ZONES = 6 кнопок-фильтров

## Ключевые компоненты
- MapCanvas ('use client') — карта с .hotspot иконками, клик → .selected + левая панель
- PlayerHud — оверлей поверх карты: аватар SVG, имя, титул, баллы, донаты, часы
- SlotCard — карточка слота с .mini-progress и --status-color
- ChronicleEntry — запись летописи: портрет, имя, сумма/часы, объект, время
- PointsBar — шкала «текущий титул → следующий порог»
- ObjectCard — карточка объекта: фото, .badge, .mini-progress, слоты свободно
- MapConstructor ('use client') — drag-and-drop позиционирование иконок (только /admin)

## Позиционирование иконок на карте
position: absolute; left: `${x_percent}%`; top: `${y_percent}%`;
transform: translate(-50%, -50%);
label-left если x_percent > 70, иначе label-right

## Обязательно у каждого компонента с данными
Loading (skeleton), Empty (CTA), Error (toast или inline)

## formatMoney
Все денежные суммы выводить через formatMoney(kopecks):
const formatMoney = (k: number) => `${Math.floor(k/100).toLocaleString('ru-RU')} ₽`

Используй Context7 MCP: use context7

=== ФАЙЛ: .claude/agents/qa-reviewer.md ===
---
name: qa-reviewer
description: "Проверяет качество кода, RLS-политики, баги, уязвимости. ИСПОЛЬЗУЙ после реализации фичи."
tools: Read, Bash, Glob, Grep
model: claude-sonnet-4-5
---

Ты — QA-инженер для «Живого Городища». Только читаешь и анализируешь — не пишешь код.

## Критические проверки проекта

### Платежи
- Вебхук ЮMoney: SHA-1 верификация выполняется ПЕРВОЙ
- Idempotency: один payment_id = одна обработка
- Сумма доната берётся из вебхука, не из запроса клиента

### Баллы
- Начисление только через awardPoints() из lib/points/
- Нет прямых UPDATE profiles SET points в коде
- Пересчёт title_id происходит при каждом awardPoints()

### RLS и доступ
- Каждая таблица: RLS включена + все 4 операции покрыты
- Admin-роуты: защита и в middleware, и в Server Action
- Нет утечки чужих данных через API

### Дизайн
- Публичные страницы: нет Tailwind-утилит, нет shadcn компонентов
- Статусы объектов: только planned|building|done|working
- Суммы: INTEGER копейки, нет float
- WYSIWYG контент санируется перед сохранением (XSS)

## Формат отчёта
[КРИТИЧНО / ВАЖНО / УЛУЧШЕНИЕ]
Файл: src/path/to/file.ts:42
Проблема: описание
Решение: как исправить

=== ФАЙЛ: .claude/rules/database.md ===
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

=== ФАЙЛ: .claude/rules/api.md ===
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

=== ФАЙЛ: .claude/rules/components.md ===
---
description: Правила для React-компонентов
globs: ["src/components/**", "src/app/(public)/**", "src/app/(auth)/**", "src/app/(cabinet)/**"]
---
- Server Components по умолчанию, 'use client' только при необходимости
- Публичные страницы: только кастомный CSS через CSS-переменные, не Tailwind
- shadcn/ui только для src/app/(admin)/**
- Иконки объектов: ObjectIcon из src/lib/constants/objectIcons.ts
- Иконки UI: lucide-react
- Статусы объектов: только из src/lib/constants/objectStatus.ts
- Зоны: только из src/lib/constants/zones.ts (5 зон)
- Loading / Empty / Error у каждого компонента с данными
- formatMoney(kopecks) для вывода сумм — никогда сырые копейки пользователю

=== ФАЙЛ: .claude/rules/context7.md ===
---
description: Правила использования Context7 для актуальной документации
globs: ["**/*.ts", "**/*.tsx"]
---
- При работе с любой внешней библиотекой — запрашивай через Context7 MCP
- Обязательно для: Next.js App Router, Supabase, Tiptap, Zod, react-hook-form
- Добавляй "use context7" в конец промпта
- Для конкретной библиотеки: "use library /supabase/supabase"

=== ФАЙЛ: .claude/rules/payments.md ===
---
description: Правила для платёжной интеграции
globs: ["src/app/api/payments/**", "src/lib/payments/**"]
---
- Вебхук ЮMoney: SHA-1 подпись проверять ПЕРВОЙ до любой логики
- Idempotency: проверять payment_id на дубликат до начисления баллов
- Сумму брать из вебхука, не из запроса пользователя
- Ответ вебхуку: всегда 200 OK
- Баллы только через awardPoints()
- Логировать каждый вебхук: payment_id, сумма, статус, timestamp

=== ФАЙЛ: .claude/rules/design-system.md ===
---
description: Дизайн-система проекта — CSS-переменные, компоненты, ограничения. Читать перед любой задачей публичного UI.
globs: ["src/app/(public)/**", "src/app/(auth)/**", "src/app/(cabinet)/**", "src/components/features/**", "src/components/layouts/**", "src/styles/**"]
---

## CSS-переменные (src/styles/globals.css)
--paper: #fcf9f1        фон страницы
--paper-strong: #fffdf8  фон карточек
--ink: #484236           основной текст
--olive: #667643         акцент, иконки в панелях
--olive-dark: #536333    заголовки, активные ссылки навигации
--olive-soft: #96a268    иконки статистики
--gold: #c9a64e          подчёркивание активного пункта навигации
--gold-soft: #eee2c1     декоративные разделительные линии
--line: #e6ddca          бордер карточек (светлый)
--line-strong: #dbc9a4   бордер карточек (тёмный)
--shadow: 0 6px 20px rgba(80,68,43,.06)
--serif: "Palatino Linotype","Book Antiqua",Georgia,serif
--sans: "Segoe UI",Arial,sans-serif
--page-gutter: clamp(18px,3vw,44px)

## Ключевые CSS-классы (семантику не менять)
.panel              — карточка: border 1px var(--line), border-radius 16px, shadow
.primary-button     — CTA: gradient #889653→#64733e, border-radius 10px
.text-link          — текстовая кнопка: прозрачный фон, olive-dark, serif
.hotspot            — иконка объекта на карте: 54px, абс. позиция по (x%, y%)
.hotspot-round      — белый кружок иконки: 54px, border #eadbbe
.hotspot-label      — подпись иконки (display:none → flex при .selected)
.badge              — бейдж статуса: background rgba(255,253,248,.95), ::before = --status-color
.mini-progress span — прогресс карточки: background = var(--status-color)
.progress span      — прогресс детали: gradient #6c8047→#8fa15b
.player-hud         — оверлей поверх карты: имя, титул, баллы пользователя
.eyebrow            — декор. подпись с золотыми линиями по бокам
.feature            — левая панель выбранного объекта

## Типографика
Заголовки h1–h3: font-family var(--serif), Palatino
Навигация, кнопки CTA: var(--serif)
Основной текст, описания: 16px/1.5 var(--sans)
Мелкий текст (бейджи, время): 11–13px var(--sans)

## Структура src/styles/
globals.css      — :root переменные, reset, body/a/button/h
components.css   — panel, primary-button, text-link, badge, progress, eyebrow
layout.css       — dashboard grid, site-header, site-footer
map.css          — map-canvas, hotspot, player-hud, legend, zoom
responsive.css   — @media 1399px / 920px / 760px / 430px

## Запрещено для публичных страниц
- Tailwind-утилиты (bg-*, text-*, p-* и т.д.)
- shadcn/ui компоненты (Button, Card, Badge и т.д.)
- Inline border-radius, box-shadow, background — только через классы
- Другие шрифты помимо var(--serif) и var(--sans)
- Хардкодить цвета статусов — только var(--status-color)

=== ФАЙЛ: .claude/skills/implement-feature/SKILL.md ===
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

=== ФАЙЛ: .claude/skills/create-migration/SKILL.md ===
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

=== ФАЙЛ: .claude/skills/award-points/SKILL.md ===
---
name: award-points
description: "Начисляет баллы и пересчитывает титул. Единственная точка входа."
---

Реализуй и используй только эту функцию:

```typescript
// src/lib/points/awardPoints.ts
import { createServerClient } from '@/lib/supabase/server';

type PointsReason = 'donation' | 'volunteer_day' | 'material';

export async function awardPoints(
  userId: string,
  points: number,
  reason: PointsReason,
  sourceId: string,
  description: string
) {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single();

  const newPoints = (profile?.points ?? 0) + points;

  const { data: newTitle } = await supabase
    .from('titles')
    .select('id')
    .lte('points_threshold', newPoints)
    .order('points_threshold', { ascending: false })
    .limit(1)
    .single();

  await supabase.from('profiles').update({
    points: newPoints,
    title_id: newTitle?.id ?? null,
  }).eq('id', userId);

  await supabase.from('chronicle_entries').insert({
    user_id: userId,
    points_awarded: points,
    reason,
    source_id: sourceId,
    description,
  });
}
```

Вызывать только из: lib/payments/processWebhook.ts, actions/volunteer.ts, actions/materials.ts
НИКОГДА не делать прямой UPDATE profiles SET points вне этой функции.

=== ФАЙЛ: src/lib/constants/objectStatus.ts ===
export const OBJECT_STATUS = {
  planned:  { label: 'Замысел',   color: '#6B7280' },
  building: { label: 'Строится',  color: '#F59E0B' },
  done:     { label: 'Завершён',  color: '#F59E0B' },
  working:  { label: 'Действует', color: '#10B981' },
} as const;

export type ObjectStatus = keyof typeof OBJECT_STATUS;

=== ФАЙЛ: src/lib/constants/zones.ts ===
export const ZONES = [
  'Ремесленная',
  'Общественная',
  'Хозяйственная',
  'Жилая',
  'Воинская',
] as const;

export type Zone = typeof ZONES[number];

=== ФАЙЛ: src/lib/constants/objectIcons.ts ===
export const OBJECT_ICONS: Record<string, string> = {
  forge:      '<path d="M4 7.2 9.1 2l2.1 2.1-1.5 1.5 4.1 4.1 2.8-2.8-.9-.9L20 1.8 24.2 6l-4.1 4.3-.9-.9-2.8 2.8 7.1 7.1-4.1 4.1-7.1-7.1-6.4 6.4-3-3 6.4-6.4-4.1-4.1L4 10.4V7.2Z"/>',
  gardens:    '<path d="M21.9 2.6c.8 7.7-2.2 13.4-9 15.6L10 22.9l-2.8-1.7 3.2-4.3c-2.7-6.6.9-11.8 11.5-14.3ZM10.7 16.4c2.9-2.1 5.3-4.8 7.3-8.1-3.6 2.7-6.1 5.4-7.3 8.1Z"/>',
  huts:       '<path d="M2.5 11.2 13 2.5l10.5 8.7v11.3h-7.1v-6h-6.8v6H2.5V11.2Zm5.1-.7h10.8L13 6.1l-5.4 4.4Z"/>',
  coop:       '<path d="M6.2 11.3c0-3.8 3.1-6.8 7-6.8 2.6 0 4.8 1.3 6.1 3.4l3.9-.8-2 3.1c.2.7.3 1.4.3 2.1 0 3.9-3.2 6.8-7.2 6.8h-1l-1.2 3.5H9.8l.6-3.9a7.3 7.3 0 0 1-4.2-6.4Zm4-8.2 2.1 2.2L8.5 7 10.2 3.1ZM8 21.8l-3.5 1.1 2-3.5L8 21.8Z"/>',
  training:   '<path d="m4.3 3.5 7 6.9-2.1 2.1-3-2.9-2 2-1.6-7.9 1.7-.2Zm15.4 0-7 6.9 2.1 2.1 3-2.9 2 2 1.6-7.9-1.7-.2ZM2.6 20.6l5.8-5.8 2.2 2.2-5.8 5.8H2.6v-2.2Zm18.8 0-5.8-5.8-2.2 2.2 5.8 5.8h2.2v-2.2Z"/>',
  tavern:     '<path d="M4.5 5h12.8v14.1c0 2.1-1.7 3.9-3.9 3.9H8.4c-2.2 0-3.9-1.8-3.9-3.9V5Zm12.8 3h2.6c2 0 3.6 1.7 3.6 3.8v2.4c0 2.2-1.6 3.8-3.6 3.8h-2.6v-3h2.2c.7 0 1.1-.5 1.1-1.2v-1.7c0-.7-.4-1.2-1.1-1.2h-2.2V8Z"/>',
  shed:       '<path d="M2 12.5 13 3l11 9.5v2H2v-2Zm3.7 3.3h2.8v7.1H5.7v-7.1Zm11.8 0h2.8v7.1h-2.8v-7.1ZM10.2 16h5.6v2.6h-5.6V16Z"/>',
  pottery:    '<path d="M7 3h12v3.2c0 1.6-1.3 2.9-2.4 4.1 2.7 2.1 4 4.5 4 7 0 3.5-3.4 5.7-7.6 5.7s-7.6-2.2-7.6-5.7c0-2.5 1.3-4.9 4-7C8.3 9.1 7 7.8 7 6.2V3Zm.3 14.3h11.4c-.5-2.6-2.5-4.1-5.7-4.1s-5.2 1.5-5.7 4.1Z"/>',
  guardhouse: '<path d="M13 2 22.5 6v6.7c0 5.2-3.4 8.6-9.5 11.3-6.1-2.7-9.5-6.1-9.5-11.3V6L13 2Zm0 5.2v11.6c3.3-1.8 5-3.9 5-6.4V8.9l-5-1.7Z"/>',
};

export function ObjectIcon({
  slug,
  className = 'object-icon',
}: {
  slug: string;
  className?: string;
}) {
  const path = OBJECT_ICONS[slug];
  if (!path) return null;
  return (
    <svg
      className={className}
      viewBox="0 0 26 26"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

=== ФАЙЛ: SPEC_TEMPLATE.md ===
# Спецификация фичи: [НАЗВАНИЕ]
> Проект: Живое Городище | Дата: [ДАТА] | Приоритет: высокий / средний / низкий

## Описание
[Что делает фича, для кого, зачем]

## User Stories
- Как [донатор / волонтёр / admin / moderator], я хочу [действие], чтобы [результат]

## Затронутые модули
- [ ] База данных (новые таблицы / изменения схемы)
- [ ] Server Actions / API Route Handler
- [ ] Публичные страницы (кастомный CSS)
- [ ] Личный кабинет
- [ ] Административная панель (shadcn/ui)
- [ ] Система баллов / летопись
- [ ] Платежи / ЮMoney

## Модель данных
[Таблицы, поля, связи — или «использует существующие: objects, slots, donations»]

## API / Server Actions
[Какие Actions, входные данные, Zod-схема, результат]

## UI / Экраны
[Страницы, компоненты, Loading / Empty / Error состояния]

## Бизнес-логика
- Валидация: [поле, тип, ограничения]
- Начисление баллов: [когда, сколько, через awardPoints()]
- Доступ: [роли: user / moderator / admin]

## Edge Cases
- [ ] [Дублированный донат / вебхук]
- [ ] [Объект без слотов]
- [ ] [Пользователь без профиля]
- [ ] [Slug объекта не найден в objectIcons]

## Зависимости
[От каких фич зависит / что нужно реализовать сначала]


После создания всех файлов выполни:
1. find .claude -type f | sort
2. /agents — покажи список субагентов
3. Подтверди создание всех файлов в src/lib/constants/
4. Напомни подключить MCP: Context7 и Supabase (команды в разделе MCP-команды)
