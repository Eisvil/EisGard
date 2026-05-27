# Живое Городище — Техническая спецификация

> Версия: 2.0 | Дата: 2026-05-27 | Статус: Production-ready

---

## 0. Обзор проекта

### Что это
«Живое Городище» — веб-платформа коллективного строительства аутентичного славянского
поселения X–XIII вв. на Псковской земле. Пользователи жертвуют деньги, материалы, труд
или партнёрский ресурс в конкретные объекты через интерактивную карту и получают
накапливаемый статус в летописи проекта.

### Стек
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend:** Supabase (PostgreSQL 15, Auth, RLS, Storage, Realtime)
- **Деплой:** Vercel (фронт), Beget VPS (Node.js — webhook ЮMoney, PDF, email, cron)
- **Платежи:** ЮMoney (разовые quickpay + рекуррентные recurring API)
- **Email:** Resend (транзакционные письма, шаблоны React Email)
- **PDF:** pdfkit (сертификаты участника, генерация на VPS)
- **Редактор:** Tiptap (WYSIWYG для новостей, описаний объектов, статичных страниц)

### Роли пользователей

| Роль | Описание | Доступ |
|------|----------|--------|
| `guest` | Неавторизованный посетитель | Просмотр карты, объектов, летописи, новостей; форма доната без аккаунта |
| `user` | Зарегистрированный участник | Публичные страницы + личный кабинет, заявки, пожертвования |
| `moderator` | Модератор | Как user + обработка заявок; НЕ может менять настройки и роли |
| `admin` | Администратор | Полный доступ включая настройки, роли, ручные доноты, аналитику |

### Маршруты приложения

| Путь | Экран | Доступ |
|------|-------|--------|
| `/` | Главная (карта + летопись + новости) | guest+ |
| `/objects/[slug]` | Страница объекта | guest+ |
| `/volunteers` | Волонтёрам (календарь + форма) | guest+ (форма — user) |
| `/materials` | Материалы (список + форма) | guest+ (форма — user) |
| `/about` | О проекте (статичная) | guest+ |
| `/privacy` | Политика конфиденциальности | guest+ |
| `/personal-data` | Обработка персональных данных | guest+ |
| `/news/[slug]` | Страница новости | guest+ |
| `/chronicle` | Полная летопись | guest+ |
| `/auth/login` | Вход | guest |
| `/auth/register` | Регистрация | guest |
| `/auth/reset` | Восстановление пароля | guest |
| `/auth/update-password` | Новый пароль (из email-ссылки) | guest |
| `/auth/verify-email` | Ожидание подтверждения email | guest |
| `/profile` | Личный кабинет | user+ |
| `/admin` | Дашборд | admin, moderator |
| `/admin/objects` | Управление объектами | admin |
| `/admin/objects/[id]` | Редактор объекта + аналитика | admin |
| `/admin/map` | Конструктор карты | admin |
| `/admin/camps` | Управление заездами | admin, moderator |
| `/admin/applications/volunteers` | Волонтёрские заявки | admin, moderator |
| `/admin/applications/materials` | Заявки на материалы | admin, moderator |
| `/admin/applications/partners` | Партнёрские заявки | admin, moderator |
| `/admin/donations` | Пожертвования + ручное добавление | admin |
| `/admin/news` | Управление новостями | admin, moderator |
| `/admin/news/new` | Создание новости | admin, moderator |
| `/admin/news/[id]/edit` | Редактирование новости | admin, moderator |
| `/admin/users` | Пользователи + роли | admin |
| `/admin/settings` | Настройки системы | admin |

---

## БЛОК 1: User Stories

### US-001: Просмотр карты и выбор объекта
→ Таблицы: `objects` | API: `GET /api/objects` | Экран: `/`

**Как** неавторизованный посетитель,
**я хочу** видеть интерактивную карту и кликать на объекты,
**чтобы** понять, что строится и как помочь.

**Сценарий:**
1. Открывает `/` — карта с хотспотами, подсвеченными по статусу (серый/жёлтый/зелёный/коричневый).
2. Кликает хотспот «Кузница» → левая панель обновляется без перезагрузки.
3. Видит: фото, прогресс-бар 68%, 136 000 / 200 000 ₽, кнопка «Поддержать».
4. «Поддержать» → `/objects/kuznitsa`.

**Критерии приёмки:**
- [ ] Карта загружается < 2 сек.
- [ ] Клик на хотспот обновляет FeaturePanel без перезагрузки.
- [ ] Зум +/− работает 1.0–1.18×.
- [ ] Легенда статусов видна внизу карты.
- [ ] На мобильном (< 760px) боковая панель — под картой.

---

### US-002: Разовое пожертвование
→ Таблицы: `donations`, `slots`, `objects`, `chronicle_events`, `profiles` | API: `POST /api/donations/initiate`, `POST /api/payments/ymoney/webhook` | Экран: `/objects/[slug]`

**Как** зарегистрированный участник,
**я хочу** пожертвовать сумму на конкретный объект,
**чтобы** видеть свой вклад в летописи и получить баллы.

**Сценарий:**
1. На `/objects/kuznitsa` нажимает «Поддержать деньгами».
2. Sheet: сумма (дефолт 1 000 ₽, мин 100 ₽), имя в летописи, чекбокс «Анонимно».
3. «Перейти к оплате» → `POST /api/donations/initiate` → редирект на ЮMoney.
4. Webhook → баллы начислены, летопись обновлена.
5. Return-URL `?donated=true` → Toast «Спасибо!».

**Критерии приёмки:**
- [ ] Минимум 100 ₽; при меньшей — inline-ошибка.
- [ ] Webhook проверяет SHA-1 подпись перед обработкой.
- [ ] Дублирующий webhook (тот же `operation_id`) — идемпотентен, игнорируется.
- [ ] Прогресс-бар обновляется в течение 5 сек после webhook.

---

### US-003: Ежемесячная подписка
→ Таблицы: `subscriptions`, `donations`, `profiles` | API: `POST /api/donations/subscribe`, `DELETE /api/subscriptions/[id]`, cron | Экраны: `/objects/[slug]`, `/profile`

**Как** постоянный донор,
**я хочу** настроить автоматическое ежемесячное пожертвование,
**чтобы** не возвращаться на сайт каждый раз.

**Сценарий:**
1. Нажимает «Ежемесячная поддержка», вводит сумму ≥ 300 ₽, выбирает объект.
2. Редирект на ЮMoney для привязки карты → `recurring_token` сохраняется.
3. Cron 1-го числа каждого месяца списывает по токену.
4. В ЛК — активная подписка и кнопка «Отменить».

**Критерии приёмки:**
- [ ] Минимум 300 ₽/мес.
- [ ] При 2 неудачных списаниях → `status = paused` + email.
- [ ] Отмена мгновенная; следующее списание не происходит.

---

### US-004: Волонтёрская заявка
→ Таблицы: `volunteer_applications`, `volunteer_camps`, `user_skills` | API: `GET /api/volunteer-camps`, `POST /api/volunteer-applications` | Экран: `/volunteers`

**Как** участник клуба реконструкции,
**я хочу** выбрать заезд из календаря и подать заявку,
**чтобы** приехать поработать руками.

**Сценарий:**
1. `/volunteers` — список заездов с датами и числом мест.
2. «Подать заявку» (требует авторизации) → Dialog: навыки, комментарий.
3. Отправка → `status = pending` → email обеим сторонам.
4. Admin одобряет → `status = approved` → email волонтёру.
5. После заезда admin проставляет `days_worked` → `status = completed` → баллы начислены.

**Критерии приёмки:**
- [ ] Нельзя подать две заявки на один заезд (UNIQUE `user_id + camp_id`).
- [ ] При заполненном лимите — кнопка disabled.
- [ ] Баллы начисляются только при `status = completed` + заполнен `days_worked`.

---

### US-005: Заявка на материалы
→ Таблицы: `material_applications`, `materials` | API: `GET /api/materials`, `POST /api/material-applications` | Экран: `/materials`

**Как** участник, готовый привезти стройматериалы,
**я хочу** выбрать нужный материал и оставить контакты,
**чтобы** организаторы связались со мной.

**Сценарий:**
1. `/materials` — список нужных материалов с прогрессом.
2. «Пожертвовать» → Dialog: количество, телефон/Telegram, комментарий.
3. Статус `pending` → уведомление администратору.

**Критерии приёмки:**
- [ ] Форма только для авторизованных.
- [ ] `contact_phone` или `contact_telegram` — хотя бы одно обязательно.
- [ ] Статус «получен» — только admin/moderator.

---

### US-006: Партнёрская заявка
→ Таблицы: `partner_applications`, `object_partners` | API: `POST /api/partner-applications` | Экран: `/` (форма)

**Как** представитель бизнеса,
**я хочу** предложить поддержку материалами или услугами,
**чтобы** организация была публично упомянута на странице объекта.

**Сценарий:**
1. «Партнёрство» (без авторизации) → форма: организация, тип, описание, контакты, объект.
2. Статус `pending` → уведомление администратору.
3. Admin одобряет с `publish_partner: true` → появляется на странице объекта.

**Критерии приёмки:**
- [ ] Форма без авторизации.
- [ ] ИНН — опционально, 10 или 12 цифр.

---

### US-007: Личный кабинет и сертификат
→ Таблицы: `profiles`, `titles`, `donations`, `volunteer_applications`, `material_applications`, `subscriptions` | API: `GET /api/profile`, `POST /api/profile/certificate` | Экран: `/profile`

**Как** участник с накопленными баллами,
**я хочу** видеть весь свой вклад и скачать сертификат.

**Сценарий:**
1. `/profile` — аватар, ФИО, титул «Витязь», 6 740 баллов, прогресс до «Поселенца».
2. Таблицы: история донатов, волонтёрства, материалов, активные подписки.
3. «Скачать сертификат» → PDF на VPS (A4, орнамент в стиле проекта).

**Критерии приёмки:**
- [ ] PDF генерируется < 5 сек; при ошибке — Toast.
- [ ] На максимальном титуле — «Высший статус достигнут».

---

### US-008: Admin управляет объектами и слотами
→ Таблицы: `objects`, `slots` | API: `POST/PATCH/DELETE /api/admin/objects` | Экраны: `/admin/objects`, `/admin/map`

**Как** администратор,
**я хочу** создать объект со слотами и иконкой на карте.

**Сценарий:**
1. `/admin/objects/new` → название, slug, зона, статус, описание (Tiptap), фото, слоты.
2. В `/admin/map` перетаскивает иконку на место.
3. `status: draft → planned` → объект появляется на публичной карте.

**Критерии приёмки:**
- [ ] Slug уникален, автогенерируется, редактируется вручную.
- [ ] Нельзя опубликовать без хотя бы одного слота.
- [ ] Изменение статуса — мгновенно на карте (revalidatePath).
- [ ] Удаление через Dialog; слоты CASCADE.

