# PROGRESS — Живое Городище

## Сделано

### Фундамент (2026-05-27)
- [x] Scaffold Next.js 16 (App Router, TypeScript, `src/`, `@/` alias)
- [x] CSS-дизайн-система разбита на 5 файлов в `src/styles/`
- [x] Supabase-клиенты: `src/lib/supabase/server.ts`, `browser.ts`
- [x] Миграция `20260527000000_initial_schema.sql` — 19 таблиц, RLS, триггеры moddatetime
- [x] Константы: `objectStatus.ts`, `zones.ts`, `objectIcons.tsx`
- [x] `src/types/database.ts` — реальные типы (19 таблиц, 4 RPC), сгенерированы 2026-05-27
- [x] Seeded: 9 объектов в таблице `objects` с позициями и описаниями
- [x] Seeded: 4 титула в `titles`, 8 навыков в `skills`
- [x] Публичные ассеты скопированы в `public/` (объекты, карта, логотип, футер)

### US-001: Просмотр карты и выбор объекта (2026-05-27)
- [x] `src/components/layouts/Header.tsx` — навигация с активной ссылкой
- [x] `src/components/layouts/Footer.tsx` — футер с соцсетями и принципами
- [x] `src/components/features/MapSection.tsx` — интерактивная карта (хотспоты, фильтры зон, зум, тост)
- [x] `src/app/(public)/page.tsx` — Server Component, данные из Supabase

### US-002: Разовое пожертвование (ЮMoney quickpay) (2026-05-27)
- [x] `zod` установлен (v4)
- [x] `src/lib/utils/formatMoney.ts` — `formatMoney()` и `getProgress()` (извлечены из MapSection)
- [x] `src/lib/points/awardPoints.ts` — атомарное начисление баллов + пересчёт титула
- [x] `src/lib/payments/ymoney.ts` — SHA-1 верификация webhook + buildQuickpayUrl()
- [x] `supabase/migrations/20260527000001_seed_slots.sql` — денежные слоты для объектов (идемпотентная)
- [x] `supabase/migrations/20260527000002_increment_helpers.sql` — RPC `increment_slot_value`, `increment_object_raised`
- [x] `src/app/api/donations/initiate/route.ts` — POST, Zod-валидация, создание pending donation, ЮMoney URL
- [x] `src/app/api/payments/ymoney/webhook/route.ts` — SHA-1 проверка, идемпотентность, баллы, летопись
- [x] `src/components/features/DonateModal.tsx` — кастомный modal (без shadcn), inline-валидация
- [x] `src/components/features/SlotsSection.tsx` — карточки слотов + управление модалом
- [x] `src/components/features/DonatedToast.tsx` — toast "Спасибо!" после возврата с ЮMoney
- [x] `src/app/(public)/objects/[slug]/page.tsx` — Server Component, Hero + прогресс + слоты + летопись
- [x] `MapSection.tsx` обновлён — кнопка «Поддержать объект» → навигация на `/objects/[slug]`
- [x] `src/styles/components.css` — стили модала, страницы объекта, слотов, летописи

**ENV-переменные добавлены в `.env.local` (2026-05-27):** `YMONEY_NOTIFICATION_SECRET`, `YMONEY_WALLET`, `NEXT_PUBLIC_SITE_URL`

---

### Auth: Вход / Регистрация / Восстановление пароля (2026-05-27)
- [x] `src/middleware.ts` — сессия-рефреш @supabase/ssr, guard `/profile`, guard `/admin` (role check), fire-and-forget view counter
- [x] `src/app/(auth)/layout.tsx` — layout для auth-группы, импорт CSS
- [x] `src/app/(auth)/auth/login/page.tsx` — форма входа, `signInWithPassword`, resend на неподтверждённый email
- [x] `src/app/(auth)/auth/register/page.tsx` — форма регистрации, валидация ФИО/email/password, `signUp`
- [x] `src/app/(auth)/auth/reset/page.tsx` — форма сброса пароля, `resetPasswordForEmail`
- [x] `src/app/(auth)/auth/update-password/page.tsx` — форма нового пароля, `updateUser`
- [x] `src/app/(auth)/auth/verify-email/page.tsx` — страница ожидания подтверждения
- [x] `src/styles/components.css` — auth-секция (`.auth-bg`, `.auth-card`, `.auth-alert`, `.auth-success`, `.header-user-menu`)
- [x] `src/components/layouts/Header.tsx` — UserMenu (аватар, имя, dropdown «ЛК»/«Выйти»), кнопка «Войти» для гостей

### US-003: Ежемесячная подписка (ЮMoney recurring) (2026-05-27)
- [x] `supabase/migrations/20260527000004_subscriptions_token_nullable.sql` — `ymoney_token` стал nullable
- [x] `supabase/migrations/20260527000005_subscriptions_pending_status.sql` — добавлен статус `'pending'` (подписка до оплаты)
- [x] `src/app/api/donations/subscribe/route.ts` — POST: подписка создаётся как `pending`, удаляет брошенные pending, блокирует только active/paused
- [x] `src/app/api/subscriptions/[id]/route.ts` — DELETE: отмена подписки (проверка владельца)
- [x] `src/app/api/cron/subscriptions/route.ts` — Vercel Cron 1-го числа (protected by CRON_SECRET)
- [x] `src/app/api/payments/ymoney/webhook/route.ts` — `pending → active` на первом подтверждённом платеже + захват token
- [x] `src/components/features/SubscribeModal.tsx` — модал (мин 300 ₽, автозаполнение имени, общий блок ошибок)
- [x] `src/components/features/SubscribeSectionClient.tsx` — client-обёртка кнопки на странице объекта
- [x] `src/components/features/CancelSubscriptionButton.tsx` — кнопка отмены с двухшаговым подтверждением
- [x] `src/components/features/DonateModal.tsx` — автозаполнение имени авторизованного, подсказка «от 100 ₽»
- [x] `src/components/features/SlotsSection.tsx` — пробрасывает `defaultName` в DonateModal
- [x] `src/app/(public)/objects/[slug]/page.tsx` — получает `full_name` профиля, передаёт в слоты и подписку
- [x] `src/app/(cabinet)/layout.tsx` — layout для группы маршрутов личного кабинета
- [x] `src/app/(cabinet)/profile/page.tsx` — минимальный профиль: список подписок (active/paused) + отмена
- [x] `src/styles/components.css` — модал по центру экрана, subscribe-section, profile-page, subscriptions-table
- [x] `src/middleware.ts` — исправлена ошибка Edge Runtime: `crypto` (Node.js) → `crypto.subtle` (Web Crypto API)
- [x] `vercel.json` — расписание cron `0 9 1 * *`

**ENV-переменные:** `CRON_SECRET` — добавить в `.env.local` и Vercel.

### US-004: Волонтёрская заявка (2026-05-27)
- [x] `supabase/migrations/20260527000006_seed_volunteer_camps.sql` — 3 тестовых заезда (2 открытых, 1 закрыт)
- [x] `src/app/api/volunteer-camps/route.ts` — GET: список заездов с `spots_left` (pending+approved)
- [x] `src/app/api/volunteer-applications/route.ts` — POST: заявка (Zod, auth, CAMP_FULL, ALREADY_APPLIED, upsert user_skills)
- [x] `src/app/(public)/volunteers/page.tsx` — Server Component: список заездов, spots_left, навыки из Supabase
- [x] `src/components/features/VolunteersClient.tsx` — client-обёртка: управление модалом, редирект гостей на login
- [x] `src/components/features/VolunteerModal.tsx` — модал: чекбоксы навыков, комментарий, success-state
- [x] `src/styles/components.css` — стили `.camp-card`, `.camp-spots`, `.skills-checkboxes`, `.volunteer-success`
- [x] `src/app/(auth)/auth/login/page.tsx` — исправлен: `useSearchParams()` обёрнут в `<Suspense>` (fix build error)
- [x] `src/components/layouts/Header.tsx` — исправлена ссылка «Волонтёрам»: `/volunteer` → `/volunteers`

