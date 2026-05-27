# DECISIONS — Архитектурные решения

Решения, принятые в ходе разработки, которые отступают от SPEC или уточняют её.

---

## БД: имена колонок в таблице `objects`

| SPEC не уточняла | Реализовано | Причина |
|-----------------|-------------|---------|
| позиции хотспота | `map_position_x`, `map_position_y` (NUMERIC 5,2) | Явнее семантика; пространство для будущего admin-конструктора карты |
| URL обложки | `cover_url` | Согласован с `avatar_url` в `profiles` |
| ключ иконки | `icon_key` (TEXT, отдельно от `slug`) | `slug` — уникальный URL-идентификатор (`kuznitsa`), `icon_key` — ключ иконки SVG (`forge`). Разделение нужно, чтобы менять URL не ломая иконки |
| описание | `description JSONB` | JSONB зарезервирован для будущей мультиязычности (`{ru: "...", en: "..."}`). Пока хранится как JSON-строка `"текст"` |

## БД: зоны в `objects.zone`

Хранятся английские ключи: `'craft' | 'public' | 'farming' | 'military' | 'residential'`.  
В UI используются русские лейблы через `ZONE_LABELS` из `src/lib/constants/zones.ts`.  
**Причина:** CHECK constraint в Postgres удобнее писать на ASCII; маппинг в коде — единая точка правды для UI-лейблов.

## БД: `objects.status` содержит `'draft'`

SPEC описывает 4 статуса (`planned | building | done | working`), но в CHECK добавлен `'draft'`.  
**Причина:** нужен для черновиков объектов в admin-панели до публикации. RLS-политика `status != 'draft'` скрывает черновики от гостей.

## БД: `chronicle_events` INSERT policy

```sql
WITH CHECK (auth.role() = 'service_role')
```
**Причина:** начисление баллов и запись в летопись происходит через `awardPoints()` в Server Action с service-role ключом. Прямые INSERT от пользователей запрещены.

## БД: `donations.ymoney_operation_id TEXT UNIQUE`

SPEC требует идемпотентности вебхука. Реализовано через UNIQUE на `ymoney_operation_id`.  
**Причина:** позволяет использовать `INSERT ... ON CONFLICT DO NOTHING` вместо ручной проверки дубликатов.

## Next.js: имя пакета `gorodische`

`package.json` содержит `"name": "gorodische"` (не `eisgard`).  
**Причина:** `create-next-app` не принимает заглавные буквы в имени пакета; scaffolding делался в папке `gorodische`, потом файлы перемещены в `EisGard`.

## CSS: статусные цвета

Источник истины — оригинальный прототип (`app.js` / `map.css`), не Tailwind-цвета:
```
planned:  #aeb4a0
building: #e9b643
done:     #859c49
working:  #806741
```
Эти значения продублированы в `src/lib/constants/objectStatus.ts` и в `.planned/.building/.done/.working` классах в `map.css` (для легенды).

## `handle_new_user()` — обязателен `SET search_path = public`

Функция-триггер создания профиля при регистрации должна иметь явный `SET search_path = public`.  
**Причина:** в новых версиях Supabase/GoTrue `SECURITY DEFINER`-функции без `search_path` не могут найти таблицу `profiles` — auth возвращает «Database error saving new user».  
Применено в миграции `20260527000003_fix_handle_new_user_search_path.sql`.

## US-003: `subscriptions.ymoney_token` — nullable

SPEC требовал `TEXT NOT NULL`. Сделано nullable через миграцию `20260527000004`.  
**Причина:** ЮMoney P2P quickpay (личный кошелёк) не возвращает recurring-токен в webhook.  
Токен приходит только при оплате через YooKassa merchant API. Поле заполнится при переходе на merchant-интеграцию.  
Cron выбирает только подписки с `ymoney_token IS NOT NULL`, поэтому автоматических списаний пока нет.

## US-003: `subscriptions.status = 'pending'` до подтверждения оплаты

Подписка создаётся со статусом `'pending'`, переходит в `'active'` только когда вебхук ЮMoney подтверждает первый платёж.  
**Причина:** без этого пользователь, прервавший оплату на стороне ЮMoney, получал ложную ошибку «уже есть активная подписка» при следующей попытке.  
Брошенные `pending`-записи удаляются при каждом новом вызове `POST /api/donations/subscribe`.  
ALREADY_SUBSCRIBED блокирует только статусы `active` и `paused`.

## US-003: Cron — заглушка `attemptCharge()`

`/api/cron/subscriptions` содержит `attemptCharge()` которая логирует и возвращает `false`.  
**Причина:** YooKassa merchant OAuth credentials не получены. Реальный вызов `request-payment` + `process-payment` добавить после регистрации в YooKassa и получения `access_token`.

## US-003: `/profile` — минимальная версия

Страница профиля создана как часть US-003: только секция подписок.  
US-007 («Личный кабинет и сертификат») расширит до полного профиля с донатами, волонтёрством, PDF.

## US-006: Маршрут `/partners` вместо формы на главной

SPEC указывает `Экран: /` для партнёрской формы. Реализовано как отдельная страница `/partners`.

**Причина:** SPEC в таблице маршрутов не включает отдельный маршрут для партнёров, но все аналогичные формы
(волонтёры → `/volunteers`, материалы → `/materials`) вынесены в отдельные страницы.
Встраивание 8-польной формы на главную нарушило бы визуальный баланс карты и летописи.
Навигационная ссылка «Партнёрам» добавлена в Header рядом с «Материалы».

## `src/types/database.ts` — заглушка

Файл содержит `export type Database = Record<string, unknown>` вместо сгенерированных типов.  
**Когда исправить:** `npx supabase gen types typescript --project-id wxhvssbvguvxvslgtvod > src/types/database.ts` — после стабилизации схемы.
