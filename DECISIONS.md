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

## US-008: shadcn/ui инициализация под Tailwind v4

`npx shadcn@latest init` не поддерживает Tailwind v4 (нет `tailwind.config.js`).  
**Решение:** создан `components.json` вручную с `"tailwind": { "config": "" }` (пустой путь), CSS указан на `src/app/admin.css`.  
shadcn-компоненты добавлялись через `npx shadcn@latest add ...` после ручного создания `components.json`.

## admin.css: обязателен `@theme inline` для Tailwind v4

Добавлен блок `@theme inline { --color-background: hsl(var(--background)); ... }` в `src/app/admin.css`.  
**Причина:** В Tailwind v4 утилиты `bg-background`, `bg-primary`, `text-foreground` и т.д. генерируют CSS только если соответствующий `--color-XXX` определён в `@theme`. Без этого все компоненты Radix UI Portal (Dialog, AlertDialog, Select popover) рендерятся с прозрачным фоном — сквозь них видна тёмная overlay (`bg-black/80`), что даёт «тёмный диалог».

## US-008: Tailwind/shadcn CSS изолированы в `src/app/admin.css`

`src/app/globals.css` содержит только `box-sizing: border-box` — не содержит `@import "tailwindcss"`.  
Директивы Tailwind и shadcn CSS-переменные вынесены в `src/app/admin.css`, который импортируется только в `src/app/(admin)/layout.tsx`.  
**Причина:** публичный сайт использует кастомную дизайн-систему (`src/styles/`). Tailwind-утилиты на публичных страницах запрещены по правилам проекта.

## US-008: Слоты — запись только для `role = 'admin'`

POST/PATCH/DELETE слотов требуют `requireAdmin(['admin'])` — модераторы не могут изменять слоты.  
**Причина:** RLS-политика `slots_all_admin` в БД разрешает запись только для `role = 'admin'`. Расширять до moderator можно через миграцию при необходимости.

## US-008: description в ObjectForm — `<Textarea>` (plain string)

Поле описания в форме объекта — обычный `<Textarea>`, не Tiptap WYSIWYG.  
**Причина:** US-008 фокусируется на CRUD-механике. Tiptap планируется добавить в US-011 (редактор новостей); затем можно вернуться и апгрейдить ObjectForm.

## US-016: @dnd-kit вместо react-beautiful-dnd

Для drag-and-drop сортировки титулов использован `@dnd-kit/sortable` вместо `react-beautiful-dnd`.
**Причина:** react-beautiful-dnd официально deprecated, не поддерживает React 18 Strict Mode (двойной вызов эффектов ломает DnD-состояние). `@dnd-kit` — активно поддерживаемая современная замена.

## Слоты: тип `'materials'` удалён из `slot_type`

CHECK constraint в БД оставлен (`'money','materials','labor'`), но API (`z.enum`) и UI (`SlotsManager`) принимают только `'money' | 'labor'`.  
**Причина:** сбор материалов ведётся через отдельный раздел (Настройки → Материалы → таблица `materials` + `material_applications`). Слот типа «материалы» дублировал бы этот флоу и создавал путаницу у администратора.  
Если понадобится вернуть тип в API — достаточно расширить enum в Zod и добавить SelectItem в UI без миграции.

## Слоты: колонки `image_url` и `description`

Добавлены миграцией `20260527000012`. Оба поля — nullable TEXT.  
**Причина:** изображение слота используется на странице объекта для визуализации конкретной цели (например, фото горна в кузнице). Описание даёт контекст донатору о назначении слота.  
Значения опциональны — существующие слоты без изменений.

## Трекинг просмотров объектов — клиентский компонент + API-роут

Просмотры считаются через `ObjectViewTracker` (client component, монтируется на странице объекта) → POST `/api/track-view`.  
**Почему не Server Component:** Server Component выполняется при каждом SSR-запросе, но Next.js кэширует страницы (`revalidate`); INSERT из Server Component ненадёжен при ISR. Клиентский mount срабатывает только при реальном открытии страницы браузером.  
**Почему не middleware:** middleware не знает об `object_id` — его нужно получать из БД по slug, что добавляет задержку на каждый запрос сайта.  
**Дедупликация:** UNIQUE(object_id, ip_hash, viewed_at) в БД — один просмотр с одного IP в день, дубли молча игнорируются.

## ObjectForm: обложка загружается напрямую из браузера в Storage

`covers` bucket допускает аутентифицированный upload (RLS: `auth.role() = 'authenticated'`). Путь: `objects/{id}/{timestamp}.ext`.  
Для создания нового объекта (нет id) файл кладётся в `objects/new/{timestamp}.ext` — после сохранения объекта URL остаётся корректным, т.к. Storage не привязан к id объекта.

---

## `src/types/database.ts` — заглушка