### US-006: Партнёрская заявка (2026-05-27)
- [x] `src/app/api/partner-applications/route.ts` — POST: заявка (Zod, без auth, INSERT в partner_applications)
- [x] `src/app/(public)/partners/page.tsx` — Server Component: список объектов из Supabase (status != draft)
- [x] `src/components/features/PartnersClient.tsx` — client-обёртка: управление модалом, нет редиректа (форма публичная)
- [x] `src/components/features/PartnerModal.tsx` — модал: org_name, inn, support_type, description, contact_name, contact_email, contact_phone, object_id; success-state
- [x] `src/styles/components.css` — стили `.partners-page`, `.partner-submitted-msg`
- [x] `src/components/layouts/Header.tsx` — добавлена ссылка «Партнёрам» → /partners

### US-005: Заявка на материалы (2026-05-27)
- [x] `supabase/migrations/20260527000007_seed_materials.sql` — 7 тестовых материалов (кузница, гончарная, жилые избы, общие)
- [x] `src/app/api/materials/route.ts` — GET: список активных материалов с прогрессом и именем объекта
- [x] `src/app/api/material-applications/route.ts` — POST: заявка (Zod, auth, contact_phone|telegram обязателен, MATERIAL_INACTIVE)
- [x] `src/app/(public)/materials/page.tsx` — Server Component: список материалов из Supabase
- [x] `src/components/features/MaterialsClient.tsx` — client-обёртка: управление модалом, редирект гостей на login
- [x] `src/components/features/MaterialModal.tsx` — модал: количество, телефон/Telegram, комментарий, success-state
- [x] `src/styles/components.css` — стили `.materials-page`, `.material-row`, `.material-name`, `.material-progress-wrap`

### US-007: Личный кабинет и сертификат (PDF) (2026-05-27)
- [x] `src/app/api/profile/route.ts` — GET (profile + title + next_title + skills + stats), PATCH (full_name, birth_date, in_chronicle, skill_ids, avatar_url)
- [x] `src/app/api/profile/certificate/route.ts` — POST: proxy-заглушка на PDF_SERVICE_URL, при отсутствии → 503
- [x] `src/components/features/ProfileHero.tsx` — `avatarSlot` prop (Server Component), ФИО, титул-badge, баллы
- [x] `src/components/features/AvatarUploader.tsx` — загрузка аватарки: выбор файла → кроп-модал (react-image-crop, aspect 1:1) → Canvas 256×256 → Supabase Storage `avatars/{userId}/avatar.jpg` → PATCH profile
- [x] `src/components/features/TitleProgress.tsx` — прогресс до следующего титула / «Высший статус достигнут»
- [x] `src/components/features/DonationsTable.tsx` — таблица подтверждённых пожертвований
- [x] `src/components/features/VolunteerTable.tsx` — таблица волонтёрских заявок со статус-badge
- [x] `src/components/features/MaterialsDonationsTable.tsx` — таблица заявок на материалы
- [x] `src/components/features/CertificateButton.tsx` — скачивание PDF, loading state, ошибка при 503
- [x] `src/components/features/ProfileEditForm.tsx` — форма редактирования (ФИО, дата рождения, навыки, летопись), PATCH + router.refresh()
- [x] `src/app/(cabinet)/profile/page.tsx` — переписан: Promise.all (8 запросов параллельно), все секции, статистика (пожертвовано / дней / материалов)
- [x] `supabase/migrations/20260527000008_avatars_storage.sql` — Storage bucket `avatars` (публичный, 2 МБ, jpg/png/webp), RLS: пользователь пишет только в свою папку
- [x] `src/styles/components.css` — стили: `.avatar-uploader-trigger`, `.avatar-edit-overlay`, `.crop-modal-overlay`, `.crop-modal`, `.profile-hero`, `.profile-title-badge`, `.title-progress-wrap`, `.profile-stats`, `.cert-btn`, `.history-table`, `.profile-edit-form`
- [x] `react-image-crop` — установлен (v11)

**ENV:** `PDF_SERVICE_URL` — добавить в `.env.local` и Vercel при подключении VPS.

### US-008: Admin — управление объектами и слотами (2026-05-27)
- [x] `src/lib/utils/slugify.ts` — транслитерация кириллицы в slug
- [x] `src/lib/admin/requireAdmin.ts` — переиспользуемый auth-хелпер (401/403) для Route Handlers
- [x] `supabase/migrations/20260527000009_covers_bucket.sql` — Storage bucket `covers` (5 МБ, jpg/png/webp), RLS
- [x] `src/app/api/admin/objects/route.ts` — GET (список + черновики), POST (создание, только admin)
- [x] `src/app/api/admin/objects/[id]/route.ts` — GET/PATCH/DELETE; PATCH: проверка слотов перед публикацией (NO_SLOTS), slug uniqueness, revalidatePath
- [x] `src/app/api/admin/objects/[id]/slots/route.ts` — GET, POST (только admin)
- [x] `src/app/api/admin/objects/[id]/slots/[slotId]/route.ts` — PATCH, DELETE (только admin, cross-object защита)
- [x] `src/app/api/admin/objects/[id]/analytics/route.ts` — GET: просмотры + донаты, `Cache-Control: max-age=600`
- [x] `src/app/api/admin/map/image/route.ts` — POST: загрузка фона карты в Storage, обновление settings
- [x] `src/components/layouts/AdminSidebar.tsx` — `'use client'`, активный пункт через usePathname, signout
- [x] `src/app/(admin)/layout.tsx` — импортирует `admin.css` (Tailwind + shadcn CSS vars), AdminSidebar
- [x] `src/app/admin.css` — Tailwind v4 + shadcn CSS-переменные, изолировано от публичного CSS
- [x] `src/components/features/admin/ObjectForm.tsx` — slug auto-gen с транслитерацией, все поля, предупреждение при 0 слотах
- [x] `src/components/features/admin/SlotsManager.tsx` — CRUD слотов inline, AlertDialog удаления
- [x] `src/components/features/admin/AnalyticsPanel.tsx` — метрики объекта (5 карточек), loading skeleton
- [x] `src/components/features/admin/DeleteObjectDialog.tsx` — AlertDialog удаления объекта → redirect
- [x] `src/components/features/admin/ObjectEditTabs.tsx` — Tabs: Основное / Слоты / Аналитика
- [x] `src/components/features/admin/ObjectsTable.tsx` — таблица объектов, Badge статуса, delete confirm
- [x] `src/components/features/admin/MapConstructor.tsx` — drag-and-drop иконок (HTML5 mouse events), смена фона
- [x] `src/app/(admin)/admin/page.tsx` — Dashboard: статистика объектов по статусам + количество слотов
- [x] `src/app/(admin)/admin/objects/page.tsx` — список всех объектов
- [x] `src/app/(admin)/admin/objects/new/page.tsx` — форма создания
- [x] `src/app/(admin)/admin/objects/[id]/page.tsx` — редактор с вкладками
- [x] `src/app/(admin)/admin/map/page.tsx` — конструктор карты
- [x] shadcn/ui компоненты: button, input, label, select, textarea, dialog, alert-dialog, badge, table, tabs, card, separator

