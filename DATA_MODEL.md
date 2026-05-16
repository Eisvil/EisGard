# DATA MODEL: Supabase

## 1. Общие правила

- Все публичные сущности сайта хранятся в Supabase.
- Для денежных значений используется integer в копейках.
- Координаты карты хранятся в процентах.
- Все таблицы с пользовательскими или административными данными должны иметь RLS.
- Все критичные изменения админов пишутся в `admin_audit_log`.
- Публичное отображение имени управляется отдельным флагом согласия.

## 2. Enum-типы

```sql
create type user_role as enum ('participant', 'editor', 'admin', 'superadmin');
create type building_zone as enum ('craft', 'public', 'residential', 'household', 'sacred');
create type building_status as enum ('idea', 'fundraising', 'building', 'finishing', 'active', 'archived');
create type collection_item_status as enum ('available', 'reserved', 'funded', 'hidden');
create type contribution_type as enum ('money', 'material', 'volunteer_hours');
create type donation_status as enum ('pending', 'paid', 'cancelled', 'failed', 'refunded');
create type volunteer_status as enum ('new', 'reviewing', 'approved', 'declined', 'completed');
create type chronicle_type as enum ('donation', 'volunteer_hours', 'building_status', 'project_news');
```

## 3. Таблицы

### `profiles`

Пользователи и роли.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  role user_role not null default 'participant',
  points integer not null default 0,
  public_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Индексы:

```sql
create index profiles_role_idx on profiles(role);
create index profiles_email_idx on profiles(email);
```

### `map_versions`

Версии карты поселения.

```sql
create table map_versions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  width integer,
  height integer,
  is_active boolean not null default false,
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Ограничение: активной должна быть только одна карта. Это можно реализовать partial unique index.

```sql
create unique index only_one_active_map_idx on map_versions(is_active) where is_active = true;
```

### `icons`

Библиотека иконок.

```sql
create table icons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text,
  lucide_name text,
  category text,
  created_at timestamptz not null default now()
);
```

Если `lucide_name` заполнен, можно использовать иконку из lucide-react. Если `file_url` заполнен, используется загруженный файл.

### `buildings`

Здания поселения.

```sql
create table buildings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  zone building_zone not null,
  short_description text,
  description text,
  historical_note text,
  budget_amount integer not null default 0,
  collected_amount integer not null default 0,
  status building_status not null default 'idea',
  is_visible boolean not null default true,
  main_image_url text,
  seo_title text,
  seo_description text,
  sort_order integer not null default 100,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Индексы:

```sql
create index buildings_zone_idx on buildings(zone);
create index buildings_status_idx on buildings(status);
create index buildings_visible_idx on buildings(is_visible);
```

### `building_media`

Галереи зданий.

```sql
create table building_media (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  url text not null,
  alt text,
  type text not null default 'image',
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
```

### `map_markers`

Маркеры на карте.

```sql
create table map_markers (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references map_versions(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  icon_id uuid references icons(id),
  label text,
  x_percent numeric(5,2) not null,
  y_percent numeric(5,2) not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marker_x_percent_range check (x_percent >= 0 and x_percent <= 100),
  constraint marker_y_percent_range check (y_percent >= 0 and y_percent <= 100)
);
```

Индексы:

```sql
create index map_markers_map_idx on map_markers(map_id);
create index map_markers_building_idx on map_markers(building_id);
```

### `collection_items`

Слоты поддержки внутри здания.

```sql
create table collection_items (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  contribution_type contribution_type not null default 'money',
  target_amount integer not null default 0,
  collected_amount integer not null default 0,
  unit_amount integer not null default 0,
  quantity_total integer not null default 1,
  quantity_funded integer not null default 0,
  status collection_item_status not null default 'available',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Индексы:

```sql
create index collection_items_building_idx on collection_items(building_id);
create index collection_items_status_idx on collection_items(status);
```

### `donations`

Денежные вклады.

```sql
create table donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  building_id uuid not null references buildings(id),
  item_id uuid references collection_items(id),
  donor_name text not null,
  donor_email text not null,
  donor_phone text,
  amount integer not null,
  status donation_status not null default 'pending',
  publish_name boolean not null default true,
  public_name text,
  comment text,
  provider text not null default 'yookassa',
  provider_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Индексы:

```sql
create index donations_status_idx on donations(status);
create index donations_building_idx on donations(building_id);
create index donations_item_idx on donations(item_id);
create index donations_email_idx on donations(donor_email);
create index donations_paid_at_idx on donations(paid_at);
```

### `payment_events`

Webhook-события платежного провайдера.

```sql
create table payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  provider_payment_id text,
  event_type text,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, event_id)
);
```

Эта таблица нужна для идемпотентности webhook.

### `chronicle_entries`

Публичная летопись.

```sql
create table chronicle_entries (
  id uuid primary key default gen_random_uuid(),
  type chronicle_type not null,
  building_id uuid references buildings(id),
  item_id uuid references collection_items(id),
  user_id uuid references profiles(id),
  donation_id uuid references donations(id),
  volunteer_hours_id uuid,
  title text,
  text text not null,
  public_name text,
  is_visible boolean not null default true,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Индексы:

```sql
create index chronicle_visible_created_idx on chronicle_entries(is_visible, created_at desc);
create index chronicle_building_idx on chronicle_entries(building_id);
create index chronicle_type_idx on chronicle_entries(type);
```

### `volunteer_applications`

Заявки волонтеров.

```sql
create table volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  building_id uuid references buildings(id),
  name text not null,
  email text not null,
  phone text,
  skills text[],
  preferred_dates text,
  comment text,
  status volunteer_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Индексы:

```sql
create index volunteer_applications_status_idx on volunteer_applications(status);
create index volunteer_applications_building_idx on volunteer_applications(building_id);
```

### `volunteer_hours`

Подтвержденные часы.

```sql
create table volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references volunteer_applications(id) on delete set null,
  user_id uuid references profiles(id),
  building_id uuid references buildings(id),
  hours integer not null,
  points integer not null,
  comment text,
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```

### `admin_audit_log`

Журнал действий администраторов.

```sql
create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);
```

Индексы:

```sql
create index admin_audit_log_admin_idx on admin_audit_log(admin_id);
create index admin_audit_log_entity_idx on admin_audit_log(entity_type, entity_id);
create index admin_audit_log_created_idx on admin_audit_log(created_at desc);
```

## 4. Расчет прогресса

Для здания:

```txt
progress = collected_amount / budget_amount * 100
```

Для слота:

```txt
progress = collected_amount / target_amount * 100
```

`collected_amount` можно хранить денормализованно для быстрого чтения, но обновлять только серверной логикой после успешного webhook.

## 5. RLS-правила

### Публичное чтение

Гости могут читать:

- активную карту;
- видимые маркеры;
- видимые здания;
- доступные слоты;
- видимые записи летописи.

### Участник

Участник может:

- читать свой профиль;
- обновлять часть своего профиля;
- читать свои донаты;
- читать свои волонтерские заявки.

### Редактор

Редактор может:

- читать административные таблицы контента;
- создавать и редактировать здания;
- создавать и редактировать медиа;
- модерировать летопись.

### Администратор

Администратор может:

- управлять картой;
- управлять зданиями;
- управлять слотами;
- читать донаты;
- читать заявки;
- экспортировать данные;
- писать в аудит.

### Суперадмин

Суперадмин может:

- управлять ролями;
- управлять настройками;
- видеть полный аудит.

## 6. Storage buckets

### `maps`

Для изображений карт.

Доступ:

- public read;
- admin write.

### `buildings`

Для изображений зданий.

Доступ:

- public read;
- editor/admin write.

### `icons`

Для пользовательских иконок.

Доступ:

- public read;
- editor/admin write.

### `reports`

Для фотоотчетов.

Доступ:

- public read;
- editor/admin write.

### `certificates`

Для сертификатов.

Доступ:

- private или signed URLs;
- участник может читать только свои сертификаты.

## 7. Seed MVP

Минимальные здания:

- `kuznica` — Кузница, ремесленная зона;
- `ogorody` — Огороды, общественная зона;
- `kuryatnik` — Курятник, жилая/хозяйственная зона;
- `zagon-dlya-kur` — Загон для кур, жилая/хозяйственная зона.

Минимальные слоты для Кузницы:

- Горн кузницы;
- Наковальня;
- Сруб;
- Кровля;
- Инструмент.

Минимальные слоты для Огородов:

- Грядка;
- Семена;
- Плетень;
- Колодезное ведро;
- Плодовое дерево.

Минимальные слоты для Курятника:

- Сруб курятника;
- Кровля;
- Насесты;
- Кормушки.