Файл содержит `export type Database = Record<string, unknown>` вместо сгенерированных типов.  
**Когда исправить:** `npx supabase gen types typescript --project-id wxhvssbvguvxvslgtvod > src/types/database.ts` — после стабилизации схемы.

---

## Дизайн: Lora вместо Palatino Linotype как основной шрифт

Подключён Google Fonts Lora через `next/font/google` (subsets `latin`, `cyrillic`; weights 400/500/600/700). `--serif` обновлён: `var(--font-lora), "Palatino Linotype", "Book Antiqua", Georgia, serif`.

**Причина:** Palatino Linotype — системный шрифт Windows без корректных TrueType-хинтов; на экранах < 120 DPI (большинство Windows-мониторов) рендерится размыто. Lora — OTF с хинтами, одинаково чёткий на Windows/Android/Mac и имеет полноценный кириллический subset.

## Дизайн: Fluid type scale через clamp() вместо фиксированных px

Все heading- и body-размеры переведены на CSS-переменные `--text-xs`…`--text-4xl` (Major Third 1.25, base 16px), реализованные через `clamp(min, vw, max)`. Добавлены в `globals.css :root`.

**Причина:** до рефакторинга размеры были захардкожены хаотично (36/27/22/20px без системы). Fluid clamp обеспечивает читаемость на 375px без отдельных медиа-запросов под каждый размер. Все 9 значений — в одном месте.

## Дизайн: Semantic color tokens (--ink-soft, --ink-muted, --ink-faint)

Добавлены промежуточные семантические токены: `--ink-soft: #777064`, `--ink-muted: #938878`, `--ink-faint: #b0a899`, `--surface-hover: rgba(240,234,220,.55)`.