---

### US-009: Admin начисляет часы волонтёру
→ Таблицы: `volunteer_applications`, `profiles` | API: `PATCH /api/admin/volunteer-applications/[id]` | Экран: `/admin/applications/volunteers`

**Как** бригадир после заезда,
**я хочу** отметить дни каждому участнику,
**чтобы** баллы начислились автоматически.

**Сценарий:**
1. Фильтр по заезду → список одобренных заявок.
2. Вводит `days_worked` → «Завершить» → `status = completed` → баллы → email.

**Критерии приёмки:**
- [ ] `days_worked` не больше длины заезда.
- [ ] Защита от двойного начисления: повторный вызов → 400 `ALREADY_COMPLETED`.

---

### US-010: Просмотр летописи и новостей
→ Таблицы: `chronicle_events`, `news` | API: `GET /api/chronicle`, `GET /api/news`, `GET /api/news/[slug]` | Экраны: `/`, `/chronicle`, `/news/[slug]`

**Как** посетитель,
**я хочу** читать хронологию событий и новости проекта.

**Критерии приёмки:**
- [ ] Летопись обновляется в реальном времени (Supabase Realtime).
- [ ] Анонимные доноты — «Аноним пожертвовал X ₽».
- [ ] Неопубликованные новости не видны публично.

---

### US-011: Admin создаёт и публикует новость
→ Таблицы: `news` | API: `POST/PATCH/DELETE /api/admin/news` | Экраны: `/admin/news`, `/news/[slug]`

**Как** администратор,
**я хочу** создать новость с Tiptap-редактором, фото и тегом.

**Сценарий:**
1. `/admin/news/new` → заголовок, summary (≤500 симв., для главной), body (Tiptap), обложка, тег.
2. «Черновик» → `published: false`. Предпросмотр `/news/[slug]?preview=true`.
3. «Опубликовать» → `published: true` → revalidatePath.

**Критерии приёмки:**
- [ ] Slug: транслит + дефисы ≤80 симв.; коллизия → `-2`, `-3`.
- [ ] Tiptap: H2/H3, жирный, курсив, ссылки, изображения в Storage `news-images`, embed-видео.
- [ ] Удалить можно только черновик.

---

### US-012: Admin создаёт волонтёрский заезд
→ Таблицы: `volunteer_camps` | API: `POST/PATCH/DELETE /api/admin/camps` | Экраны: `/admin/camps`, `/volunteers`

**Как** администратор,
**я хочу** создать заезд с диапазоном дат и лимитом мест.

**Сценарий:**
1. `/admin/camps` → Dialog: название, дата с/по, максимум участников (дефолт 20).
2. Заезд появляется в публичном календаре `/volunteers`.
3. «Закрыть набор» → `is_open: false` → кнопка на сайте disabled.

**Критерии приёмки:**
- [ ] `date_to >= date_from` — фронт + DB CHECK.
- [ ] Параллельные заезды разрешены.
- [ ] Нельзя удалить заезд с одобренными заявками.

---

### US-013: Admin подтверждает ручной донат (Т-Банк / Сбер)
→ Таблицы: `donations`, `slots`, `objects`, `chronicle_events`, `profiles` | API: `POST /api/admin/donations/manual` | Экран: `/admin/donations`

**Как** администратор, получивший банковский перевод,
**я хочу** зарегистрировать платёж вручную.

**Сценарий:**
1. `/admin/donations` → «Добавить вручную» → Dialog.
2. Поля: источник (Т-Банк / Сбер / Наличные), сумма, дата, имя, email (опц.), объект, слот, анонимно.
3. «Подтвердить» → donation `confirmed` → `awardPoints()` (если email найден) → прогрессы обновлены → летопись → email.

**Критерии приёмки:**
- [ ] Если email совпадает с профилем — баллы начисляются автоматически.
- [ ] Если email не найден — donation с `user_id = NULL`, имя в летописи из `display_name`.
- [ ] Ручной донат помечен иконкой в таблице.
- [ ] Нельзя добавить донат < 100 ₽.

---

### US-014: Admin обрабатывает заявку на материалы
→ Таблицы: `material_applications`, `materials`, `profiles` | API: `PATCH /api/admin/material-applications/[id]` | Экран: `/admin/applications/materials`

**Как** администратор,
**я хочу** менять статус заявки и начислять баллы при получении.

**Сценарий:**
1. «Связались» → `status: contacted`. «Получен» → Dialog: `actual_qty`, `points_awarded`.
2. Подтверждение → DB-триггер обновляет `materials.received_qty` → `awardPoints()`.

**Критерии приёмки:**
- [ ] Флоу: `pending → contacted/not_contacted → received/cancelled`.
- [ ] `received` невозможен без `actual_qty`.
- [ ] `materials.received_qty` обновляется через DB-триггер.

---

### US-015: Admin управляет пользователями
→ Таблицы: `profiles` | API: `GET /api/admin/users`, `PATCH /api/admin/users/[id]` | Экран: `/admin/users`

**Как** администратор,
**я хочу** видеть список участников и назначать роль moderator.

**Критерии приёмки:**
- [ ] Нельзя изменить роль другого admin.
- [ ] Нельзя изменить свою роль.
- [ ] Пагинация 50 пользователей на страницу.

---

### US-016: Admin управляет титулами и навыками
→ Таблицы: `titles`, `skills`, `profiles` | API: `POST/PATCH/DELETE /api/admin/titles`, `/api/admin/skills` | Экран: `/admin/settings`

**Как** администратор,
**я хочу** создавать, редактировать и удалять титулы и навыки.

**Критерии приёмки:**
- [ ] Нельзя удалить титул, назначенный пользователям.
- [ ] Изменение порога → автоматический `recalcAllTitles()`.
- [ ] Порядок титулов — drag-and-drop по `sort_order`.
- [ ] Нельзя удалить навык у активных пользователей.

---

### US-017: Admin редактирует статичные страницы
→ Таблицы: `static_pages` | API: `GET/PATCH /api/admin/static-pages/[slug]` | Экраны: `/admin/settings`, `/about`, `/privacy`

**Как** администратор,
**я хочу** редактировать «О проекте» и юридические страницы без кода.

**Критерии приёмки:**
- [ ] Автосохранение черновика в `localStorage` каждые 30 сек.
- [ ] `/privacy` и `/personal-data` — дополнительный Dialog подтверждения.
- [ ] `revalidatePath` — изменения видны сразу.

---

### US-018: Admin просматривает аналитику объекта
→ Таблицы: `object_views`, `donations` | API: `GET /api/admin/objects/[id]/analytics` | Экран: `/admin/objects/[id]`

**Как** администратор,
**я хочу** видеть просмотры, доноты и конверсию по каждому объекту.

**Критерии приёмки:**
- [ ] 1 IP за сутки = 1 просмотр (UNIQUE `object_id + ip_hash + date`).
- [ ] Конверсия = `donations_count / views_count * 100`, до 1 знака.
- [ ] Кеш ответа 10 минут.


---

## БЛОК 2: Data Model

### Диаграмма связей

```
auth.users  1──1  profiles
profiles    N──M  skills              (через user_skills)
profiles    1──1  titles              (profiles.title_id FK → ON DELETE SET NULL)
profiles    1──N  donations           (user_id → ON DELETE SET NULL)
profiles    1──N  volunteer_applications
profiles    1──N  material_applications
profiles    1──N  subscriptions
profiles    1──N  object_views

objects     1──N  slots               (ON DELETE CASCADE)
objects     1──N  donations           (object_id → ON DELETE SET NULL)
objects     1──N  material_applications
objects     1──N  chronicle_events
objects     1──N  object_partners
objects     1──N  object_views

volunteer_camps   1──N  volunteer_applications  (camp_id → ON DELETE CASCADE)
materials         1──N  material_applications   (material_id → ON DELETE RESTRICT)
partner_applications 1──1 object_partners       (создаётся при одобрении)
```

---

### `profiles`
```sql
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  birth_date   DATE,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'user'
                 CHECK (role IN ('user','moderator','admin')),
  title_id     UUID REFERENCES titles(id) ON DELETE SET NULL,
  points       INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  in_chronicle BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_profiles_role   ON profiles(role);
CREATE INDEX idx_profiles_points ON profiles(points DESC);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Автосоздание профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name','Участник'));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Атомарное начисление баллов (вызывается из awardPoints())
CREATE OR REPLACE FUNCTION increment_points(p_user_id UUID, p_points INTEGER)
RETURNS profiles LANGUAGE plpgsql AS $$
DECLARE result profiles;
BEGIN
  UPDATE profiles SET points = points + p_points
  WHERE id = p_user_id RETURNING * INTO result;
  RETURN result;
END;
$$;

-- Пересчёт всех титулов (вызывается из recalcAllTitles())
CREATE OR REPLACE FUNCTION recalc_all_titles()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles SET title_id = (
    SELECT id FROM titles
    WHERE min_points <= profiles.points
    ORDER BY min_points DESC LIMIT 1
  );
END;
$$;
```

---

### `titles`
```sql
CREATE TABLE titles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 60),
  min_points  INTEGER NOT NULL DEFAULT 0 CHECK (min_points >= 0),
  description TEXT,
  privileges  TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_titles_min_points ON titles(min_points ASC);
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "titles_select_public" ON titles FOR SELECT USING (true);
CREATE POLICY "titles_all_admin"     ON titles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE TRIGGER titles_updated_at BEFORE UPDATE ON titles
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

INSERT INTO titles (name, min_points, description, privileges, sort_order) VALUES
  ('Странник',  0,    'Только начинает путь',         'Доступ к летописи',               1),
  ('Доброхот',  1000, 'Внёс первый вклад',            'Именной сертификат',              2),
  ('Витязь',    2000, 'Верный участник',               'Бесплатный вход раз в год',       3),
  ('Поселенец', 5000, 'Один из основателей городища', 'Бесплатное проживание до 7 дней', 4);
```

---

### `skills`
```sql
CREATE TABLE skills (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 80),
  category   TEXT NOT NULL DEFAULT 'general'
               CHECK (category IN ('craft','building','farming','cooking','other','general')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_select_public" ON skills FOR SELECT USING (true);
CREATE POLICY "skills_all_admin"     ON skills FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO skills (name, category, sort_order) VALUES
  ('Кузнечное дело','craft',1),('Плотницкое дело','building',2),
  ('Гончарство','craft',3),('Огородничество','farming',4),
  ('Готовка на огне','cooking',5),('Кладка из камня','building',6),
  ('Ткачество','craft',7),('Кожевенное дело','craft',8);
```

---

### `user_skills`
```sql
CREATE TABLE user_skills (
  user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id)   ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_skills_select_public" ON user_skills FOR SELECT USING (true);
CREATE POLICY "user_skills_manage_own"    ON user_skills FOR ALL USING (auth.uid() = user_id);
```

