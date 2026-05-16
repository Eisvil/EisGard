# API Routes

Проект уже имеет серверные маршруты для ключевых пользовательских действий. Пока Supabase env не заполнен, они возвращают mock-ответы. Если `.env.local` содержит Supabase URL/key, маршруты пытаются записать данные в Supabase.

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

## Следующие API routes

## `PATCH /api/admin/buildings/[slug]`

Обновляет здание. В mock-режиме возвращает payload, в Supabase-режиме обновляет `buildings` через service role key.

## `PATCH /api/admin/collection-items/[id]`

Обновляет слот поддержки. В Supabase-режиме пишет в `collection_items`.

## `PATCH /api/admin/map-markers/[buildingSlug]`

Обновляет координаты маркера здания. `x` и `y` должны быть числами от 0 до 100.

## `PATCH /api/admin/chronicle/[id]`

Обновляет публичное имя, текст, видимость и закрепление записи летописи.

## Следующие API routes

План:

- `POST /api/yookassa/create-payment`;
- `POST /api/yookassa/webhook`;
- `PATCH /api/admin/volunteer-applications/[id]`;
- `PATCH /api/admin/donations/[id]`;
- `POST /api/admin/media`.