**Причина:** в CSS было 6+ вариантов одного «мягкого серо-коричневого» (#777064, #7a7266, #6e675c, #665e51, #665f54…). Токен даёт единую точку правды для второстепенного текста без поиска по всем файлам. Дополняют существующую палитру (--ink, --olive, --gold), не заменяя её.

## Дизайн: Unicode-символы → lucide-react

Все Unicode-символы в UI (♙⚒♟◆★♧◷◈▤) заменены на `lucide-react` SVG-иконки.

**Причина:** Unicode-символы не управляются через CSS `color`/`stroke`, не масштабируются предсказуемо и рендерятся по-разному на разных ОС/шрифтах. lucide-react — единое семейство (stroke-width=1.75), размер и цвет через props.

Файлы: `Footer.tsx` (Eye/BookOpen/Leaf), `MapSection.tsx` (Star/Coins/Clock/CreditCard/Package/Users/Handshake). CSS-контейнеры `.principle b` и `.support-grid b` переведены с `font-size` на `display: flex; align-items: center`.

## Футер: социальные иконки в отдельном 5-м столбце grid

`.social` вынесен из вложенного layout `.footer-brand` в самостоятельный 5-й элемент `.footer-inner` grid (было в `grid-column: 1/3` внутри `.footer-brand`).

**Причина:** новая колонка сохраняет 4-колоночную сетку принципов неизменной и даёт социальным иконкам независимое позиционирование. Footer-brand сохраняет собственную 2-колоночную внутреннюю сетку (логотип + название) без влияния иконок.

## Футер: async Server Component — динамические соцссылки из settings

`Footer.tsx` стал `async function`. При рендере фетчит из таблицы `settings` ключи `social_vk`, `social_telegram`, `social_youtube`, `social_vk_icon`, `social_telegram_icon`, `social_youtube_icon`. Ошибка фетча обрабатывается silently — футер рендерится без ссылок.

**Причина:** URL соцсетей и иконки управляются через admin → Настройки → Соцсети; не должны быть захардкожены в коде.

## Дизайн: AdminSidebar — кастомные CSS-классы вместо Tailwind-утилит

Навигация и бренд сайдбара используют CSS-классы (`.admin-nav-link`, `.admin-brand-name` и др.) из `admin.css`, а не Tailwind-утилиты.

**Причина:** брендинг сайдбара требует `var(--serif)`, `var(--olive-dark)`, `var(--gold)` — токены из `globals.css`. Tailwind не имеет прямых утилит для этих переменных (они не в `@theme`). Добавлять их в `@theme` каждый раз громоздко; кастомные классы в `admin.css` дают прямой доступ к CSS-переменным дизайн-системы и сохраняют единый источник стилей.

Tailwind-утилиты (размеры, отступы, flex) в компоненте сохранены — кастомные классы отвечают только за цвета и типографику.

## Социальные иконки: кастомный upload с fallback на SVG

Если в `settings` задан `social_*_icon` (URL в Storage) → рендерим `<img width={40} height={40} objectFit="contain">`. Иначе → дефолтный inline `<svg>` с path-данными (VK, Telegram, YouTube).

**Причина:** администратор может заменить любую иконку на брендированный PNG/SVG без деплоя. Fallback гарантирует, что при пустом значении иконка всё равно отображается.

Файлы иконок загружаются в `covers/settings/social_{network}_{timestamp}.ext`. Ключ `social_vk_icon` / `social_telegram_icon` / `social_youtube_icon` в `settings` хранит публичный URL.

## Storage: SVG добавлен в covers bucket через SQL (не миграцией)

`image/svg+xml` добавлен в `allowed_mime_types` бакета `covers` через `UPDATE storage.buckets SET allowed_mime_types = array_append(...)` выполненный через Supabase MCP (`execute_sql`).

**Причина:** это runtime-конфигурация Storage, не изменение схемы БД. Создание миграции `.sql` файла для изменения записи в `storage.buckets` нестандартно — миграции меняют схему, не данные системных таблиц. Изменение применено напрямую и не требует `npx supabase db push`.

## ЮMoney вебхук: SHA-1 → HMAC-SHA256 (с 18 мая 2026)

ЮMoney прекратил отправлять поле `sha1_hash` и перешёл на `sign` (HMAC-SHA256) с 18 мая 2026.

**Формула:** `HMAC-SHA256(secret, все_поля_кроме_sign_sorted_alphabetically)` где каждый value прогоняется через `encodeURIComponent`, строка собирается как `key=value&key=value&...`.

**Реализация:** `src/lib/payments/ymoney.ts` — функция `verifyNotification(params, secret)`. Старые `verifyWebhookSignature` и `verifyCardSignature` (SHA-1) удалены полностью.

Функция `buildQuickpayUrl()` не изменилась.

## Волонтёрские дни на главной — RPC вместо прямого запроса к таблице

`page.tsx` (ISR, anon-ключ) не может читать `volunteer_applications` напрямую — RLS-политика `vol_apps_select_own` требует аутентификации.

**Решение:** RPC `get_volunteer_days_total()` с `SECURITY DEFINER` — возвращает только `SUM(days_worked)` для `status='completed'`. Личные данные не раскрываются. `GRANT EXECUTE TO anon, authenticated` открывает вызов для публичного клиента.

**Файлы:** `supabase/migrations/20260530000001_volunteer_days_rpc.sql`, `src/app/(public)/page.tsx`.

---

## `donations.amount_kopecks_check` — минимум > 0 вместо >= 10000

Было: `CHECK (amount_kopecks >= 10000)`.  
Стало: `CHECK (amount_kopecks > 0)` (миграция `20260529220000`).

**Причина:** ЮMoney удерживает комиссию (~3%) с карточных платежей. При платеже 100 ₽ на кошелёк приходит ~97 ₽ = 9700 копеек. Старый CHECK блокировал `UPDATE` в вебхуке молча — статус оставался `pending`, но баллы уже начислялись (второй `UPDATE` без `amount_kopecks` проходил).

Минимальная сумма доната (100 ₽) по-прежнему валидируется на уровне API (`/api/donations/initiate`, Zod).

## CSS: адаптивные правила карты — в `map.css`, не в `responsive.css`

Все `@media`-переопределения для классов из `map.css` (`.settlement-map`, `.map-canvas`, `.player-hud`, `.hotspot*`, `.zoom`, `.legend`) живут **в самом `map.css`**, а не в `responsive.css`.

**Причина:** Next.js production webpack (в отличие от Turbopack dev) разбивает CSS на несколько `<link>`-чанков. `map.css` попадает в отдельный чанк, загружаемый **после** основного бандла (содержащего `responsive.css`). Базовые правила без медиазапроса, загруженные позже, перебивают `@media`-переопределения из предыдущего чанка — это нарушает каскад. Держать базовые и адаптивные правила карты **в одном файле** гарантирует правильный порядок внутри чанка: base → `@media`.

`components.css` и `responsive.css` попадают в **один** чанк — их порядок каскада не нарушается, адаптивные правила для не-map классов можно оставлять в `responsive.css`.

## Дизайн: Тёплая тема shadcn в admin.css

13 HSL-переменных shadcn сдвинуты с cold neutral-gray на тёплые paper/olive:
`--background: 38 30% 98%` (было `0 0% 100%`), `--primary: 84 22% 40%` (olive; было `222.2 47.4% 11.2%`), `--border: 35 28% 86%` (было `214.3 31.8% 91.4%`), остальные muted/accent/ring/foreground по той же логике.

**Причина:** дефолтная shadcn-тема в cold gray визуально выбивалась из публичной части с тёплой paper/olive палитрой. После смены admin-интерфейс воспринимается как органичное продолжение сайта. `@theme inline` маппинг и `destructive` переменная остаются без изменений.