### Правки и улучшения после US-008 (2026-05-27)
- [x] `Header.tsx` — ссылка «Админка» в дропдауне пользователя (только для `admin` и `moderator`)
- [x] `ObjectForm.tsx` — исправлен краш: `<SelectItem value="">` заменён на `value="none"` (shadcn запрещает пустую строку)
- [x] `SlotsManager.tsx` — ввод цели слотов в рублях в UI, конвертация × 100 перед сохранением в БД; метка ед. в форме добавления
- [x] Миграция `sync_object_total_goal` — триггер на `slots`: `total_goal_rub` объекта = `SUM(goal_value)` открытых денежных слотов; разовый пересчёт всех объектов
- [x] `MapConstructor.tsx` — карта на всю ширину (убран `maxWidth`), секция «Не на карте» перенесена под карту в виде тегов
- [x] `admin/page.tsx` — убраны кнопки быстрых действий, оставлена только статистика
- [x] `MapSection.tsx` — иконки хотспотов привязаны к реальным границам отрендеренного изображения через `ResizeObserver` + расчёт `object-fit: cover` offset; больше не уезжают при смене разрешения

### US-010: Просмотр летописи и новостей (2026-05-27)
- [x] `src/app/api/chronicle/route.ts` — GET: page/per_page/event_type/object_id, JOIN objects, JOIN profiles (аноним), meta total
- [x] `src/app/api/news/route.ts` — GET: page/per_page/tag, только published=true, ORDER BY published_at DESC
- [x] `src/app/api/news/[slug]/route.ts` — GET: ?preview=true проверяет auth + role, 404 если не найдено
- [x] `src/components/features/TiptapRenderer.tsx` — read-only Tiptap (StarterKit + Link + Image + Youtube), immediatelyRender: false
- [x] `src/components/features/MapSection.tsx` — реальные данные chronicle + news из props, Realtime subscription с 500ms дебаунсом, кнопка «Вся летопись» → /chronicle
- [x] `src/app/(public)/page.tsx` — Promise.all 3 запроса (objects + chronicle_events + news), передаёт props в MapSection
- [x] `src/components/features/ChronicleList.tsx` — клиентский список, фильтры (all/donation/volunteer/material), «Показать ещё», Realtime prepend
- [x] `src/app/(public)/chronicle/page.tsx` — Server Component, initial 20 событий, metadata
- [x] `src/app/(public)/news/[slug]/page.tsx` — Server Component, generateStaticParams (cookie-free client), generateMetadata, preview mode
- [x] `src/lib/supabase/static.ts` — cookie-free Supabase client для generateStaticParams
- [x] `src/styles/components.css` — .chronicle-filter, .chronicle-full-item, .news-hero, .news-detail, .tiptap-content и др.

### US-011: Admin — создание и публикация новости (2026-05-27)
- [x] `supabase/migrations/20260527000010_news_images_bucket.sql` — Storage bucket `news-images` (5 МБ, jpg/png/webp/gif, public), RLS
- [x] `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-youtube`
- [x] `src/app/api/admin/news/route.ts` — GET (все включая черновики), POST (Zod, slug+коллизия, published_at)
- [x] `src/app/api/admin/news/[id]/route.ts` — GET/PATCH/DELETE; PATCH: published_at=NOW()/null; DELETE: 400 если published
- [x] `src/components/ui/alert.tsx` — shadcn Alert компонент
- [x] `src/components/features/admin/TiptapEditor.tsx` — WYSIWYG toolbar: H2/H3/Bold/Italic/Link/Image/YouTube, upload в news-images
- [x] `src/components/features/admin/NewsForm.tsx` — create/edit, slug auto-gen (80 chars), cover upload, TiptapEditor, draft/publish buttons
- [x] `src/components/features/admin/NewsTable.tsx` — shadcn Table: thumbnail/title+slug/tag/status/date, togglePublish, AlertDialog delete
- [x] `src/app/(admin)/admin/news/page.tsx` — Server Component, requireAdmin, NewsTable
- [x] `src/app/(admin)/admin/news/new/page.tsx` — NewsForm mode="create"
- [x] `src/app/(admin)/admin/news/[id]/edit/page.tsx` — Server Component, fetch by id, NewsForm mode="edit"

### US-012: Admin — волонтёрский заезд (2026-05-28)
- [x] `supabase/migrations/20260527000011_admin_rpcs.sql` — 3 RPC: `find_user_by_email`, `get_users_with_email`, `count_users` (SECURITY DEFINER, JOIN auth.users)
- [x] `src/app/api/admin/camps/route.ts` — GET (список с counts pending/approved), POST (Zod, validate date_to >= date_from)
- [x] `src/app/api/admin/camps/[id]/route.ts` — PATCH (поля заезда + is_open), DELETE (guard HAS_APPROVED_APPS)
- [x] `src/components/features/admin/CampsManager.tsx` — таблица + inline Dialog создания/редактирования, toggle Open/Closed, AlertDialog удаления
- [x] `src/app/(admin)/admin/camps/page.tsx` — Server Component, requireAdmin(['admin','moderator'])

### US-013: Admin — ручной донат (Т-Банк/Сбер/Наличные) (2026-05-28)
- [x] `src/app/api/admin/donations/route.ts` — GET: paginated (20/стр), filters source/status/object_id, JOIN profiles+objects+slots
- [x] `src/app/api/admin/donations/manual/route.ts` — POST: `find_user_by_email` RPC → confirmed donation → `awardPoints` (если найден) → `increment_slot_value` + `increment_object_raised` → chronicle_events
- [x] `src/components/features/admin/ManualDonationDialog.tsx` — Dialog: источник/сумма/дата/имя/email/объект/слот/анонимно; динамическая подгрузка слотов; success-state с итогом баллов
- [x] `src/components/features/admin/DonationsTable.tsx` — таблица c фильтрами + иконка ручного доната + пагинация
- [x] `src/app/(admin)/admin/donations/page.tsx` — Server Component, requireAdmin(['admin'])

### US-015: Admin — пользователи и роли (2026-05-28)
- [x] `src/app/api/admin/users/route.ts` — GET: `get_users_with_email` RPC, search + role filter, пагинация 50/стр
- [x] `src/app/api/admin/users/[id]/route.ts` — PATCH: только role; guard CANNOT_DEMOTE_ADMIN + CANNOT_CHANGE_OWN_ROLE
- [x] `src/components/features/admin/UsersTable.tsx` — поиск с debounce 300ms, inline RoleSelect (user/moderator, admin — readonly), пагинация
- [x] `src/app/(admin)/admin/users/page.tsx` — Server Component, requireAdmin(['admin']), fetch через service-role RPC

### Правки и улучшения (2026-05-28)
- [x] `src/app/admin.css` — добавлен блок `@theme inline { --color-background: hsl(var(--background)); ... }` для Tailwind v4: без него `bg-background`/`text-foreground` не генерируют CSS, из-за чего все Radix Portal-компоненты (Dialog, AlertDialog, Select popover) рендерились с прозрачным фоном — исправлено для `/admin/camps` и всей админки; зафиксировано в DECISIONS.md
- [x] `supabase/migrations/fix_rpc_email_cast.sql` — исправлен тип `email TEXT` в `get_users_with_email` и `find_user_by_email` (PostgreSQL `varchar(255)` → explicit `::TEXT` cast); список пользователей `/admin/users` отображает реальные данные
- [x] Унификация стиля админки — удалены все хардкодные `slate-*`/`red-*` цвета из `ObjectsTable`, `ObjectForm`, `ObjectEditTabs`, `SlotsManager`, `AnalyticsPanel`, `MapConstructor`, `DeleteObjectDialog`, `admin/page.tsx`, `layout.tsx`, `objects/new/page.tsx`; все кнопки удаления используют `bg-destructive text-destructive-foreground hover:bg-destructive/90`; иконки и текст — только семантические shadcn-переменные (`text-muted-foreground`, `border-border`, `bg-muted`)