---

### `objects`
```sql
CREATE TABLE objects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  short_name       TEXT CHECK (char_length(short_name) <= 30),
  zone             TEXT NOT NULL
                     CHECK (zone IN ('craft','public','farming','military','residential')),
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','planned','building','done','working')),
  description      JSONB,          -- Tiptap JSON
  historical_note  JSONB,          -- Tiptap JSON
  cover_url        TEXT,           -- Supabase Storage bucket 'objects'
  icon_key         TEXT,           -- forge/gardens/huts/coop/training/tavern/shed/pottery/guardhouse
  map_position_x   NUMERIC(5,2),  -- % от ширины карты (0–100)
  map_position_y   NUMERIC(5,2),  -- % от высоты карты (0–100)
  total_goal_rub   INTEGER NOT NULL DEFAULT 0,  -- в копейках
  total_raised_rub INTEGER NOT NULL DEFAULT 0,  -- в копейках; обновляется updateObjectProgress()
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_objects_status ON objects(status);
CREATE INDEX idx_objects_zone   ON objects(zone);
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objects_select_public" ON objects FOR SELECT USING (status != 'draft');
CREATE POLICY "objects_all_admin"     ON objects FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER objects_updated_at BEFORE UPDATE ON objects
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### `slots`
```sql
CREATE TABLE slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id     UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  slot_type     TEXT NOT NULL CHECK (slot_type IN ('money','materials','labor')),
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  goal_value    INTEGER NOT NULL CHECK (goal_value > 0),
  unit          TEXT NOT NULL DEFAULT 'RUB',  -- 'RUB','pcs','hours','kg','m3'
  current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  is_closed     BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_slots_object_id ON slots(object_id);
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slots_select_public" ON slots FOR SELECT USING (true);
CREATE POLICY "slots_all_admin"     ON slots FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE TRIGGER slots_updated_at BEFORE UPDATE ON slots
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### `donations`
```sql
CREATE TABLE donations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  object_id           UUID REFERENCES objects(id)  ON DELETE SET NULL,
  slot_id             UUID REFERENCES slots(id)    ON DELETE SET NULL,
  amount_kopecks      INTEGER NOT NULL CHECK (amount_kopecks >= 10000),
  display_name        TEXT NOT NULL DEFAULT '',
  is_anonymous        BOOLEAN NOT NULL DEFAULT false,
  source              TEXT NOT NULL DEFAULT 'ymoney'
                        CHECK (source IN ('ymoney','tbank','sber','manual')),
  ymoney_operation_id TEXT UNIQUE,  -- идемпотентность webhook
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','failed','refunded')),
  points_awarded      INTEGER NOT NULL DEFAULT 0,
  subscription_id     UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_donations_user_id   ON donations(user_id);
CREATE INDEX idx_donations_object_id ON donations(object_id);
CREATE INDEX idx_donations_status    ON donations(status);
CREATE INDEX idx_donations_ymoney_op ON donations(ymoney_operation_id)
  WHERE ymoney_operation_id IS NOT NULL;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_select_own"              ON donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "donations_select_public_confirmed" ON donations FOR SELECT
  USING (status = 'confirmed' AND is_anonymous = false);
CREATE POLICY "donations_insert_any"              ON donations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "donations_all_admin"               ON donations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER donations_updated_at BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### `subscriptions`
```sql
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  object_id         UUID REFERENCES objects(id) ON DELETE SET NULL,
  amount_kopecks    INTEGER NOT NULL CHECK (amount_kopecks >= 30000),
  ymoney_token      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paused','cancelled','payment_failed')),
  failed_attempts   INTEGER NOT NULL DEFAULT 0,
  next_payment_date DATE NOT NULL,
  last_payment_date DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subs_user        ON subscriptions(user_id);
CREATE INDEX idx_subs_active_next ON subscriptions(next_payment_date) WHERE status = 'active';
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_manage_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_all_admin"  ON subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### `volunteer_camps`
```sql
CREATE TABLE volunteer_camps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  date_from      DATE NOT NULL,
  date_to        DATE NOT NULL CHECK (date_to >= date_from),
  max_volunteers INTEGER NOT NULL DEFAULT 20 CHECK (max_volunteers > 0),
  description    TEXT,
  is_open        BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_camps_date_from ON volunteer_camps(date_from);
ALTER TABLE volunteer_camps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camps_select_public" ON volunteer_camps FOR SELECT USING (true);
CREATE POLICY "camps_all_admin"     ON volunteer_camps FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER volunteer_camps_updated_at BEFORE UPDATE ON volunteer_camps
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### `volunteer_applications`
```sql
CREATE TABLE volunteer_applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  camp_id        UUID NOT NULL REFERENCES volunteer_camps(id) ON DELETE CASCADE,
  object_id      UUID REFERENCES objects(id) ON DELETE SET NULL,
  comment        TEXT CHECK (char_length(comment) <= 1000),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','completed')),
  days_worked    INTEGER CHECK (days_worked >= 0),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, camp_id)
);
CREATE INDEX idx_vol_apps_user   ON volunteer_applications(user_id);
CREATE INDEX idx_vol_apps_camp   ON volunteer_applications(camp_id);
CREATE INDEX idx_vol_apps_status ON volunteer_applications(status);
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vol_apps_select_own" ON volunteer_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vol_apps_insert_own" ON volunteer_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vol_apps_all_admin"  ON volunteer_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER vol_apps_updated_at BEFORE UPDATE ON volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### `material_applications`
```sql
CREATE TABLE material_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id      UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  object_id        UUID REFERENCES objects(id) ON DELETE SET NULL,
  quantity         NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  actual_qty       NUMERIC(10,2) CHECK (actual_qty > 0),  -- заполняет admin при получении
  contact_phone    TEXT CHECK (contact_phone ~ '^\+?[0-9\s\-\(\)]{7,20}$'),
  contact_telegram TEXT,
  comment          TEXT CHECK (char_length(comment) <= 500),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','contacted','not_contacted','received','cancelled')),
  points_awarded   INTEGER NOT NULL DEFAULT 0,
  admin_note       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mat_apps_user     ON material_applications(user_id);
CREATE INDEX idx_mat_apps_status   ON material_applications(status);
CREATE INDEX idx_mat_apps_material ON material_applications(material_id);
ALTER TABLE material_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mat_apps_select_own" ON material_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mat_apps_insert_own" ON material_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mat_apps_all_admin"  ON material_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER mat_apps_updated_at BEFORE UPDATE ON material_applications
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Триггер: автообновление materials.received_qty при смене статуса
CREATE OR REPLACE FUNCTION update_material_received_qty()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'received' AND OLD.status != 'received' THEN
    UPDATE materials
    SET received_qty = received_qty + COALESCE(NEW.actual_qty, NEW.quantity)
    WHERE id = NEW.material_id;
  END IF;
  IF OLD.status = 'received' AND NEW.status = 'cancelled' THEN
    UPDATE materials
    SET received_qty = GREATEST(0, received_qty - COALESCE(NEW.actual_qty, NEW.quantity))
    WHERE id = NEW.material_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER material_app_received
  AFTER UPDATE ON material_applications
  FOR EACH ROW EXECUTE FUNCTION update_material_received_qty();
```

---

