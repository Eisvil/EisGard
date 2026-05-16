# Supabase Setup

Этот проект пока работает на локальных seed-данных из `lib/seed.ts`, но структура базы уже подготовлена.

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

## 6. Следующий технический шаг

После создания проекта нужно:

1. Заполнить `.env.local`.
2. Применить SQL-миграции.
3. Применить seed.
4. Проверить RLS публичного чтения.
5. Перевести mock-действия админки на server actions/API routes.