### US-009: Admin — начисление часов волонтёру (2026-05-28)
- [x] `src/app/api/admin/volunteer-applications/route.ts` — GET: список с фильтрами camp_id/status/page, JOIN profiles+camps+objects
- [x] `src/app/api/admin/volunteer-applications/[id]/route.ts` — PATCH: approve/reject/completed; DAYS_EXCEED_CAMP, ALREADY_COMPLETED; awardPoints + chronicle
- [x] `src/components/features/admin/VolunteerAppsManager.tsx` — таблица, фильтры, Dialog завершения с success-state, AlertDialog отклонения
- [x] `src/app/(admin)/admin/applications/volunteers/page.tsx` — Server Component, requireAdmin

### US-014: Admin — обработка заявки на материалы (2026-05-28)
- [x] `src/app/api/admin/material-applications/route.ts` — GET: список с фильтром status, JOIN profiles+materials+objects
- [x] `src/app/api/admin/material-applications/[id]/route.ts` — PATCH: contacted/not_contacted/received/cancelled; ACTUAL_QTY_REQUIRED; awardPoints; DB-триггер обновляет materials.received_qty
- [x] `src/components/features/admin/MaterialAppsManager.tsx` — таблица, статусный флоу, Dialog «Получено» с actual_qty+points
- [x] `src/app/(admin)/admin/applications/materials/page.tsx` — Server Component, requireAdmin