### `materials`
```sql
CREATE TABLE materials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  description  TEXT,
  unit         TEXT NOT NULL DEFAULT 'шт',
  needed_qty   NUMERIC(10,2) CHECK (needed_qty > 0),
  received_qty NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  object_id    UUID REFERENCES objects(id) ON DELETE SET NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_select_public" ON materials FOR SELECT USING (is_active = true);
CREATE POLICY "materials_all_admin"     ON materials FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE TRIGGER materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### `partner_applications`
```sql
CREATE TABLE partner_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name      TEXT NOT NULL CHECK (char_length(org_name) BETWEEN 2 AND 200),
  inn           TEXT CHECK (inn ~ '^\d{10}(\d{2})?$'),
  support_type  TEXT NOT NULL CHECK (support_type IN ('money','materials','services','complex')),
  description   TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  contact_name  TEXT NOT NULL CHECK (char_length(contact_name) BETWEEN 2 AND 120),
  contact_email TEXT NOT NULL CHECK (contact_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  contact_phone TEXT,
  object_id     UUID REFERENCES objects(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','contacted','approved','rejected')),
  logo_url      TEXT,
  admin_note    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_partner_apps_status ON partner_applications(status);
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partner_apps_insert_public" ON partner_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "partner_apps_all_admin"     ON partner_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
```

---

### `object_partners`
```sql
-- object_id IS NULL = партнёр всего проекта (показывается на /about)
CREATE TABLE object_partners (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id    UUID REFERENCES objects(id) ON DELETE CASCADE,
  org_name     TEXT NOT NULL,
  logo_url     TEXT,
  support_type TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE object_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "object_partners_select_public" ON object_partners FOR SELECT USING (true);
CREATE POLICY "object_partners_all_admin"     ON object_partners FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

### `chronicle_events`
```sql
CREATE TABLE chronicle_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     TEXT NOT NULL
                   CHECK (event_type IN ('donation','volunteer','material','object_done','manual')),
  user_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  object_id      UUID REFERENCES objects(id)  ON DELETE SET NULL,
  display_name   TEXT NOT NULL DEFAULT '',
  is_anonymous   BOOLEAN NOT NULL DEFAULT false,
  amount_kopecks INTEGER,
  points         INTEGER,
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_chronicle_created ON chronicle_events(created_at DESC);
CREATE INDEX idx_chronicle_object  ON chronicle_events(object_id);
ALTER TABLE chronicle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chronicle_select_public"  ON chronicle_events FOR SELECT USING (true);
CREATE POLICY "chronicle_insert_service" ON chronicle_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "chronicle_all_admin"      ON chronicle_events FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

### `news`
```sql
CREATE TABLE news (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  summary      TEXT CHECK (char_length(summary) <= 500),
  body         JSONB NOT NULL DEFAULT '{}',  -- Tiptap JSON
  cover_url    TEXT,
  tag          TEXT CHECK (char_length(tag) <= 60),
  published    BOOLEAN NOT NULL DEFAULT false,
  author_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_news_published ON news(published_at DESC) WHERE published = true;
CREATE INDEX idx_news_slug      ON news(slug);
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_select_public" ON news FOR SELECT USING (published = true);
CREATE POLICY "news_all_admin"     ON news FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
CREATE TRIGGER news_updated_at BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

---

### `object_views`
```sql
-- Счётчик просмотров для аналитики (US-018). Заполняется middleware (fire-and-forget).
CREATE TABLE object_views (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  ip_hash   TEXT NOT NULL,   -- sha256(ip), сырой IP не хранится (152-ФЗ)
  user_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (object_id, ip_hash, viewed_at)
);
CREATE INDEX idx_object_views_object_date ON object_views(object_id, viewed_at DESC);
ALTER TABLE object_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "object_views_insert_public" ON object_views FOR INSERT WITH CHECK (true);
CREATE POLICY "object_views_select_admin"  ON object_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));
```

---

### `settings`
```sql
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_public" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_all_admin"     ON settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO settings (key, value, description) VALUES
  ('points_per_ruble',           '1',                     'Баллов за 1 рубль пожертвования'),
  ('points_per_day',             '1000',                  'Баллов за 1 день волонтёрства'),
  ('ymoney_notification_secret', '"REPLACE_ME"',          'Секрет для проверки webhook ЮMoney'),
  ('ymoney_wallet',              '"REPLACE_ME"',          'Номер кошелька ЮMoney'),
  ('site_name',                  '"Живое Городище"',      'Название сайта'),
  ('map_image_url',              '"/map/settlement.jpg"', 'URL фоновой карты'),
  ('resend_from_email',          '"noreply@gorodische.ru"','Email отправителя'),
  ('admin_notify_email',         '"admin@gorodische.ru"', 'Email уведомлений администратора');
```

---

### `static_pages`
```sql
CREATE TABLE static_pages (
  slug       TEXT PRIMARY KEY,  -- 'about' | 'privacy' | 'personal-data'
  title      TEXT NOT NULL,
  body       JSONB NOT NULL DEFAULT '{}',  -- Tiptap JSON
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "static_pages_select_public" ON static_pages FOR SELECT USING (true);
CREATE POLICY "static_pages_all_admin"     ON static_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO static_pages (slug, title) VALUES
  ('about',         'О проекте'),
  ('privacy',       'Политика конфиденциальности'),
  ('personal-data', 'Обработка персональных данных');
```

---

## БЛОК 3: API Endpoints

> Все endpoints — Next.js App Router (`/app/api/*/route.ts`).
> Деньги в теле запросов — в **копейках**.
> Ошибка: `{ "error": { "code": "CODE", "message": "Описание" } }`
> Список: `{ "data": [...], "meta": { "total": N, "page": 1, "per_page": 20 } }`

---

### AUTH

#### `POST /api/auth/register`
Таблицы: `auth.users` → триггер → `profiles` | Публичный

**Запрос:** `{ "full_name": "Иван Петров", "email": "ivan@example.com", "password": "securePass1" }`
**201:** `{ "data": { "user_id": "uuid", "email_confirmed": false } }`
**400:** `{ "error": { "code": "VALIDATION_ERROR", "message": "Пароль: минимум 8 символов, одна цифра" } }`
**409:** `{ "error": { "code": "EMAIL_EXISTS", "message": "Этот email уже зарегистрирован" } }`

---

### OBJECTS

#### `GET /api/objects`
Таблицы: `objects` | Публичный | Query: `zone=craft`, `status=building`

**200:**
```json
{ "data": [{ "id":"uuid","slug":"kuznitsa","name":"Кузница","short_name":"Кузница",
  "zone":"craft","status":"building","cover_url":"https://...","icon_key":"forge",
  "map_position_x":57.0,"map_position_y":35.0,
  "total_goal_rub":20000000,"total_raised_rub":13600000,"percent":68 }],
  "meta":{ "total":11,"page":1,"per_page":50 } }
```

---

#### `GET /api/objects/[slug]`
Таблицы: `objects`, `slots`, `object_partners`, `chronicle_events` | Публичный

**200:** полный объект со `slots[]`, `partners[]`, `chronicle[]` (последние 20).
**404:** `{ "error": { "code": "NOT_FOUND", "message": "Объект не найден" } }`

---

#### `POST /api/objects/[slug]/view`
Таблицы: `object_views` | Публичный (вызывается из middleware, fire-and-forget)

**Запрос:** `{ "ip_hash": "sha256hex" }`
**200:** `{}` — ON CONFLICT DO NOTHING; дубли в один день игнорируются автоматически.

---

### NEWS

#### `GET /api/news`
Таблицы: `news` | Публичный | Query: `page=1&per_page=10&tag=РЕМЕСЛО`

**200:** `{ "data": [{ "slug":"...","title":"...","summary":"...","cover_url":"...","tag":"...","published_at":"..." }], "meta":{...} }`

---

#### `GET /api/news/[slug]`
Таблицы: `news` | Публичный (`?preview=true` — только admin)

**200:** `{ "data": { "slug":"...","title":"...","body":{tiptap},"cover_url":"...","tag":"...","published_at":"..." } }`
**404:** `{ "error": { "code": "NOT_FOUND", "message": "Новость не найдена" } }`

---

### CHRONICLE

#### `GET /api/chronicle`
Таблицы: `chronicle_events` | Публичный | Query: `page=1&per_page=20&object_id=uuid&event_type=donation`

**200:**
```json
{ "data": [
  { "id":"uuid","event_type":"donation","display_name":"Иван П.",
    "object_name":"Кузница","object_slug":"kuznitsa","amount_kopecks":500000,"created_at":"..." },
  { "id":"uuid","event_type":"volunteer","display_name":"Артём из Казани",
    "points":4000,"description":"Отработал 4 дня на заезде «Летний — кузница»","created_at":"..." }
], "meta":{ "total":248,"page":1,"per_page":20 } }
```

---

### DONATIONS

#### `POST /api/donations/initiate`
Таблицы: `donations` | Публичный (user_id опционален)

**Запрос:** `{ "object_id":"uuid","slot_id":"uuid","amount_kopecks":500000,"display_name":"Иван","is_anonymous":false }`
**201:** `{ "data": { "donation_id":"don-uuid","redirect_url":"https://yoomoney.ru/quickpay/..." } }`
**400:** `{ "error": { "code": "AMOUNT_TOO_LOW", "message": "Минимальная сумма 100 ₽" } }`

---

#### `POST /api/payments/ymoney/webhook`
Таблицы: `donations`, `slots`, `objects`, `profiles`, `chronicle_events` | SHA-1 HMAC (не JWT)

Тело (form-urlencoded от ЮMoney):
```
notification_type=p2p-incoming&operation_id=abc&amount=5000.00&currency=643
&datetime=2025-05-20T17:20:00+03:00&sender=41001XXX&codepro=false&label=don-uuid&sha1_hash=...
```
**Ответ: всегда 200** (пустое тело; иначе ЮMoney будет повторять попытки).

Последовательность:
1. Проверить SHA-1: `sha1("{type}&{op_id}&{amount}&{currency}&{datetime}&{sender}&{codepro}&{secret}&{label}")`.
2. Найти donation по `label`. Если `status = confirmed` → вернуть 200 (идемпотентность).
3. `status = confirmed`, `confirmed_at = NOW()`, `ymoney_operation_id = op_id`.
4. `awardPoints(user_id, amount_rub * points_per_ruble)`.
5. `updateSlotProgress(slot_id, amount_kopecks)`.
6. `updateObjectProgress(object_id, amount_kopecks)`.
7. INSERT `chronicle_events`.
8. `sendEmail('donation_confirmed', ...)` async.

---

#### `GET /api/donations/my`
Таблицы: `donations` | Bearer token (user+) | Query: `page=1&per_page=20`

**200:** `{ "data": [{ "id":"uuid","object_name":"Кузница","amount_kopecks":500000,"status":"confirmed","points_awarded":5000,"created_at":"..." }], "meta":{...} }`

---

### SUBSCRIPTIONS

#### `DELETE /api/subscriptions/[id]`
Таблицы: `subscriptions` | Bearer token (user+, владелец)

Логика: проверить `user_id = auth.uid()` → `status = cancelled` → email `subscription_cancelled`.
Токен ЮMoney не деактивируется (API не предоставляет). Cron выбирает только `status = active`.

**200:** `{ "data": { "cancelled": true } }`
**403:** `{ "error": { "code": "FORBIDDEN", "message": "Это не ваша подписка" } }`

---

### VOLUNTEER APPLICATIONS

#### `GET /api/volunteer-camps`
Таблицы: `volunteer_camps` | Публичный

**200:** `{ "data": [{ "id":"uuid","name":"Летний заезд","date_from":"2025-06-10","date_to":"2025-06-14","max_volunteers":15,"spots_left":9,"is_open":true }] }`

---

#### `POST /api/volunteer-applications`
Таблицы: `volunteer_applications`, `user_skills` | Bearer token (user+)

**Запрос:** `{ "camp_id":"uuid","skill_ids":["uuid"],"comment":"..." }`
**201:** `{ "data": { "id":"uuid","status":"pending" } }`
**409 (дубль):** `{ "error": { "code": "ALREADY_APPLIED" } }`
**409 (полный):** `{ "error": { "code": "CAMP_FULL" } }`

---

### MATERIAL APPLICATIONS

#### `GET /api/materials`
Таблицы: `materials` | Публичный

**200:** `{ "data": [{ "id":"uuid","name":"Дубовые доски 50мм","unit":"м³","needed_qty":4.0,"received_qty":1.5,"percent":38,"object_name":"Жилые избы" }] }`

---

#### `POST /api/material-applications`
Таблицы: `material_applications` | Bearer token (user+)

**Запрос:** `{ "material_id":"uuid","quantity":0.5,"contact_phone":"+7 921 ...","contact_telegram":"@ivan","comment":"..." }`
**201:** `{ "data": { "id":"uuid","status":"pending" } }`

---

### PARTNER APPLICATIONS

#### `POST /api/partner-applications`
Таблицы: `partner_applications` | Публичный

**Запрос:** `{ "org_name":"МеталлМастер","inn":"6027123456","support_type":"materials","description":"...","contact_name":"Дмитрий","contact_email":"d@mm.ru","object_id":"uuid" }`
**201:** `{ "data": { "id":"uuid","status":"pending" } }`

---

### PROFILE

#### `GET /api/profile`
Таблицы: `profiles`, `titles`, `skills`, `donations`, `volunteer_applications`, `material_applications`, `subscriptions` | Bearer token (user+)

**200:**
```json
{ "data": { "id":"uuid","full_name":"Эйсмонт Иван","avatar_url":"https://...","role":"user",
  "points":6740,"in_chronicle":true,
  "title":{ "name":"Витязь","min_points":2000,"privileges":"Бесплатный вход раз в год" },
  "next_title":{ "name":"Поселенец","min_points":5000 },
  "skills":["Кузнечное дело","Плотницкое дело"],
  "stats":{ "total_donated_kopecks":1500000,"total_volunteer_days":4,"total_materials_count":1 } } }
```

---

#### `PATCH /api/profile`
Таблицы: `profiles`, `user_skills` | Bearer token (user+)

**Запрос:** `{ "full_name":"Иван Эйсмонт","birth_date":"1988-04-12","in_chronicle":true,"skill_ids":["uuid"] }`
**200:** `{ "data": { "updated": true } }`

---

#### `POST /api/profile/certificate`
Таблицы: `profiles`, `titles` | Bearer token (user+)

Запрос проксируется на VPS Node.js. Ответ — PDF поток.
**200:** `Content-Type: application/pdf`
**503:** `{ "error": { "code": "PDF_SERVICE_UNAVAILABLE", "message": "Попробуйте позже" } }`

---

### ADMIN — STATS

#### `GET /api/admin/stats`
Таблицы: `profiles`, `donations`, `volunteer_applications`, `objects` | admin, moderator

**200:** `{ "data": { "total_users":1248,"total_raised_kopecks":86450000,"total_volunteer_hours":2146,"objects_completed":4,"pending_volunteer_apps":3,"pending_material_apps":1,"pending_partner_apps":2 } }`

---

### ADMIN — OBJECTS

#### `POST /api/admin/objects`
Таблицы: `objects` | admin
**Запрос:** `{ "slug":"goncharnaya","name":"Гончарная мастерская","zone":"craft","status":"planned","description":{tiptap},"icon_key":"pottery","map_position_x":45.0,"map_position_y":62.0 }`
**201:** `{ "data": { "id":"uuid","slug":"goncharnaya" } }`

#### `PATCH /api/admin/objects/[id]`
Таблицы: `objects` | admin
Любые поля (включая `map_position_x/y` при drag-drop на карте).
Побочный эффект: `revalidatePath('/')`, `revalidatePath('/objects/[slug]')`.
**200:** `{ "data": { "updated": true } }`

#### `DELETE /api/admin/objects/[id]`
**200:** `{ "data": { "deleted": true } }`

#### `GET /api/admin/objects/[id]/analytics`
Таблицы: `object_views`, `donations` | admin, moderator | Query: `period=30` (7/30/90)
Кеш: `Cache-Control: max-age=600`

**200:** `{ "data": { "object_name":"Кузница","period_days":30,"views":842,"unique_views":614,"donations_count":31,"donations_sum_kopecks":15500000,"conversion_percent":3.7,"avg_donation_kopecks":500000 } }`

---

### ADMIN — MAP

#### `POST /api/admin/map/image`
Таблицы: `settings` | admin | `multipart/form-data`
Загружает в Storage bucket `map` → перезаписывает `settlement.jpg` → обновляет `settings.map_image_url` → `revalidatePath('/')`.
**200:** `{ "data": { "url":"https://..." } }`
**413:** `{ "error": { "code": "FILE_TOO_LARGE", "message": "Максимальный размер 10 МБ" } }`

---

### ADMIN — CAMPS

#### `POST /api/admin/camps`
Таблицы: `volunteer_camps` | admin, moderator
**Запрос:** `{ "name":"Летний заезд","date_from":"2025-06-10","date_to":"2025-06-14","max_volunteers":15 }`
**201:** `{ "data": { "id":"uuid" } }`
**400:** `{ "error": { "code": "INVALID_DATES" } }`

#### `PATCH /api/admin/camps/[id]`
**Запрос:** `{ "is_open": false }` или `{ "max_volunteers": 20 }`
**200:** `{ "data": { "updated": true } }`

#### `DELETE /api/admin/camps/[id]`
**400 (есть одобренные заявки):** `{ "error": { "code": "HAS_APPROVED_APPS" } }`

---

### ADMIN — VOLUNTEER APPLICATIONS

#### `PATCH /api/admin/volunteer-applications/[id]`
Таблицы: `volunteer_applications`, `profiles` | admin, moderator

**Запрос (одобрение):** `{ "status":"approved","admin_note":"Принят" }`
**Запрос (завершение):** `{ "status":"completed","days_worked":4 }`
**200:** `{ "data": { "updated":true,"points_awarded":4000 } }`
**400:** `{ "error": { "code": "DAYS_EXCEED_CAMP" } }` или `{ "code": "ALREADY_COMPLETED" }`

Побочный эффект при `completed`: `awardPoints()` → при смене titlа → email `new_title`.

---

### ADMIN — MATERIAL APPLICATIONS

#### `PATCH /api/admin/material-applications/[id]`
Таблицы: `material_applications`, `materials`, `profiles` | admin, moderator

**Запрос (связались):** `{ "status":"contacted","admin_note":"..." }`
**Запрос (получен):** `{ "status":"received","actual_qty":0.45,"points_awarded":450 }`
**200:** `{ "data": { "updated":true,"points_awarded":450 } }`
**400:** `{ "error": { "code": "ACTUAL_QTY_REQUIRED" } }`

Побочный эффект: DB-триггер `material_app_received` обновляет `materials.received_qty`.

---

### ADMIN — PARTNER APPLICATIONS

#### `PATCH /api/admin/partner-applications/[id]`
Таблицы: `partner_applications`, `object_partners` | admin, moderator

**Запрос:** `{ "status":"approved","publish_partner":true,"logo_url":"https://..." }`
**200:** `{ "data": { "updated":true,"partner_published":true } }`

Побочный эффект при `publish_partner: true`: INSERT в `object_partners` → появляется на странице объекта или `/about`.

---

### ADMIN — DONATIONS

#### `GET /api/admin/donations`
Таблицы: `donations` | admin | Query: `page=1&per_page=20&status=confirmed&source=ymoney&object_id=uuid`

**200:** `{ "data": [{ "id":"uuid","user_name":"...","object_name":"Кузница","slot_name":"Горн","amount_kopecks":500000,"source":"ymoney","status":"confirmed","points_awarded":5000,"confirmed_at":"..." }], "meta":{...} }`

---

#### `POST /api/admin/donations/manual`
Таблицы: `donations`, `slots`, `objects`, `profiles`, `chronicle_events` | admin

**Запрос:**
```json
{ "source":"tbank","amount_kopecks":1500000,"display_name":"Дмитрий Сидоров",
  "donor_email":"d@example.com","object_id":"uuid","slot_id":"uuid",
  "is_anonymous":false,"payment_date":"2025-05-25" }
```
**201:** `{ "data": { "id":"uuid","status":"confirmed","points_awarded":15000,"user_found":true } }`

Последовательность: найти профиль по email → donation `confirmed` → `awardPoints()` (если найден) → `updateSlotProgress()` → `updateObjectProgress()` → chronicle → email.

---

### ADMIN — MATERIALS DIRECTORY

#### `GET /api/admin/materials`  — все (включая `is_active: false`) + `pending_apps_count`
#### `POST /api/admin/materials` — `{ "name":"...","unit":"м³","needed_qty":4.0,"object_id":"uuid" }` → **201** `{ "data":{"id":"uuid"} }`
#### `PATCH /api/admin/materials/[id]` — `{ "needed_qty":6.0,"is_active":false }` → **200**
#### `DELETE /api/admin/materials/[id]` — **400** `{ "code":"HAS_PENDING_APPS" }` если есть незакрытые заявки

---

### ADMIN — NEWS

#### `POST /api/admin/news`
Таблицы: `news` | admin, moderator
**Запрос:** `{ "title":"Начат сруб кузницы","summary":"...","body":{tiptap},"tag":"РЕМЕСЛО","published":false }`
**201:** `{ "data": { "id":"uuid","slug":"nachat-srub-kuznitsy" } }`
Slug: транслит(title) + дефисы ≤80 симв.; коллизия → `-2`, `-3`.

#### `PATCH /api/admin/news/[id]`
**Запрос (публикация):** `{ "published": true }`
Побочный эффект: `revalidatePath('/news/[slug]')`, `revalidatePath('/')`.

#### `DELETE /api/admin/news/[id]`
**400:** `{ "error": { "code": "PUBLISHED_NEWS", "message": "Снимите с публикации перед удалением" } }`

---

### ADMIN — USERS

#### `GET /api/admin/users`
Таблицы: `profiles` | admin | Query: `page=1&per_page=50&search=иван&role=moderator`

**200:** `{ "data": [{ "id":"uuid","full_name":"Иван Петров","email":"...","role":"user","points":6740,"title_name":"Витязь","created_at":"..." }], "meta":{...} }`

#### `PATCH /api/admin/users/[id]`
**Запрос:** `{ "role": "moderator" }`
**200:** `{ "data": { "updated": true } }`
**403:** `{ "error": { "code": "CANNOT_DEMOTE_ADMIN" } }`

---

### ADMIN — STATIC PAGES

#### `GET /api/admin/static-pages/[slug]` — `{ "data": { "slug":"about","title":"О проекте","body":{tiptap} } }`
#### `PATCH /api/admin/static-pages/[slug]` — `{ "body": {tiptap} }` → **200** + `revalidatePath('/[slug]')`

---

### ADMIN — TITLES & SKILLS

#### `POST /api/admin/titles` — `{ "name":"Хранитель","min_points":10000,"privileges":"...","sort_order":5 }` → **201** + запуск `recalcAllTitles()`
#### `PATCH /api/admin/titles/[id]` — любые поля → при изменении `min_points` → `recalcAllTitles()`
#### `DELETE /api/admin/titles/[id]` — **400** `{ "code":"TITLE_IN_USE","message":"Назначен 47 участникам" }`
#### `POST /api/admin/skills` — `{ "name":"Резьба по дереву","category":"craft","sort_order":9 }` → **201**
#### `DELETE /api/admin/skills/[id]` — **400** `{ "code":"SKILL_IN_USE","message":"Выбран у 23 участников" }`

---

### ADMIN — SETTINGS

#### `PATCH /api/admin/settings`
**Запрос:** `{ "points_per_ruble":1,"points_per_day":1000 }`
**200:** `{ "data": { "updated":["points_per_ruble","points_per_day"] } }`

---

## БЛОК 4: UI/UX

### Дизайн-система (строго соблюдать)

```css
--paper:         #fcf9f1;   /* Фон страницы */
--paper-strong:  #fffdf8;   /* Фон панелей */
--ink:           #484236;   /* Основной текст */
--olive:         #667643;   /* Акцент: кнопки, иконки */
--olive-dark:    #536333;   /* Заголовки, активные ссылки */
--olive-soft:    #96a268;   /* Второстепенные иконки */
--gold:          #c9a64e;   /* Подчёркивание активной nav-ссылки */
--gold-soft:     #eee2c1;   /* Декоративные разделители */
--line:          #e6ddca;   /* Границы карточек */
--line-strong:   #dbc9a4;   /* Усиленные границы */

/* Статусы объектов */
--status-planned:  #aeb4a0;   /* Замысел */
--status-building: #e9b643;   /* Строится */
--status-done:     #859c49;   /* Завершён */
--status-working:  #806741;   /* Действует */

/* Шрифты */
--serif: "Palatino Linotype", "Book Antiqua", Georgia, serif;
--sans:  "Segoe UI", Arial, sans-serif;
/* Правило: заголовки и nav — serif. Мелкий текст 12–14px — sans. */
```

---

### Главная `/`
**US:** US-001, US-010 | **API:** `GET /api/objects`, `GET /api/chronicle`, `GET /api/news`

Layout: Grid (desktop) — `[edge][340px FeaturePanel][1fr Map][280px StatsRail][edge]`

**Компоненты:**
- `SiteHeader` — логотип serif 33px, nav-ссылки serif 18px, кнопка «Стать участником» / UserMenu.
- `PlayerHUD` — плавающая панель поверх карты (только авторизованным): аватар 56px, ФИО, титул, `★ баллы / ₽ / ч`.
- `SettlementMap` — `<img>` карта + абсолютные хотспоты (SVG-иконки + tooltip при выборе).
- `FeaturePanel` (левая) — фото объекта, прогресс-бар, сумма собрано/цель, кнопка «Поддержать».
- `StatsRail` (правая) — 4 метрики + мини-летопись 3 события + «Вся летопись →».
- `ObjectsGrid` — 4 карточки + фильтр по зонам (Все / Ремесленная / Общественная / Хозяйственная / Воинская / Жилая).
- `SupportMethods` — 4 кнопки (деньги / материалы / волонтёрство / партнёрство).
- `ChronicleNews` — 5 карточек новостей (фото 88px + дата + заголовок + summary + тег).
- `SiteFooter` — логотип + соцсети (ВКонтакте, Telegram, YouTube) + 3 принципа.

**Состояния:**
- **Loading:** FeaturePanel + StatsRail — `animate-pulse` skeleton. ObjectsGrid — 4 skeleton-карточки.
- **Empty:** FeaturePanel — «Выберите объект на карте».
- **Error:** Toast «Не удалось загрузить данные. Попробуйте обновить страницу».

**Действия:**
1. Клик хотспот → `selectProject(id)` → обновляет FeaturePanel (без перехода).
2. «Поддержать объект» → `router.push('/objects/[slug]')`.
3. Зум +/− → scale 1.0–1.18×.
4. Клик карточки ObjectsGrid → `selectProject(id)` (синхронизирует с картой).
5. Клик кнопки зоны → фильтрует ObjectsGrid.

**Responsive:** ≤1399px — flex-column, карта полная ширина. ≤760px — 2 колонки карточек, HUD минимальный. ≤430px — 1 колонка.

---

### Страница объекта `/objects/[slug]`
**US:** US-002, US-004 | **API:** `GET /api/objects/[slug]`, `POST /api/donations/initiate`

**Компоненты:**
- `ObjectHero` — fullwidth фото max-height 420px, gradient overlay, название, зона, статус-badge.
- `ObjectProgress` — прогресс-бар, сумма собрано/цель.
- `SlotsGrid` — карточки слотов (money/materials/labor) с мини-прогрессом и кнопкой.
- `DonateSheet` — shadcn Sheet: сумма, имя в летописи, чекбокс анонимно, кнопка оплаты.
- `ObjectDescription` — Tiptap read-only.
- `HistoricalNote` — Tiptap read-only в shadcn Accordion.
- `ObjectChronicle` — лента последних 20 вкладчиков.
- `ObjectPartners` — логотипы/названия партнёров.

**Состояния:**
- **Loading:** Hero-skeleton 420px + 3 skeleton-карточки слотов.
- **Empty (нет слотов):** «Слоты пока не добавлены. Следите за обновлениями».
- **Error:** Inline «Не удалось загрузить данные об объекте».

**Действия:**
1. «Поддержать деньгами» → `DonateSheet.open()`.
2. Отправка DonateSheet → `POST /api/donations/initiate` → редирект ЮMoney.
3. `?donated=true` → Toast «Спасибо!» + confetti.
4. «Записаться волонтёром» → `/volunteers?object=[slug]`.

---

### Волонтёрам `/volunteers`
**US:** US-004 | **API:** `GET /api/volunteer-camps`, `POST /api/volunteer-applications`

**Компоненты:**
- `CampsList` — карточки заездов: название, период, мест осталось, кнопка «Подать заявку».
- `VolunteerApplicationDialog` — shadcn Dialog: мультиселект навыков, комментарий.
- `MyApplicationsList` — таблица своих заявок с статус-badge (авторизованным).

**Состояния:** Loading — 3 skeleton. Empty — «Ближайшие заезды появятся здесь». Error — Toast.

---

### Материалы `/materials`
**US:** US-005 | **API:** `GET /api/materials`, `POST /api/material-applications`

**Компоненты:**
- `MaterialsTable` — shadcn Table: название, единица, нужно/получено, прогресс-бар, объект, «Пожертвовать».
- `MaterialDonateDialog` — shadcn Dialog: количество, телефон/Telegram, комментарий.
- `MyMaterialAppsList` — таблица своих заявок (авторизованным).

**Состояния:** Loading — skeleton 5 строк. Empty — «Список материалов пока пуст». Error — Toast.

---

### О проекте `/about`
**US:** US-017 | **API:** `GET /api/static-pages/about` (SSG, ISR 3600s)

**Компоненты:**
- `StaticPageRenderer` — Tiptap read-only рендер JSON.
- `ProjectPrinciples` — 3 принципа (статичные, не из БД).
- `ProjectPartnersSection` — `object_partners` где `object_id IS NULL`.

---

### Страница новости `/news/[slug]`
**US:** US-010, US-011 | **API:** `GET /api/news/[slug]` (SSG, ISR 600s)

**Компоненты:**
- `NewsHero` — обложка max-height 480px + тег-badge + дата.
- `NewsTitle` — serif 32–40px.
- `NewsBody` — Tiptap read-only.
- `NewsNav` — «← Предыдущая» / «Следующая →» по `published_at`.

**404:** «Новость не найдена. Вернуться на главную».
**Preview:** `?preview=true` + роль admin → показывать неопубликованные.

---

### Летопись `/chronicle`
**US:** US-010 | **API:** `GET /api/chronicle`

**Компоненты:**
- `ChronicleHeader` — счётчик всего событий.
- `ChronicleFilters` — Все / Пожертвования / Волонтёрство / Материалы.
- `ChronicleList` — иконка типа, имя, действие, объект (ссылка), сумма/баллы, время.
- Пагинация «Показать ещё» (20/стр).

Realtime: `supabase.channel('chronicle').on('INSERT', ...)` — новые события без перезагрузки.

---

### Авторизация `/auth/login`, `/auth/register`, `/auth/reset`
**API:** Supabase Auth SDK | **Таблицы:** `auth.users` → `profiles` (триггер)

Layout: centered card max-width 440px, bg — карта blur(8px) opacity 0.3.

**`/auth/login`:** email + пароль + «Войти». При `email_not_confirmed` → «Отправить повторно» → `supabase.auth.resend()`.
**`/auth/register`:** ФИО + email + пароль → `/auth/verify-email`.
**`/auth/reset`:** email → Toast «Письмо отправлено».
**`/auth/update-password`:** новый пароль + подтверждение (из email-ссылки).

Состояния: Loading — кнопка disabled + spinner. Error — inline под полем. Success — redirect.

---

### Личный кабинет `/profile`
**US:** US-007 | **API:** `GET /api/profile`, `PATCH /api/profile`, `POST /api/profile/certificate`, `DELETE /api/subscriptions/[id]`

**Компоненты:**
- `ProfileHero` — аватар (загружаемый), ФИО, титул, `★ баллы`.
- `TitleProgress` — shadcn Progress, подпись «X баллов до [Следующий]».
- `DonationsTable` — дата, объект (ссылка), сумма, баллы, статус.
- `VolunteerTable` — заезд, даты, статус-badge, дни, баллы.
- `MaterialsTable` — материал, количество, статус.
- `SubscriptionsTable` — объект, сумма/мес, следующее списание, «Отменить» → `DELETE /api/subscriptions/[id]`.
- `CertificateButton` — loading state при генерации.
- `ProfileEditForm` — ФИО, дата рождения, навыки (shadcn MultiSelect), чекбокс летопись.

---

### Административная панель `/admin`

Layout: Sidebar (nav-links с badge-счётчиками необработанных) + Main.
Sidebar nav: Дашборд / Объекты / Карта / Заезды / Заявки (подменю) / Пожертвования / Новости / Пользователи / Настройки.

**Дашборд `/admin`:**
- `StatsCards` — 4 метрики (участники / собрано / часов / завершено).
- `PendingBadges` — счётчики (волонтёры / материалы / партнёры).
- `RecentDonations` — последние 10.

**Объекты `/admin/objects`:**
Таблица: название, зона, статус-badge, % сбора, Edit/Delete. «Создать» → `/admin/objects/new`.
`/admin/objects/[id]` — вкладки «Общее» / «Слоты» / «Аналитика».

**Конструктор карты `/admin/map`:**
Кнопка «Заменить фон» → `POST /api/admin/map/image`.
Draggable иконки объектов (react-dnd) — drag-end → `PATCH /api/admin/objects/[id]` с новыми `map_position_x/y`.

**Заезды `/admin/camps`:**
Таблица: период, мест/подано/одобрено, Open/Closed, «Закрыть набор».
«Создать» → Dialog → `POST /api/admin/camps`.
Клик строки → `/admin/applications/volunteers?camp_id=[id]`.

**Волонтёрские заявки `/admin/applications/volunteers`:**
Tabs: Все / На рассмотрении / Одобрены / Завершены. Фильтр по заезду.
«Одобрить» → PATCH. «Завершить» → Dialog с `days_worked` → PATCH `completed`.

**Заявки на материалы `/admin/applications/materials`:**
Tabs по статусу. «Получен» → Dialog: `actual_qty` + `points_awarded` → PATCH `received`.

**Партнёрские заявки `/admin/applications/partners`:**
«Одобрить и опубликовать» → Dialog с загрузкой логотипа → PATCH `approved + publish_partner: true`.

**Пожертвования `/admin/donations`:**
Фильтры: источник, статус, объект, дата. Иконка ручного доната.
«Добавить вручную» → `ManualDonationDialog` → `POST /api/admin/donations/manual`.

**Новости `/admin/news`:**
Таблица: thumbnail, заголовок, тег, статус-badge (Черновик/Опубликована), Edit/Publish/Delete.
Редактор (`/admin/news/new`, `/admin/news/[id]/edit`): Tiptap, вкладки «Содержание» / «Настройки».
`PublishToggle` в header редактора.

**Пользователи `/admin/users`:**
Таблица с поиском (debounce 300ms): аватар, ФИО, email, роль-badge, баллы, титул.
Inline `RoleSelect`: user / moderator (admin менять нельзя).

**Настройки `/admin/settings` — вкладки:**
- «Коэффициенты»: `points_per_ruble` + `points_per_day` → `PATCH /api/admin/settings`.
- «Титулы»: drag-and-drop таблица (react-beautiful-dnd). Изменение порога → Toast «Пересчёт запущен».
- «Навыки»: список с Add/Rename/Delete. При удалении с пользователями — Alert.
- «Страницы»: три кнопки → Tiptap в shadcn Sheet. Автосохранение в `localStorage` 30 сек.
- «Карта»: preview 200×120px + «Заменить» → `POST /api/admin/map/image`.

**Состояния всех admin-экранов:**
- Loading — shadcn Skeleton.
- Empty — «Данных нет» + кнопка создания.
- Error — shadcn Alert variant=destructive inline.

---

## БЛОК 5: Business Logic

### Валидация форм

**Регистрация:** `full_name` 2–120 симв. `/^[\p{L}\s\-]{2,120}$/u`. `email` lowercase. `password` ≥8 симв. + 1 цифра `/^(?=.*\d).{8,}$/`. Inline-ошибка под полем; кнопка disabled пока невалидна.

**Донат:** `amount_kopecks` ≥10000 (100 ₽). `display_name` 2–120 симв.; если пусто — ФИО профиля.

**Партнёрская заявка:** `inn` опционально `/^\d{10}(\d{2})?$/`. `contact_email` обязателен. `description` 10–2000 симв.

**Материальная заявка:** `contact_phone` или `contact_telegram` — хотя бы одно обязательно.

---

### `awardPoints()` — начисление баллов

```typescript
// Вызывается из: webhook, manual donation, cron, vol-app completed, mat-app received
async function awardPoints(userId: string, points: number): Promise<void> {
  // Атомарное обновление через SQL-функцию (нет race condition)
  const { data: profile } = await supabase.rpc('increment_points', {
    p_user_id: userId, p_points: points
  });

  // Найти актуальный титул
  const { data: title } = await supabase
    .from('titles')
    .select('id, name')
    .lte('min_points', profile.points)
    .order('min_points', { ascending: false })
    .limit(1).single();

  // Если титул изменился — обновить и уведомить
  if (title && title.id !== profile.title_id) {
    await supabase.from('profiles')
      .update({ title_id: title.id }).eq('id', userId);
    await sendEmail('new_title', userId, { title_name: title.name });
  }
}
```

**Таблица вызовов:**

| Источник | Условие | Формула |
|----------|---------|---------|
| `POST /api/payments/ymoney/webhook` | donation подтверждён | `amount_rub × points_per_ruble` |
| `POST /api/admin/donations/manual` | user_id найден по email | `amount_rub × points_per_ruble` |
| Cron (рекуррентный платёж) | успешное списание | `amount_rub × points_per_ruble` |
| `PATCH /api/admin/volunteer-applications/[id]` | `status = completed` | `days_worked × points_per_day` |
| `PATCH /api/admin/material-applications/[id]` | `status = received` | `points_awarded` (ручное поле) |

После каждого вызова: если `title_id` изменился → email `new_title`.

---

### `recalcAllTitles()` — пересчёт при изменении порогов

```typescript
// Вызывается с VPS при POST/PATCH /api/admin/titles
async function recalcAllTitles(): Promise<void> {
  // Делегируем в SQL (атомарная операция для всех пользователей)
  await supabase.rpc('recalc_all_titles');
  // SQL: UPDATE profiles SET title_id = (
  //   SELECT id FROM titles WHERE min_points <= profiles.points
  //   ORDER BY min_points DESC LIMIT 1 )
}
// Вызывается из: POST /api/admin/titles, PATCH /api/admin/titles/[id] при изменении min_points
```

---

### Подсчёт просмотров (middleware)

```typescript
// middleware.ts — fire-and-forget, НЕ блокирует рендер
export async function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/objects\/([^/]+)$/);
  if (match) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex');
    fetch(`${process.env.SITE_URL}/api/objects/${match[1]}/view`, {
      method: 'POST',
      body: JSON.stringify({ ip_hash: ipHash }),
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {});  // silent fail — аналитика не ломает страницу
  }
  return NextResponse.next();
}
// В /api/objects/[slug]/view:
// INSERT INTO object_views (object_id, ip_hash) VALUES (...) ON CONFLICT DO NOTHING
// UNIQUE (object_id, ip_hash, viewed_at) → 1 просмотр/IP/день автоматически
```

---

### Процесс аутентификации

**Регистрация:** `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` → письмо → триггер создаёт `profiles` → `/auth/verify-email` → клик по ссылке → вход + redirect `/?welcome=true`.

**Вход:** `supabase.auth.signInWithPassword()`. При `email_not_confirmed` → предложить отправить повторно.

**Восстановление:** `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/auth/update-password' })` → за 60 сек → `/auth/update-password` → `supabase.auth.updateUser({ password })`.

---

### Интеграция ЮMoney

**Разовый платёж quickpay:**
```
URL: https://yoomoney.ru/quickpay/confirm.xml
Параметры: receiver={wallet}&quickpay-form=button&targets={name}&sum={рубли}&label={donation_id}&successURL={return_url}
```

**Проверка webhook SHA-1:**
```
sha1("{notification_type}&{operation_id}&{amount}&{currency}&{datetime}&{sender}&{codepro}&{notification_secret}&{label}")
```
Если хэш не совпадает → 400. Всегда возвращать 200 OK ЮMoney.

**Рекуррентный платёж:** первый платёж с получением `recurring_id` → `subscriptions.ymoney_token` → Cron 1-го числа → `POST https://yoomoney.ru/api/request-payment` с `pattern_id=p2p&money-source=recurring_id`.

**Ошибки ЮMoney:**
- `codepro=true` → не обрабатывать, залогировать.
- Рекуррентный `status != success` → `failed_attempts++`; ≥2 → `status = paused` + email.
- Webhook timeout → retry exponential backoff: 1 / 5 / 15 мин, max 3 попытки.

---

### Ручное подтверждение доната (Т-Банк / Сбер)

```typescript
// POST /api/admin/donations/manual
async function createManualDonation(payload) {
  // 1. Найти профиль по email (через RPC, т.к. email в auth.users)
  let userId = null;
  if (payload.donor_email) {
    const { data } = await supabase.rpc('find_user_by_email', { p_email: payload.donor_email });
    userId = data?.id ?? null;
  }
  // 2. Создать donation сразу confirmed
  const { data: donation } = await supabase.from('donations').insert({
    user_id: userId, object_id: payload.object_id, slot_id: payload.slot_id,
    amount_kopecks: payload.amount_kopecks, display_name: payload.display_name,
    is_anonymous: payload.is_anonymous, source: payload.source,
    status: 'confirmed', confirmed_at: payload.payment_date ?? new Date()
  }).select().single();
  // 3. Баллы — только если нашли профиль
  if (userId) {
    const ppr = await getSetting('points_per_ruble');
    const pts = Math.floor(payload.amount_kopecks / 100 * ppr);
    await awardPoints(userId, pts);
    await supabase.from('donations').update({ points_awarded: pts }).eq('id', donation.id);
  }
  // 4. Прогрессы и летопись (те же функции, что в webhook)
  await updateSlotProgress(payload.slot_id, payload.amount_kopecks);
  await updateObjectProgress(payload.object_id, payload.amount_kopecks);
  await supabase.from('chronicle_events').insert({
    event_type: 'donation', user_id: userId, object_id: payload.object_id,
    display_name: payload.is_anonymous ? 'Аноним' : payload.display_name,
    is_anonymous: payload.is_anonymous, amount_kopecks: payload.amount_kopecks
  });
  // 5. Email — только если нашли профиль или указан email
  if (payload.donor_email) await sendEmail('donation_confirmed', payload.donor_email, { donation });
  return { donation, user_found: !!userId };
}
```

---

### Отмена подписки

```typescript
// DELETE /api/subscriptions/[id]
async function cancelSubscription(id: string, userId: string) {
  const { data: sub } = await supabase.from('subscriptions')
    .select('user_id,status').eq('id', id).single();
  if (sub.user_id !== userId) throw { code: 'FORBIDDEN' };
  if (sub.status === 'cancelled') throw { code: 'ALREADY_CANCELLED' };
  await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', id);
  await sendEmail('subscription_cancelled', userId);
  // Токен ЮMoney не деактивируется (API не предусматривает).
  // Cron выбирает только status='active' → следующее списание не произойдёт.
}
```

---

### Cron-задачи (VPS Node.js)

**Ежемесячное списание** — каждый день 09:00 МСК:
```sql
SELECT * FROM subscriptions WHERE status = 'active' AND next_payment_date = CURRENT_DATE
```
→ POST к ЮMoney recurring → при успехе: donation + `awardPoints()` + `next_payment_date += 1 month` → при ошибке: `failed_attempts++` + email; ≥2 → `status = paused`.

**Очистка устаревших pending** — каждый день 03:00 МСК:
```sql
UPDATE donations SET status = 'failed'
WHERE status = 'pending' AND created_at < NOW() - INTERVAL '24 hours'
```

---

### Email-шаблоны (React Email + Resend)

| Шаблон | Тема | Ключевые переменные |
|--------|------|---------------------|
| `welcome` | «Добро пожаловать в городище!» | `full_name`, `site_url` |
| `donation_confirmed` | «Ваш вклад в «{object_name}» принят» | `full_name`, `amount_rub`, `object_name`, `points_awarded`, `profile_url` |
| `volunteer_approved` | «Заявка на заезд {camp_name} одобрена» | `full_name`, `camp_name`, `date_from`, `date_to`, `admin_note` |
| `volunteer_rejected` | «Заявка на заезд {camp_name}» | `full_name`, `camp_name`, `admin_note` |
| `volunteer_completed` | «Заезд завершён. Начислено {points} баллов» | `full_name`, `days_worked`, `points_awarded`, `new_title` |
| `new_title` | «Новый титул: {title_name}!» | `full_name`, `title_name`, `privileges`, `profile_url` |
| `subscription_failed` | «Не удалось списать {amount} ₽» | `full_name`, `amount_rub`, `profile_url` |
| `subscription_cancelled` | «Подписка отменена» | `full_name`, `last_payment_date` |
| `material_status` | «Статус вашей заявки изменён» | `full_name`, `material_name`, `status_label`, `admin_note` |
| `admin_new_application` | «Новая заявка: {type}» | `type`, `applicant_name`, `details`, `admin_url` |

**Отправляется из:** webhook, `awardPoints()` (new_title), `PATCH volunteer-applications`, `PATCH material-applications`, `cancelSubscription()`, cron, регистрации.

---

### Безопасность

- **CORS:** разрешён только `https://gorodische.ru` и `http://localhost:3000`.
- **Rate limiting (VPS):** `express-rate-limit` — 60 req/min для публичных, 10 req/min для `POST /api/auth/*`.
- **Input sanitization:** все текстовые поля через DOMPurify (server-side) перед сохранением.
- **Zod-схемы** на всех POST/PATCH — неизвестные поля отбрасываются (`z.object({}).strict()`).
- **Middleware проверка роли** для `/admin/*` — при `role != admin && role != moderator` → 403.
- **Service role key** — только на VPS/server-side; НИКОГДА в frontend bundle.
- **SHA-1 webhook** — проверяется на каждый запрос от ЮMoney.

---

## БЛОК 6: Edge Cases

### Сеть и доступность

| # | Ситуация | Триггер | Поведение системы |
|---|----------|---------|-------------------|
| 1 | Пользователь закрыл вкладку после редиректа на ЮMoney | Оплата прошла, returnURL не открылся | Webhook всё равно придёт → баллы начислятся; при следующем визите — обновлённый прогресс |
| 2 | ЮMoney webhook не дошёл за 30 мин | Платёж прошёл, webhook потерян | Cron каждые 15 мин проверяет ЮMoney API на pending-доноты; при находке — подтверждает |
| 3 | VPS недоступен (PDF-сервис) | Клик «Скачать сертификат» | 503 + Toast «Попробуйте позже»; кнопка остаётся |
| 4 | Supabase недоступен | Любой запрос | try/catch на всех обращениях; Toast с ошибкой; SSG-страницы работают из кеша |
| 5 | Медленный интернет при загрузке карты | Карта > 5 сек | Skeleton + spinner; хотспоты появляются только после `img.onload` |

### Данные и состояние

| # | Ситуация | Триггер | Поведение системы |
|---|----------|---------|-------------------|
| 6 | Дублирующий webhook | ЮMoney повторил запрос | Проверка `ymoney_operation_id UNIQUE`; повторный → 200 OK без обработки (идемпотентность) |
| 7 | Race condition: два доната в последний слот | Одновременные запросы | `UPDATE slots SET current_value = current_value + X WHERE current_value + X <= goal_value` → 0 rows → 409 «Слот закрыт» |
| 8 | Двойное нажатие «Завершить заезд» | Double-click или два браузера | Статус уже `completed` → 400 `ALREADY_COMPLETED`, повторных баллов нет |
| 9 | Пользователь удалил аккаунт | Supabase auth CASCADE | donations → `user_id = NULL`; chronicle → `user_id = NULL`, `display_name` сохранён |
| 10 | Загрузка аватара > 5 МБ | PATCH /api/profile multipart | Storage rejection → 413 `FILE_TOO_LARGE` |

### Безопасность

| # | Ситуация | Триггер | Поведение системы |
|---|----------|---------|-------------------|
| 11 | Доступ к чужим донатам | GET /api/donations/my с чужим токеном | RLS блокирует на уровне БД |
| 12 | Подмена donation_id в webhook | Попытка подтвердить чужой донат | SHA-1 невалиден → 400 |
| 13 | XSS в поле комментария | Скрипт в `comment` | DOMPurify server-side при сохранении + Tiptap санитизация при рендере |
| 14 | IDOR на admin-эндпоинт | GET /api/admin/stats без роли | Middleware → 403 |
| 15 | Webhook с неверной подписью | Имитация ЮMoney | SHA-1 не совпадает → 400 |

### Лимиты и производительность

| # | Ситуация | Триггер | Поведение системы |
|---|----------|---------|-------------------|
| 16 | 100+ событий летописи в секунду | Вирусный пост | Supabase Realtime throttle 1 раз/сек; debounce 500ms на UI |
| 17 | 50+ объектов | Рост проекта | Пагинация 20/стр; виртуализация при > 100 (react-virtual) |
| 18 | Tiptap-контент > 500 КБ | Много изображений base64 | 413 `CONTENT_TOO_LARGE`; изображения — только через Storage |
| 19 | Заезд полностью заполнен | `approved_count >= max_volunteers` | Кнопка disabled + «Мест нет»; API → 409 `CAMP_FULL` |
| 20 | Рекуррентный токен ЮMoney истёк | Год+ после привязки | `illegal_param_recurring_id` → `status = paused` + email «Обновите данные карты» |

---

## КАРТА СВЯЗЕЙ

> Главный навигатор для Claude Code при автономной сборке.
> При реализации любого элемента — сверяться с этими таблицами.

### Таблица → кто читает / кто пишет / где отображается

| Таблица | Читает API | Пишет API / триггер | UI-экраны |
|---------|-----------|---------------------|-----------|
| `profiles` | `/api/profile`, `/api/admin/users` | регистрация, `awardPoints()`, `PATCH /api/admin/users/[id]` | `/profile`, `/admin/users`, PlayerHUD |
| `titles` | `/api/profile`, `/api/admin/settings` | `POST/PATCH/DELETE /api/admin/titles`, `recalcAllTitles()` | `/profile`, `/admin/settings` |
| `skills` | `/api/profile` | `POST/PATCH/DELETE /api/admin/skills` | `/profile` (форма), `/volunteers` (форма) |
| `objects` | `/api/objects`, `/api/objects/[slug]` | `POST/PATCH /api/admin/objects`, webhook, manual donation | `/`, `/objects/[slug]`, `/admin/objects` |
| `slots` | `/api/objects/[slug]` | `POST/PATCH /api/admin/slots`, `updateSlotProgress()` | `/objects/[slug]`, `/admin/objects/[id]` |
| `donations` | `/api/donations/my`, `/api/admin/donations` | webhook, `POST /api/admin/donations/manual`, cron | `/profile`, `/admin/donations` |
| `subscriptions` | `/api/profile` | `POST /api/donations/subscribe`, `DELETE /api/subscriptions/[id]`, cron | `/profile` |
| `volunteer_camps` | `/api/volunteer-camps` | `POST/PATCH/DELETE /api/admin/camps` | `/volunteers`, `/admin/camps` |
| `volunteer_applications` | `/api/admin/applications/volunteers` | `POST /api/volunteer-applications`, `PATCH /api/admin/volunteer-applications/[id]` | `/volunteers`, `/admin/applications/volunteers` |
| `material_applications` | `/api/admin/applications/materials` | `POST /api/material-applications`, `PATCH /api/admin/material-applications/[id]` | `/materials`, `/admin/applications/materials` |
| `materials` | `/api/materials`, `/api/admin/materials` | `POST/PATCH/DELETE /api/admin/materials`, триггер `material_app_received` | `/materials`, `/admin/materials` |
| `partner_applications` | `/api/admin/applications/partners` | `POST /api/partner-applications`, `PATCH /api/admin/partner-applications/[id]` | `/admin/applications/partners` |
| `object_partners` | `/api/objects/[slug]` | `PATCH /api/admin/partner-applications/[id]` (`publish_partner: true`) | `/objects/[slug]`, `/about` |
| `chronicle_events` | `/api/chronicle`, `/api/objects/[slug]` | webhook, `awardPoints()`, manual donation, admin CRUD | `/` (рейл), `/chronicle`, `/objects/[slug]` |
| `news` | `/api/news`, `/api/news/[slug]` | `POST/PATCH/DELETE /api/admin/news` | `/` (карточки), `/news/[slug]`, `/admin/news` |
| `object_views` | `/api/admin/objects/[id]/analytics` | middleware (fire-and-forget) | `/admin/objects/[id]` |
| `settings` | все API с коэффициентами и `map_image_url` | `PATCH /api/admin/settings`, `POST /api/admin/map/image` | `/admin/settings` |
| `static_pages` | `/api/static-pages/[slug]` (публичный) | `PATCH /api/admin/static-pages/[slug]` | `/about`, `/privacy`, `/personal-data` |

---

### `awardPoints()` — точки вызова

| Вызывается из | Условие | Формула баллов |
|---------------|---------|----------------|
| `POST /api/payments/ymoney/webhook` | `status = confirmed` | `amount_rub × points_per_ruble` (из settings) |
| `POST /api/admin/donations/manual` | `user_id` найден | `amount_rub × points_per_ruble` |
| Cron рекуррентный | успешное списание | `amount_rub × points_per_ruble` |
| `PATCH /api/admin/volunteer-applications/[id]` | `status = completed` | `days_worked × points_per_day` (из settings) |
| `PATCH /api/admin/material-applications/[id]` | `status = received` | `points_awarded` (ручное поле admin) |

После каждого вызова: если изменился `profiles.title_id` → email `new_title`.

---

### US → Таблицы → API → UI

| US | Таблицы (основные) | API (основные) | UI-экраны |
|----|-------------------|----------------|-----------|
| US-001 | `objects`, `object_views` | `GET /api/objects` | `/` |
| US-002 | `donations`, `slots`, `chronicle_events` | `POST /api/donations/initiate`, webhook | `/objects/[slug]` |
| US-003 | `subscriptions`, `donations` | `POST /api/donations/subscribe`, cron | `/profile`, `/objects/[slug]` |
| US-004 | `volunteer_applications`, `volunteer_camps` | `GET /api/volunteer-camps`, `POST /api/volunteer-applications` | `/volunteers` |
| US-005 | `material_applications`, `materials` | `GET /api/materials`, `POST /api/material-applications` | `/materials` |
| US-006 | `partner_applications`, `object_partners` | `POST /api/partner-applications` | `/` |
| US-007 | `profiles`, `titles`, `donations` | `GET /api/profile`, `POST /api/profile/certificate` | `/profile` |
| US-008 | `objects`, `slots` | `POST/PATCH /api/admin/objects` | `/admin/objects`, `/admin/map` |
| US-009 | `volunteer_applications`, `profiles` | `PATCH /api/admin/volunteer-applications/[id]` | `/admin/applications/volunteers` |
| US-010 | `news`, `chronicle_events` | `GET /api/news`, `GET /api/chronicle` | `/`, `/news/[slug]`, `/chronicle` |
| US-011 | `news` | `POST/PATCH/DELETE /api/admin/news` | `/admin/news` |
| US-012 | `volunteer_camps` | `POST/PATCH/DELETE /api/admin/camps` | `/admin/camps`, `/volunteers` |
| US-013 | `donations`, `slots`, `objects`, `chronicle_events` | `POST /api/admin/donations/manual` | `/admin/donations` |
| US-014 | `material_applications`, `materials`, `profiles` | `PATCH /api/admin/material-applications/[id]` | `/admin/applications/materials` |
| US-015 | `profiles` | `GET /api/admin/users`, `PATCH /api/admin/users/[id]` | `/admin/users` |
| US-016 | `titles`, `skills`, `profiles` | `POST/PATCH/DELETE /api/admin/titles`, `/api/admin/skills` | `/admin/settings` |
| US-017 | `static_pages` | `GET/PATCH /api/admin/static-pages/[slug]` | `/admin/settings`, `/about`, `/privacy` |
| US-018 | `object_views`, `donations` | `GET /api/admin/objects/[id]/analytics` | `/admin/objects/[id]` |
