# API Routes

Проект уже имеет серверные маршруты для ключевых пользовательских действий. Пока Supabase env не заполнен, они возвращают mock-ответы. Если `.env.local` содержит Supabase URL/key и service role key, маршруты записывают данные в Supabase из server-side кода.

Публичные POST routes не переводят донаты в `paid` и не раскрывают секретные ключи клиенту. Записи создаются сервером через service role client, а публичное чтение персональных данных остается закрытым RLS.

Все `/api/admin/*` routes требуют Supabase Auth session и роль `admin` или `superadmin` в `profiles.role`. Роль `moderator` не видит админ-панель и зарезервирована для будущей модерации комментариев. Временный bootstrap-доступ задается через `ADMIN_BOOTSTRAP_EMAILS`.

## `POST /api/donations`

Создает донат.

Payload:

```json
{
  "buildingSlug": "kuznica",
  "slotId": "forge",
  "donorName": "Иван Петров",
  "donorEmail": "ivan@example.ru",
  "amount": 2500,
  "publishName": true
}
```

Режимы:

- `mock`: возвращает оплаченный mock-донат для локального UX.
- `supabase`: создает запись в `donations` со статусом `pending`.

Важно: реальный статус `paid` должен выставляться только webhook ЮKassa. Текущий mock-режим нужен для демонстрации UX до платежной интеграции.

## `POST /api/volunteer-applications`

Создает волонтерскую заявку.

Payload:

```json
{
  "name": "Артем Крылов",
  "email": "artem@example.ru",
  "phone": "+7 900 111-22-33",
  "buildingSlug": "kuznica",
  "skills": ["плотник", "разнорабочий"],
  "preferredDates": "1-7 июня",
  "comment": "Могу приехать на неделю"
}
```

Режимы:

- `mock`: возвращает mock-заявку со статусом `new`.
- `supabase`: создает запись в `volunteer_applications`.

## Admin API routes

## `PATCH /api/admin/buildings/[slug]`

Обновляет здание. В mock-режиме возвращает payload, в Supabase-режиме обновляет `buildings` через service role key.

## `PATCH /api/admin/collection-items/[id]`

Обновляет слот поддержки. В Supabase-режиме пишет в `collection_items`.

## `PATCH /api/admin/map-markers/[buildingSlug]`

Обновляет координаты маркера здания. `x` и `y` должны быть числами от 0 до 100.

## `PATCH /api/admin/chronicle/[id]`

Обновляет публичное имя, текст, видимость и закрепление записи летописи.

## `PATCH /api/admin/donations/[id]`

Обновляет статус доната. Переход `pending -> paid`:

- выставляет `paid_at`;
- увеличивает `buildings.collected_amount`;
- увеличивает `collection_items.collected_amount`;
- увеличивает `collection_items.quantity_funded`;
- создает запись в `chronicle_entries`.

Повторный `paid` для уже оплаченного доната идемпотентен: суммы и летопись не дублируются, `paid_at` не меняется. Переход из `paid` в другой статус заблокирован до отдельного refund-сценария.

## `PATCH /api/admin/volunteer-applications/[id]`

Обновляет статус и комментарий волонтерской заявки. Если переданы `hours`, route создает или обновляет запись `volunteer_hours`, пересчитывает points и синхронизирует запись летописи без дублей для той же заявки.

## `PATCH /api/admin/settings`

Сохраняет singleton-настройки проекта в `project_settings`.

Поддерживает:

- базовые реквизиты проекта;
- юридические тексты;
- активный платежный режим: `mock`, `tbank_collection_manual`, `yookassa`;
- включение ручного сценария Т-Банк Сборов;
- публичную ссылку и описание сбора.

Секреты ЮKassa через этот route не принимаются и не хранятся в БД. Они должны быть только в server env.

## `GET /api/admin/users`

Возвращает список профилей пользователей для админки. Требует роль `admin` или `superadmin`.

## `PATCH /api/admin/users/[id]`

Обновляет роль пользователя в `profiles.role`.

Разрешенные назначения:

- `participant`;
- `moderator`;
- `admin`.

`moderator` не получает доступ к `/admin`; `admin` получает доступ к админ-панели. Назначать `admin` может только `superadmin`.

## Следующие API routes

План:

- `POST /api/yookassa/create-payment`;
- `POST /api/yookassa/webhook`;
- `POST /api/admin/media`.
