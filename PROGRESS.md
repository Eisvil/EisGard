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
- [x] `src/app/api/profile/route.ts` — GET (profile + title + next_title + skills + stats), PATCH (full_name, birth_date, in_chronicle, skill_ids)
- [x] `src/app/api/profile/certificate/route.ts` — POST: proxy-заглушка на PDF_SERVICE_URL, при отсутствии → 503
- [x] `src/components/features/ProfileHero.tsx` — аватар (placeholder с инициалом), ФИО, титул-badge, баллы
- [x] `src/components/features/TitleProgress.tsx` — прогресс до следующего титула / «Высший статус достигнут»
- [x] `src/components/features/DonationsTable.tsx` — таблица подтверждённых пожертвований
- [x] `src/components/features/VolunteerTable.tsx` — таблица волонтёрских заявок
- [x] `src/components/features/MaterialsDonationsTable.tsx` — таблица заявок на материалы
- [x] `src/components/features/CertificateButton.tsx` — скачивание PDF, loading state, ошибка при 503
- [x] `src/components/features/ProfileEditForm.tsx` — форма редактирования (ФИО, дата рождения, навыки, летопись), PATCH + router.refresh()
- [x] `src/app/(cabinet)/profile/page.tsx` — переписан: Promise.all, все секции, статистика (пожертвовано / дней / материалов)
- [x] `src/styles/components.css` — стили: `.profile-hero`, `.profile-avatar`, `.profile-title-badge`, `.profile-points`, `.title-progress-wrap`, `.profile-stats`, `.cert-btn`, `.history-table`, `.profile-edit-form`

**ENV:** `PDF_SERVICE_URL` — добавить в `.env.local` и Vercel при подключении VPS.

## В работе
_(пусто)_

---

## Следующее (по порядку из SPEC)

| # | User Story | Основные таблицы |
|---|-----------|-----------------|
| US-008 | Admin: управление объектами и слотами | `objects`, `slots` |
| US-010 | Летопись и новости | `chronicle_events`, `news` |
| US-011 | Admin: создание новости (Tiptap) | `news` |
| US-012 | Admin: волонтёрский заезд | `volunteer_camps` |
| US-013 | Admin: ручной донат (Т-Банк/Сбер) | `donations` |
| US-015 | Admin: пользователи и роли | `profiles` |

---

## Технический долг
- [x] Заменить `src/types/database.ts` заглушку (сгенерировано через Supabase MCP 2026-05-27, все 19 таблиц + 4 функции)
- [x] Добавить `middleware.ts` для защиты маршрутов `/profile`, `/admin` (сделано в Auth-этапе)
- [x] Применить миграции `000001` и `000002` к Supabase (применены через Supabase MCP 2026-05-27)
- [ ] Chronicle и новости на главной пока со статичными данными — заменить на Supabase-запросы
- [ ] Статистика в правой панели (1248 участников и т.д.) — пока захардкожена
- [ ] Email-уведомления (`donation_confirmed`, `new_title`) — после подключения Resend (US-007)
- [ ] Тестирование webhook с реальным ЮMoney (env-переменные добавлены, нужен реальный платёж)
