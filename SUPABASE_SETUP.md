# Supabase Setup

Этот проект может работать на локальных seed-данных из `lib/seed.ts`, но реальный Supabase-проект уже подключен через env и schema/seed.

## 1. Создать Supabase-проект

В Supabase нужно создать новый project и сохранить:

- Project URL;
- anon public key;
- service role key.

Затем создать `.env.local` на основе `.env.example`.

## 2. Применить миграции

Файл схемы:

```txt
supabase/migrations/0001_initial_schema.sql
supabase/migrations/20260516185104_add_payment_settings.sql
supabase/migrations/20260517043700_add_auth_profile_trigger.sql
supabase/migrations/20260517045043_add_moderator_role_and_user_admin.sql
```

Его можно применить через Supabase SQL Editor или через Supabase CLI.

## 3. Применить seed

Файл seed:

```txt
supabase/seed.sql
```

Он добавляет:

- активную карту MVP;
- 4 здания;
- 4 маркера;
- 9 слотов поддержки;
- первые записи летописи.

## 4. Storage buckets

Миграция создает buckets:

- `maps`;
- `buildings`;
- `icons`;
- `reports`;
- `certificates`.

Для текущего прототипа изображения лежат локально в `public/assets`. При подключении Supabase Storage можно сохранить те же URL-структуры или заменить их на публичные Supabase URLs.

## 5. Data adapter

Supabase SDK уже подключен через `@supabase/supabase-js`.

Файл:

```txt
lib/data.ts
```

работает в двух режимах:

- если `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` не заполнены, используется локальный seed fallback;
- если env заполнен, публичные и админские mock-страницы пытаются читать данные из Supabase;
- если Supabase-запрос вернул ошибку, приложение мягко откатывается на seed fallback в dev-режиме.

Это позволяет продолжать разработку без Supabase-проекта и подключить базу позже без переписывания UI.

## 6. Server-side writes

Публичные формы пишут в Supabase через Next.js API routes:

- `POST /api/donations` создает `donations.status = pending`;
- `POST /api/volunteer-applications` создает `volunteer_applications.status = new`.

Эти routes используют server-side service role client, поэтому `SUPABASE_SERVICE_ROLE_KEY` должен быть задан только в `.env.local` или server env. На клиент ключ не передается.

Админские PATCH routes также используют service role client:

- подтверждение доната обновляет суммы здания и слота, создает летопись и не дублирует повторный `paid`;
- начисление волонтерских часов создает или обновляет `volunteer_hours` и синхронизирует летопись без дублей.

## 7. Admin Auth

Админка защищена Supabase Auth:

- `/admin/login` выполняет вход по email/password;
- `/auth/login` и `/auth/register` выполняют пользовательскую авторизацию и регистрацию;
- `proxy.ts` обновляет SSR auth cookies через `@supabase/ssr`;
- `AdminShell` проверяет пользователя на сервере перед рендером `/admin/*`;
- все `/api/admin/*` routes проверяют ту же роль до service-role действий;
- доступ к админке имеют только `admin` и `superadmin`;
- `moderator` не имеет доступа к админке и зарезервирован для будущей модерации комментариев.

Для первого входа можно временно указать email в `ADMIN_BOOTSTRAP_EMAILS`. При входе такой пользователь получает bootstrap-доступ `superadmin`, а профиль будет создан/обновлен через service role.

Новые Auth-пользователи автоматически получают строку в `profiles` через trigger `private.handle_new_user_profile`.

## 8. Smoke test checklist

После создания проекта нужно:

1. Заполнить `.env.local`.
2. Применить SQL-миграции.
3. Применить seed.
4. Проверить RLS публичного чтения.
5. Проверить `POST /api/donations` на создании `pending`.
6. Проверить `PATCH /api/admin/donations/[id]` на переходе `pending -> paid` и повторном `paid`.
7. Проверить `POST /api/volunteer-applications`.
8. Проверить `PATCH /api/admin/volunteer-applications/[id]` на начислении часов без дублей.

## 9. Текущий linked project

Текущий Supabase project был связан через CLI, но первая схема применялась прямым SQL-запросом, поэтому remote migration history может не содержать `0001`. Из-за этого `supabase db push` может пытаться повторно применить начальную схему.

Для уже подключенного проекта новая миграция настроек была применена командой:

```txt
npx.cmd --yes supabase db query --linked --file supabase\migrations\20260516185104_add_payment_settings.sql
npx.cmd --yes supabase db query --linked --file supabase\migrations\20260517043700_add_auth_profile_trigger.sql
npx.cmd --yes supabase db query --linked --file supabase\migrations\20260517045043_add_moderator_role_and_user_admin.sql
```

Если дальше выравнивать migration history, сначала нужно аккуратно сверить состояние удаленной БД, чтобы не повторить `0001_initial_schema.sql`.