### US-016: Admin — настройки (2026-05-28)
- [x] `src/lib/points/recalcAllTitles.ts` — вызывает RPC recalc_all_titles через service client
- [x] `src/app/api/admin/titles/route.ts` — GET+POST; POST запускает recalcAllTitles
- [x] `src/app/api/admin/titles/[id]/route.ts` — PATCH (min_points → recalc) + DELETE (TITLE_IN_USE guard)
- [x] `src/app/api/admin/skills/route.ts` — GET+POST
- [x] `src/app/api/admin/skills/[id]/route.ts` — DELETE (SKILL_IN_USE guard)
- [x] `src/app/api/admin/settings/route.ts` — GET+PATCH (points_per_ruble, points_per_day)
- [x] `src/components/features/admin/SettingsManager.tsx` — Tabs: Коэффициенты / Титулы (DnD sort) / Навыки (add/delete)
- [x] `src/app/(admin)/admin/settings/page.tsx` — Server Component, requireAdmin(['admin'])
- [x] `src/components/layouts/AdminSidebar.tsx` — добавлен пункт «Настройки» → /admin/settings
- [x] `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### Полировка и целостность (2026-05-28)
- [x] `AdminSidebar.tsx` — убраны пункты «Пожертвования» (они в Заявки) и «Материалы» (перенесены в Настройки)
- [x] `src/app/(public)/about/page.tsx` — страница «О проекте» (SSG, ISR 3600s, Tiptap рендер из БД)
- [x] `src/app/(public)/privacy/page.tsx` — страница «Политика конфиденциальности»
- [x] `src/app/(public)/personal-data/page.tsx` — страница «Обработка персональных данных»
- [x] `Footer.tsx` — добавлены ссылки на правовые страницы
- [x] `src/styles/components.css` — стили `.static-page-*`, `.about-principles`, `.footer-legal`
- [x] `src/app/api/admin/partner-applications/route.ts` — GET список партнёрских заявок (admin/moderator)
- [x] `src/app/api/admin/partner-applications/[id]/route.ts` — PATCH: approve (с publish_partner) / reject / contacted
- [x] `src/components/features/admin/PartnerAppsManager.tsx` — таблица + Dialog одобрения (логотип, publish) + AlertDialog отклонения
- [x] `src/app/(admin)/admin/applications/partners/page.tsx` — Server Component, requireAdmin
- [x] `ApplicationsTabs.tsx` — добавлена вкладка «Партнёры»
- [x] `src/app/api/admin/static-pages/[slug]/route.ts` — GET/PATCH статичных страниц (admin)
- [x] `src/components/features/admin/StaticPagesEditor.tsx` — редактор через Tiptap + Dialog + автосохранение localStorage 30s + confirm для юр. страниц
- [x] `SettingsManager.tsx` — добавлена вкладка «Страницы» со StaticPagesEditor
- [x] `src/app/api/admin/materials/route.ts` — GET (с `?with_apps=true`) / POST
- [x] `src/app/api/admin/materials/[id]/route.ts` — PATCH / DELETE (guard HAS_PENDING_APPS)
- [x] `src/components/features/admin/MaterialsManager.tsx` — CRUD материалов, toggle активности, pending count
- [x] `src/app/(admin)/admin/materials/page.tsx` — Server Component, requireAdmin(['admin'])
- [x] `src/app/api/admin/stats/route.ts` — GET: участники, сборы, дни волонтёрства, завершённые объекты, pending-заявки
- [x] `src/app/(admin)/admin/page.tsx` — Dashboard переписан: 4 реальные метрики + pending-бейджи + объекты по статусам
- [x] `SettingsManager.tsx` — добавлены вкладки «Материалы» (MaterialsManager) и «Страницы» (StaticPagesEditor)

### UI улучшения ObjectForm и SlotsManager (2026-05-28)
- [x] `ObjectForm.tsx` — URL-поле обложки заменено на uploader с превью (Supabase Storage `covers/objects/{id}/{ts}.ext`)
- [x] `ObjectForm.tsx` — text Select иконки заменён на визуальную сетку SVG-иконок с подсветкой выбранной
- [x] `src/components/features/ObjectViewTracker.tsx` — client-компонент: fire-and-forget POST на `/api/track-view` при монтировании
- [x] `src/app/api/track-view/route.ts` — POST: хеширует IP (SHA-256), INSERT в `object_views`; дубли игнорирует UNIQUE constraint
- [x] `src/app/(public)/objects/[slug]/page.tsx` — добавлен `<ObjectViewTracker />` (аналитика теперь реальная)
- [x] `supabase/migrations/20260527000012_slots_image_description.sql` — ADD COLUMN `image_url TEXT`, `description TEXT` в `slots`
- [x] `SlotsManager.tsx` — тип «Материалы» убран из Select (только Деньги / Труд); добавлены поля изображения (upload в `covers`) и описания
- [x] `slots/route.ts` + `slots/[slotId]/route.ts` — схема Zod обновлена: `slot_type` только `'money'|'labor'`, добавлены `image_url` и `description`

### Реальные данные на главной и правки верстки (2026-05-28)
- [x] `src/app/(public)/page.tsx` — 7 параллельных запросов: objects, chronicle, news, users count, donations sum, volunteer days, objects_done; +3 пользовательских при авторизации (профиль+титул, donations, volunteer_days); передаёт `siteStats` и `userProfile` в MapSection
- [x] `MapSection.tsx` — экспортированы типы `SiteStats`, `UserProfile`; HUD показывает реальные данные пользователя (имя, титул, баллы, сумма донатов, дни); «Строим вместе» — реальные агрегированные цифры
- [x] `MapSection.tsx` — аватар: inline-стили `width/height: 100%` + `objectFit: cover` чтобы изображение заполняло круг
- [x] `MapSection.tsx` — клик по карточке объекта → `router.push('/objects/' + obj.slug)` (вместо selectObject); `.object-card { cursor: pointer }`
- [x] `src/styles/components.css` — `.object-card img: height: 200px`; убран `min-height: 363px`; добавлен `.object-card-placeholder` (warm gradient)
- [x] `src/styles/globals.css` — sticky footer: `body { min-height: 100dvh; display: flex; flex-direction: column; }` + `main { flex: 1 }`
- [x] `src/styles/layout.css` — `.dashboard { width: 100%; margin: 0 }` — фикс сужения дашборда из-за `margin: auto` в flex-column контексте
- [x] `src/app/(public)/about/page.tsx` — добавлены `<Header />` и `<Footer />`
- [x] `src/app/(public)/privacy/page.tsx` — добавлены `<Header />` и `<Footer />`
- [x] `src/app/(public)/personal-data/page.tsx` — добавлены `<Header />` и `<Footer />`

### Дизайн-рефакторинг: типографика, токены, иконки (2026-05-28)
- [x] Lora (Google Fonts) — `next/font/google`, subsets latin+cyrillic, CSS-переменная `--font-lora`; `--serif` обновлён, Palatino Linotype — фоллбэк
- [x] Fluid type scale (Major Third 1.25) — 9 уровней `--text-xs`…`--text-4xl` через `clamp()` добавлены в `globals.css`
- [x] 8px spacing grid — токены `--space-1`…`--space-20` в `globals.css`
- [x] Warm shadow scale — `--shadow-xs/sm/md/lg` (`rgba(80,68,43,…)`) в `globals.css`; заменяют все inline-тени в `components.css`/`layout.css`/`map.css`
- [x] Border radius scale — `--radius-sm/md/lg/xl/pill` в `globals.css`; заменяют хардкодные значения
- [x] Semantic color tokens — `--ink-soft`, `--ink-muted`, `--ink-faint`, `--surface-hover` в `globals.css`; ~20 хардкодных hex (#777064, #938878 и др.) заменены переменными
- [x] `focus-visible` глобальный стиль + `@media (prefers-reduced-motion)` — добавлены в `globals.css` (accessibility)
- [x] `components.css` — type-scale, shadow/radius/color токены применены (~100 замен), sticky thead и alternating rows для `.history-table`
- [x] `layout.css` — навигация, заголовки, футер: type-scale и color-tokens
- [x] `map.css` — player-hud, hotspot-label, legend: type-scale и shadow-tokens
- [x] `Footer.tsx` — 3 Unicode-символа (◈▤♧) → `lucide-react` (`Eye`, `BookOpen`, `Leaf`)
- [x] `MapSection.tsx` — 7 Unicode-символов (★♧◷♙⚒♟◆) → `lucide-react` (`Star`, `Coins`, `Clock`, `CreditCard`, `Package`, `Users`, `Handshake`)
- [x] `admin.css` — 13 shadcn HSL-переменных сдвинуты с cold neutral на тёплые paper/olive (background, foreground, primary, border, ring и др.)
- Ветка: `design/typography-tokens-refactor` | `npm run build` — 62 страницы, 0 ошибок

### Страница объекта — расширение (2026-05-28)
- [x] `supabase/migrations/20260528000001_comments.sql` — таблицы `object_comments`, `comment_bans`; `allow_comments` в `objects`; подписка min 10000 копеек (100 ₽); Storage bucket `comment-photos`
- [x] `src/styles/components.css` — max-width 1100px; `.public-page-layout`; slot-card-image/description; historical-note-accordion; comments section (card, meta, photos, overlay, editor, ban-picker, load-more); support-modal-tabs
- [x] `src/components/features/DonateModal.tsx` — тип `SlotForDonate` расширен: `image_url`, `description`
- [x] `src/components/features/SlotsSection.tsx` — рендер `image_url` и `description` слота; `objectName` prop; SupportModal вместо DonateModal
- [x] `src/components/features/SupportModal.tsx` — единый модал «Разовый / Ежемесячно», min 100 ₽; работает без `object_id` (общий проект)
- [x] `src/components/features/HistoricalNoteAccordion.tsx` — аккордеон с Tiptap read-only рендером
- [x] `src/components/features/CommentEditor.tsx` — Tiptap (bold/italic/link/quote) + 5 фото; ban-message
- [x] `src/components/features/CommentCard.tsx` — карточка комментария: мета, тело, фото, lightbox, ответы, редактирование, удаление, бан
- [x] `src/components/features/CommentsSection.tsx` — список + форма + Realtime + пагинация «Показать ещё»
- [x] `src/app/api/objects/[slug]/comments/route.ts` — GET (список+ответы+пагинация), POST (auth, ban check)
- [x] `src/app/api/comments/[id]/route.ts` — PATCH (edit own comment within 24h)
- [x] `src/app/api/admin/comments/[id]/route.ts` — DELETE (soft delete)
- [x] `src/app/api/admin/comments/[id]/ban/route.ts` — POST (бан на 1h/1d/1m/permanent)
- [x] `src/app/api/donations/initiate/route.ts` — `object_id`/`slot_id` опциональны (общий проект)
- [x] `src/app/api/donations/subscribe/route.ts` — `object_id` опционален; min 100 ₽ (было 300 ₽)
- [x] `src/components/features/admin/ObjectForm.tsx` — `allow_comments` чекбокс
- [x] `src/components/features/admin/ObjectEditTabs.tsx` — тип `ObjectWithSlots` расширен: `allow_comments`
- [x] `src/app/api/admin/objects/[id]/route.ts` — Zod-схема: `allow_comments: z.boolean().optional()`
- [x] `src/app/(public)/objects/[slug]/page.tsx` — 1100px, исторсправка, комментарии, слоты с фото/описанием, убран блок ежемесячной подписки

### UI полировка: футер, соцсети, кнопка поддержки (2026-05-28)
- [x] `Footer.tsx` — преобразован в async Server Component; фетчит `social_vk/telegram/youtube` и `*_icon` из таблицы `settings`
- [x] `layout.css` — `.footer-inner` padding-top: 229px (поднято содержимое); `.site-footer` min-height: 124px (убрано лишнее пространство снизу)
- [x] `Footer.tsx` — обновлены тексты принципов: «Открытость», «Историческая основа», «Гармоничность» (переименован с «Устойчивость»)
- [x] `Footer.tsx` + `layout.css` — социальные иконки перенесены из `.footer-brand` в отдельный 5-й столбец `.footer-inner` grid; `.social` — standalone flex-column; `.social-row` — flex-row для иконок
- [x] `layout.css` — `.social a` убраны border/background (окружности удалены); `.social svg` — 40×40 fill currentColor; viewBox скорректированы для VK (`0.4 1.6 28 28`) и Telegram (`-1.7 0.2 28 28`)
- [x] `MapSection.tsx` — кнопка «Поддержать проект» под статистикой (после `</dl>`), открывает `SupportModal` без привязки к объекту
- [x] `src/app/api/admin/settings/route.ts` — `ALLOWED_KEYS` и Zod-схема расширены: `social_vk`, `social_telegram`, `social_youtube`, `social_vk_icon`, `social_telegram_icon`, `social_youtube_icon`
- [x] `src/app/(admin)/admin/settings/page.tsx` — запрос расширен: +6 социальных ключей; `initialSettings` содержит все URL + icon URL
- [x] `SettingsManager.tsx` — вкладка «Соцсети»: поля URL + загрузка иконок (PNG/SVG/WebP/JPEG) в Storage `covers/settings/social_{network}_{ts}.ext`; превью иконки + кнопка очистки; `useRef` для 3 скрытых file input
- [x] Supabase Storage `covers` bucket — добавлен `image/svg+xml` в `allowed_mime_types` через SQL (Supabase MCP)

### Историческая справка для слотов (2026-05-28)
- [x] `supabase/migrations/20260528000002_slots_historical_note.sql` — ADD COLUMN `historical_note JSONB` в `slots`
- [x] `src/app/api/admin/objects/[id]/slots/route.ts` — Zod-схема POST расширена: `historical_note`
- [x] `src/app/api/admin/objects/[id]/slots/[slotId]/route.ts` — Zod-схема PATCH расширена: `historical_note`
- [x] `src/components/features/DonateModal.tsx` — тип `SlotForDonate` расширен: `historical_note`
- [x] `src/app/(public)/objects/[slug]/page.tsx` — `SlotRow` тип + select-запрос + маппинг расширены: `historical_note`
- [x] `src/components/features/SlotsSection.tsx` — аккордеон `HistoricalNoteAccordion` под каждым слотом; проверка `hasContent()` — не показывать если пусто
- [x] `src/styles/components.css` — `.slot-card { flex-wrap: wrap }` + новый класс `.slot-card-historical-note`
- [x] `src/components/features/admin/SlotsManager.tsx` — `TiptapEditor` для `historical_note` в форме добавления и редактирования слота
- [x] `src/components/features/admin/ObjectEditTabs.tsx` — тип `Slot` расширен: `historical_note`

### ЮMoney вебхук — HMAC-SHA256 + правки донатов (2026-05-29)
- [x] `src/lib/payments/ymoney.ts` — полностью переписан: SHA-1 (`verifyWebhookSignature`, `verifyCardSignature`) удалён; добавлена `verifyNotification(params, secret)` на HMAC-SHA256 (все поля кроме `sign`, сортировка алфавитная, значения `encodeURIComponent`, joined `key=value&`)
- [x] `src/app/api/payments/ymoney/webhook/route.ts` — вызов заменён на `verifyNotification(params, secret)`; ручной парсинг body через `decodeURIComponent` (сохранён `+` в datetime)
- [x] `supabase/migrations/20260529220000_fix_donations_amount_check.sql` — `donations_amount_kopecks_check` изменён с `>= 10000` на `> 0` (ЮMoney удерживает комиссию, реальная сумма < минимума при оплате 100 ₽)
- [x] `supabase/migrations/20260529000001_increment_points_security_definer.sql` — `increment_points` получила `SECURITY DEFINER` (обход RLS при начислении баллов из service-role контекста)
- [x] `src/components/features/admin/DonationsTable.tsx` — «—» → «На развитие Городища» для донатов без объекта; кнопки «Подтвердить» (только pending) и «Удалить» с AlertDialog в каждой строке
- [x] `src/components/features/ChronicleList.tsx` — при `event_type === 'donation'` без `object_name` → «пожертвовал на развитие Городища» вместо «пожертвовал»
- [x] `src/app/api/admin/donations/[id]/route.ts` — **новый роут**: PATCH `{action:'confirm'}` (статус → confirmed, начисляет баллы, обновляет счётчики слота/объекта); DELETE (удаляет донат, откатывает баллы если confirmed)

### Рестайл админки в духе публичного сайта (2026-05-29)
- [x] `src/app/admin.css` — `body` получил тёплый paper-радиальный градиент (совпадает с публичным сайтом); `h1/h2/h3` переключены на `var(--serif)` (Lora); добавлены классы `.admin-brand*`, `.admin-nav-link`, `.admin-nav-active`, `.admin-sidebar-footer-link`
- [x] `src/components/layouts/AdminSidebar.tsx` — все `slate-*`/`bg-white` заменены; добавлен логотип `logo.png` + «Живое Городище» шрифтом Lora (olive-dark) + подпись «Панель администратора»; активный пункт навигации — тёплый olive-фон + золотая левая граница (вертикальный аналог gold-подчёркивания публичной навигации)
- [x] `src/app/(admin)/layout.tsx` — убран `bg-muted/30` (фон теперь единственный источник — `body` в `admin.css`)

### ISR — перенос user-context на клиент (2026-05-30)
- [x] `src/components/layouts/Footer.tsx` — переключён на `createStaticSupabaseClient()` (был скрытым блокером ISR для всех страниц)
- [x] `src/app/(public)/page.tsx` — публичные данные через `createStaticSupabaseClient()`; PlayerHUD данные перенесены в `MapSection` `useEffect`
- [x] `src/app/(public)/objects/[slug]/page.tsx` — `createStaticSupabaseClient()`, убраны `searchParams` и user-запросы; `currentUser` для CommentsSection → клиентский fetch
- [x] `src/app/(public)/chronicle/page.tsx`, `materials/`, `partners/`, `about/`, `privacy/`, `personal-data/` — `createStaticSupabaseClient()`
- [x] `src/components/features/MapSection.tsx` — `useState` + `useEffect` для PlayerHUD: первый рендер показывает «Гость городища», после гидрации обновляется профилем из Supabase
- [x] `src/components/features/CommentsSection.tsx` — клиентский auth fetch в `useEffect`; редактор комментариев появляется после гидрации для авторизованных пользователей
- [x] `src/components/features/DonatedToast.tsx` — `useSearchParams()` в обёртке `<Suspense>` вместо серверного пропа `show`
- [x] `src/components/features/MaterialsClient.tsx` — `isLoggedIn` вычисляется через `useEffect` + Supabase browser client; убран проп из сервер-компонента

**Build output:** `○ /` (5m revalidate), `● /objects/[slug]` (1h SSG, 9 объектов пре-сгенерированы), `○ /chronicle` (1m), `○ /materials` (30m), `○ /partners` (1h), `○ /about/privacy/personal-data` (1h)

### Оптимизация производительности (2026-05-30)
- [x] `src/middleware.ts` — `getUser()` вызывается только для `/admin` и `/profile`; публичные маршруты используют `getSession()` (локальная JWT-проверка, без network round-trip) → −40–60 мс на каждый запрос к `/`, `/objects/*`, `/chronicle` и др.
- [x] `next.config.ts` — `compress: true` (gzip HTML/CSS/JS), `images.remotePatterns` для `*.supabase.co`, `formats: ['image/avif', 'image/webp']`
- [x] `src/components/features/MapSection.tsx` — `fetchPriority="high"` на карту поселения (LCP); `loading="lazy"` на аватар пользователя, фото выбранного объекта, обложки карточек и новостей
- [x] `src/app/(public)/objects/[slug]/page.tsx` — `fetchPriority="high"` на hero-изображение; `generateStaticParams` (pre-define slugs); `export const revalidate = 3600`
- [x] `src/app/(public)/page.tsx` — `export const revalidate = 300` (заготовка ISR)
- [x] `src/app/(public)/chronicle/page.tsx` — `export const revalidate = 60`
- [x] `src/app/(public)/partners/page.tsx` — `export const revalidate = 3600`
- [x] `src/app/(public)/materials/page.tsx` — `export const revalidate = 1800`
- [x] `src/app/(public)/news/[slug]/page.tsx` — `export const revalidate = 3600`
- [x] `CommentsSection.tsx` — `CommentEditor` загружается через `next/dynamic` с `ssr: false` → TipTap (~150 KB) не входит в начальный бандл
- [x] `CommentsSection.tsx` — Realtime INSERT: вместо `fetchPage(1)` — однострочный запрос по `id` + prepend в state → 0 лишних сетевых запросов при новом комментарии

**Примечание ISR:** на момент коммита страницы оставались `ƒ (Dynamic)` — исправлено в следующем коммите (ISR рефактор, 2026-05-30).

### Мобильная адаптация и UI-правки (2026-05-29)
- [x] Аудит мобильной версии через Playwright (viewport 390×844, iPhone 14) — найдено 7 проблем
- [x] `src/styles/responsive.css` — Fix 1: `.about-principles` — 2-col на 920px, 1-col на 760px (было 3-col без override → нечитаемые 107px)
- [x] `src/styles/responsive.css` — Fix 2: `mask-image` fade правого края `.navigation` (fade подсказывает о горизонтальной прокрутке)
- [x] `src/styles/responsive.css` — Fix 3: `.camp-card-body { flex-direction: column }`, кнопка заезда на всю ширину
- [x] `src/styles/responsive.css` — Fix 4: легенда карты — `flex-wrap: wrap`, все 4 статуса видны (было `display: none` на 3-м и 4-м)
- [x] `src/styles/responsive.css` — Fix 5: Player HUD показывает баллы + рубли (было только баллы: `span + span { display: none }` → `span:nth-child(n+3) { display: none }`)
- [x] `src/styles/responsive.css` — Fix 6: новый `@media (max-width: 480px)` — `.modal-actions { flex-direction: column-reverse }` (кнопки модала в стак)
- [x] `src/styles/responsive.css` — Fix 7: `.auth-card` padding 40px 40px → 32px 24px на экранах ≤430px
- [x] `src/styles/components.css` — `.object-card { display: flex; flex-direction: column }` — убран 10px просвет над картинкой (Chromium block-flow bug в `<button>`)
- [x] `src/components/features/PartnersClient.tsx` — кнопка «Подать заявку» отцентрована (`display: block; width: fit-content; margin: 0 auto`)
- [x] `src/app/(auth)/auth/register/page.tsx` + `src/styles/components.css` — обязательный чекбокс согласия на обработку персональных данных; ссылка ведёт на `/personal-data` (открывается в новой вкладке); валидация блокирует отправку без галочки

## В работе
_(пусто)_

### Авторизация: 3-дневная скользящая сессия (2026-06-01)
- [x] `src/middleware.ts` — константа `THREE_DAYS_SECONDS`; в `setAll` переопределён `maxAge`; rolling-блок: при каждом запросе от авторизованного пользователя куки `sb-*-auth-token` переставляются с `maxAge = 259200` (3 дня от текущего момента)
- [x] `src/lib/supabase/server.ts` — аналогичное переопределение `maxAge` в `setAll` для серверных операций (update-password, email confirmation)

### Баг-фикс: волонтёрские дни пропали (2026-05-30)
- [x] `supabase/migrations/20260530000001_volunteer_days_rpc.sql` — RPC `get_volunteer_days_total()` (SECURITY DEFINER, GRANT TO anon/authenticated)
- [x] `src/app/(public)/page.tsx` — прямой запрос к `volunteer_applications` заменён на `supabase.rpc('get_volunteer_days_total')`

### UX-улучшения (2026-05-30)

**Блок D — Auth и базовые UX-исправления:**
- [x] `src/app/(auth)/layout.tsx` — кнопка «← Живое Городище» (fixed top-left) на всех auth-страницах
- [x] `src/styles/components.css` — `.auth-back-link`, `.auth-layout-wrapper`, `.password-field-wrap`, `.password-toggle`; фикс: `settlement.jpg` → `settlement.png` (404 console error)
- [x] `src/app/(auth)/auth/login/page.tsx` + `register/page.tsx` — тогл «показать/скрыть пароль» (Eye/EyeOff из lucide-react)
- [x] `src/components/features/MapSection.tsx` — кнопка «Вся летопись и новости →» после секции новостей
- [x] `src/components/features/MaterialsClient.tsx` — кнопка «Предложить материал» (было «Пожертвовать»)
- [x] `src/app/(public)/volunteers/page.tsx`, `materials/page.tsx` — метатеги `title` + `description`
- [x] `src/app/(public)/objects/[slug]/page.tsx` — `generateMetadata` с именем объекта в title

**Блок C — Подписка только проектная:**
- [x] `SubscribeSectionClient` отсутствует на страницах объектов (подтверждено); единая точка — кнопка «Поддержать проект» на главной с `object_id = null`

**Блок F — UX-полировка:**
- [x] `src/components/features/VolunteersClient.tsx` — гостевой auth-prompt (баннер с кнопками Войти/Зарегистрироваться вместо тихого редиректа); tooltip на disabled-кнопке закрытого заезда
- [x] `src/components/features/MaterialsClient.tsx` — аналогичный auth-prompt
- [x] `src/components/features/MapSection.tsx` — `selectedId = null` по умолчанию; левая панель показывает placeholder «Выберите объект на карте»
- [x] `src/components/features/ChronicleList.tsx` — счётчик событий в активном фильтре `(N)`; пустое состояние с CTA «Стать участником»; склонение слова «событие»
- [x] `src/components/features/ScrollToTop.tsx` — новый компонент; плавающая кнопка «↑» после 500px скролла
- [x] `src/app/(public)/layout.tsx` — добавлен `<ScrollToTop />`
- [x] `src/styles/responsive.css` — fade-mask на `.filters` при `max-width: 920px`

**Блок E — Мобильная навигация:**
- [x] `src/components/layouts/Header.tsx` — бургер-меню (Menu/X из lucide-react), drawer с 6 nav-ссылками + CTA «Стать участником»; закрытие по outside click и по навигации
- [x] `src/styles/layout.css` — `.nav-burger`, `.nav-drawer`, `.nav-drawer-link`, `.nav-drawer-cta`
- [x] `src/styles/responsive.css` — на `≤760px`: `.navigation { display: none }`, `.nav-burger { display: flex }`, `header-inner` 3-column; E2: tap-targets хотспотов ≥44px; E3: footer скрывает принципы

**Блок B — Sequential slots:**
- [x] `src/components/features/DonateModal.tsx` — тип `SlotForDonate` расширен: `is_locked?`, `prev_slot_name?`
- [x] `src/app/(public)/objects/[slug]/page.tsx` — вычисление `is_locked` на сервере: слот N заблокирован если слот N-1 не заполнен (sort_order уже был в таблице)
- [x] `src/components/features/SlotsSection.tsx` — locked-слоты: 50% opacity, граyscale 0.3, иконка Lock, текст «Откроется после завершения "X"»; кнопка не рендерится
- [x] `src/styles/components.css` — `.slot-card--locked`, `.slot-locked-hint`

**Блок A — Новый лейаут страницы объекта:**
- [x] `src/components/features/ObjectsGrid.tsx` — новый компонент: сетка всех объектов с выделением текущего; `<Link>` навигация (Next.js soft nav)
- [x] `src/app/(public)/objects/[slug]/page.tsx` — запрос всех объектов в `Promise.all`; `ObjectsGrid` между прогресс-баром и слотами
- [x] `src/styles/components.css` — `.objects-grid-section`, `.objects-grid-track`, `.object-grid-card`, `.object-grid-card--active` и смежные классы

**Причина:** ISR-рефактор (2026-05-30) переключил `page.tsx` на `createStaticSupabaseClient()` (anon-ключ). RLS-политика `vol_apps_select_own` требует `auth.uid() = user_id` — анонимный клиент получал 0 строк. RPC с `SECURITY DEFINER` обходит RLS и возвращает только агрегат без раскрытия личных данных.

### Баг-фикс: CSS cascade в production webpack (2026-05-30)

- [x] `src/styles/map.css` — перенесены адаптивные блоки `@media (max-width: 1399px)` и `@media (max-width: 760px)` для `.settlement-map`, `.map-canvas`, `.player-hud`, `.hotspot*`, `.zoom`, `.legend` из `responsive.css` в `map.css`
- [x] `src/styles/responsive.css` — удалены дублирующиеся map-специфичные правила; добавлен `grid-template-rows: auto` в `.header-inner` на ≤760px (сброс пустой 48px строки скрытой навигации)

**Причина:** Next.js production webpack разбивает CSS на чанки и загружает `map.css` отдельным `<link>` **после** основного бандла (который содержит `responsive.css`). Базовые правила `map.css` без медиазапроса перебивали мобильные переопределения из `responsive.css` — player-hud получал десктопные размеры (`top:52px`, `min-width:666px`), карта растягивалась на `max(748px, 100svh-76px)`. Решение: все правила карты в одном файле → в одном чанке → правильный каскад.

### UX: карусель «Другие объекты городища» на мобиле (2026-05-30)

- [x] `src/styles/responsive.css` — на `≤760px` блок `.objects-grid-section` выходит за padding страницы (отрицательные margin), `.objects-grid-track` переключается с `display:grid` на `flex / overflow-x:auto / scroll-snap-type:x mandatory`, карточки `.object-grid-card` фиксируются на `min(63vw, 220px)` с `scroll-snap-align:start`; правый fade-gradient подсказывает о прокрутке
- Desktop-сетка (`grid auto-fill minmax(180px,1fr)`) не тронута

### Полный security-аудит и исправления (2026-05-30)

**КРИТИЧНО:**
- [x] `src/lib/payments/ymoney.ts` — timing-safe HMAC сравнение (`crypto.timingSafeEqual` вместо `===`)
- [x] `src/app/api/cron/subscriptions/route.ts` — timing-safe сравнение `CRON_SECRET`
- [x] `src/app/api/payments/ymoney/webhook/route.ts` — startup-assertion на `YMONEY_NOTIFICATION_SECRET`
- [x] `supabase/migrations/20260530000002_restrict_secret_settings.sql` — `ymoney_notification_secret` и `ymoney_wallet` скрыты от публичного SELECT
- [x] `src/lib/rateLimit.ts` — IP-based sliding window rate limiter
- [x] Rate limiting применён: `donations/initiate` (10/min), `partner-applications` (3/10min), `material-applications` (5/min), `volunteer-applications` (5/min)

**ВЫСОКИЙ:**
- [x] `next.config.ts` — HTTP security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy, CSP
- [x] `src/app/api/admin/map/image/route.ts` — валидация magic bytes (PNG/JPEG/WebP), `contentType` из bytes, не из `file.type`
- [x] `supabase/migrations/20260530000003_profiles_restrict_update_columns.sql` — `WITH CHECK` блокирует самоэскалацию роли через RLS
- [x] `supabase/migrations/20260530000004_apply_volunteer_atomic.sql` — функция `apply_volunteer_atomic()` исключает race condition при записи на заезд
- [x] `src/app/api/volunteer-applications/route.ts` — переведён на `rpc('apply_volunteer_atomic')`
- [x] `supabase/migrations/20260530000005_material_apps_points_cap.sql` — `CHECK (points_awarded <= 100000)` на material_applications и volunteer_applications
- [x] `src/app/api/admin/material-applications/[id]/route.ts` — Zod `.max(100_000)` на `points_awarded`
- [x] `supabase/migrations/20260530000006_admin_audit_log.sql` — таблица `admin_audit_log` (INSERT — service_role, SELECT — admin)
- [x] `src/lib/admin/auditLog.ts` — утилита `logAdminAction()`; вызывается в: `donations/[id]` (confirm/delete), `users/[id]` (set_role), `donations/manual`, `material-applications/[id]` (received)

**СРЕДНИЙ:**
- [x] `src/app/api/profile/certificate/route.ts` — SSRF-защита: проверка hostname против `PDF_SERVICE_ALLOWED_HOSTS`
- [x] `supabase/migrations/20260530000007_fix_comment_photos_ban.sql` — Storage RLS `comment-photos` проверяет бан-статус пользователя
- [x] `src/app/api/track-view/route.ts` — rate limiting (20/min), поддержка `X-Internal-Secret`, timing-safe сравнение
- [x] `src/middleware.ts` — исправлен URL (был `/api/objects/${slug}/view` — несуществующий путь); добавлен `X-Internal-Secret` в fire-and-forget
- [x] `supabase/migrations/20260530000008_comments_explicit_no_delete.sql` — явная `USING (false)` политика DELETE + COMMENT ON TABLE

**ENV-переменные (добавить в Vercel):** `INTERNAL_CALL_SECRET`, `PDF_SERVICE_ALLOWED_HOSTS`

---

### NPC-туториал «Ведун» (2026-06-01)
- [x] `src/lib/tutorial/steps.ts` — 8 шагов туториала с CSS-селекторами и текстами NPC
- [x] `src/components/features/NPCDialog.tsx` — диалоговое окно NPC: портрет (fallback иконка), речь, точки прогресса, кнопки «Начать/Далее/Назад/Пропустить», CTA на финале
- [x] `src/components/features/TutorialOverlay.tsx` — spotlight-движок: `.tutorial-spotlight` через box-shadow, click-catcher, localStorage-персистентность, Escape-закрытие, resize/scroll ремер
- [x] `src/styles/components.css` — `.npc-dialog-wrap`, `.npc-dialog`, `.tutorial-spotlight`, `.tutorial-click-catcher`, `.tutorial-replay-btn` + адаптив ≤760px
- [x] `src/components/features/MapSection.tsx` — `<TutorialOverlay />` интегрирован; кнопка «?» в player-hud для повтора туториала
- [x] Протестировано Playwright: desktop 1440px + mobile 390px; spotlight на `.feature`, `.player-hud`, `.support`, `.right-rail` работает; localStorage-персистентность, Escape, replay — всё проверено
- **Примечание:** портрет `/public/npc/elder.png` — заглушка (показывается fallback иконка User); подставить готовый арт без изменения кода
- **Примечание:** NPC-компонент спроектирован с `mode: 'tutorial' | 'quest'` для будущей системы квестов

## Следующее (по порядку из SPEC)

_(все основные US реализованы)_

---

## Технический долг
- [x] Заменить `src/types/database.ts` заглушку (сгенерировано через Supabase MCP 2026-05-27, все 19 таблиц + 4 функции)
- [x] Добавить `middleware.ts` для защиты маршрутов `/profile`, `/admin` (сделано в Auth-этапе)
- [x] Применить миграции `000001` и `000002` к Supabase (применены через Supabase MCP 2026-05-27)
- [x] Chronicle и новости на главной — заменены на реальные данные Supabase (US-010)
- [x] Статистика в правой панели — подключена к реальным данным Supabase (2026-05-28)
- [ ] Email-уведомления (`donation_confirmed`, `new_title`) — после подключения Resend (US-007)
- [x] ISR для публичных страниц — user-context перенесён на клиент; `createStaticSupabaseClient()` во всех публичных страницах и Footer → `/` (5m), `/objects/[slug]` SSG (1h), `/chronicle` (1m), `/materials` (30m), `/partners` (1h), `/about/privacy/personal-data` (1h)
- [x] Тестирование webhook с реальным ЮMoney — HMAC-SHA256 верифицирован (`match: true`), донат автоматически подтверждён (2026-05-29)
