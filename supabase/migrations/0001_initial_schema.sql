-- Живое Городище: initial Supabase schema.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('participant', 'editor', 'admin', 'superadmin');
create type public.building_zone as enum ('craft', 'public', 'residential', 'household', 'sacred');
create type public.building_status as enum ('idea', 'fundraising', 'building', 'finishing', 'active', 'archived');
create type public.collection_item_status as enum ('available', 'reserved', 'funded', 'hidden');
create type public.contribution_type as enum ('money', 'material', 'volunteer_hours');
create type public.donation_status as enum ('pending', 'paid', 'cancelled', 'failed', 'refunded');
create type public.volunteer_status as enum ('new', 'reviewing', 'approved', 'declined', 'completed');
create type public.chronicle_type as enum ('donation', 'volunteer_hours', 'building_status', 'project_news');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  role public.user_role not null default 'participant',
  points integer not null default 0,
  public_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.map_versions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  width integer,
  height integer,
  is_active boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index only_one_active_map_idx on public.map_versions(is_active) where is_active = true;

create table public.icons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text,
  lucide_name text,
  category text,
  created_at timestamptz not null default now()
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  zone public.building_zone not null,
  short_description text,
  description text,
  historical_note text,
  budget_amount integer not null default 0,
  collected_amount integer not null default 0,
  status public.building_status not null default 'idea',
  is_visible boolean not null default true,
  main_image_url text,
  icon_lucide_name text,
  seo_title text,
  seo_description text,
  sort_order integer not null default 100,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.building_media (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  url text not null,
  alt text,
  type text not null default 'image',
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table public.map_markers (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.map_versions(id) on delete cascade,
  building_id uuid not null references public.buildings(id) on delete cascade,
  icon_id uuid references public.icons(id),
  label text,
  x_percent numeric(5,2) not null,
  y_percent numeric(5,2) not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marker_x_percent_range check (x_percent >= 0 and x_percent <= 100),
  constraint marker_y_percent_range check (y_percent >= 0 and y_percent <= 100)
);

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  contribution_type public.contribution_type not null default 'money',
  target_amount integer not null default 0,
  collected_amount integer not null default 0,
  unit_amount integer not null default 0,
  quantity_total integer not null default 1,
  quantity_funded integer not null default 0,
  status public.collection_item_status not null default 'available',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  building_id uuid not null references public.buildings(id),
  item_id uuid references public.collection_items(id),
  donor_name text not null,
  donor_email text not null,
  donor_phone text,
  amount integer not null,
  status public.donation_status not null default 'pending',
  publish_name boolean not null default true,
  public_name text,
  comment text,
  provider text not null default 'yookassa',
  provider_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_events (
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

create table public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  building_id uuid references public.buildings(id),
  name text not null,
  email text not null,
  phone text,
  skills text[],
  preferred_dates text,
  comment text,
  status public.volunteer_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.volunteer_applications(id) on delete set null,
  user_id uuid references public.profiles(id),
  building_id uuid references public.buildings(id),
  hours integer not null,
  points integer not null,
  comment text,
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.chronicle_entries (
  id uuid primary key default gen_random_uuid(),
  type public.chronicle_type not null,
  building_id uuid references public.buildings(id),
  item_id uuid references public.collection_items(id),
  user_id uuid references public.profiles(id),
  donation_id uuid references public.donations(id),
  volunteer_hours_id uuid references public.volunteer_hours(id),
  title text,
  text text not null,
  public_name text,
  amount integer,
  hours integer,
  is_visible boolean not null default true,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index profiles_email_idx on public.profiles(email);
create index buildings_zone_idx on public.buildings(zone);
create index buildings_status_idx on public.buildings(status);
create index buildings_visible_idx on public.buildings(is_visible);
create index buildings_sort_idx on public.buildings(sort_order);
create index building_media_building_idx on public.building_media(building_id);
create index map_markers_map_idx on public.map_markers(map_id);
create index map_markers_building_idx on public.map_markers(building_id);
create index collection_items_building_idx on public.collection_items(building_id);
create index collection_items_status_idx on public.collection_items(status);
create index donations_status_idx on public.donations(status);
create index donations_building_idx on public.donations(building_id);
create index donations_item_idx on public.donations(item_id);
create index donations_email_idx on public.donations(donor_email);
create index donations_paid_at_idx on public.donations(paid_at);
create index chronicle_visible_created_idx on public.chronicle_entries(is_visible, created_at desc);
create index chronicle_building_idx on public.chronicle_entries(building_id);
create index chronicle_type_idx on public.chronicle_entries(type);
create index volunteer_applications_status_idx on public.volunteer_applications(status);
create index volunteer_applications_building_idx on public.volunteer_applications(building_id);
create index admin_audit_log_admin_idx on public.admin_audit_log(admin_id);
create index admin_audit_log_entity_idx on public.admin_audit_log(entity_type, entity_id);
create index admin_audit_log_created_idx on public.admin_audit_log(created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
create trigger touch_map_versions_updated_at before update on public.map_versions for each row execute function public.touch_updated_at();
create trigger touch_buildings_updated_at before update on public.buildings for each row execute function public.touch_updated_at();
create trigger touch_map_markers_updated_at before update on public.map_markers for each row execute function public.touch_updated_at();
create trigger touch_collection_items_updated_at before update on public.collection_items for each row execute function public.touch_updated_at();
create trigger touch_donations_updated_at before update on public.donations for each row execute function public.touch_updated_at();
create trigger touch_volunteer_applications_updated_at before update on public.volunteer_applications for each row execute function public.touch_updated_at();
create trigger touch_chronicle_entries_updated_at before update on public.chronicle_entries for each row execute function public.touch_updated_at();

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('editor', 'admin', 'superadmin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'superadmin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.map_versions enable row level security;
alter table public.icons enable row level security;
alter table public.buildings enable row level security;
alter table public.building_media enable row level security;
alter table public.map_markers enable row level security;
alter table public.collection_items enable row level security;
alter table public.donations enable row level security;
alter table public.payment_events enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.volunteer_hours enable row level security;
alter table public.chronicle_entries enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "Profiles can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Profiles can update own basic profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "Public can read active maps"
  on public.map_versions for select
  using (is_active = true or public.is_staff());

create policy "Staff can manage maps"
  on public.map_versions for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Public can read icons"
  on public.icons for select
  using (true);

create policy "Staff can manage icons"
  on public.icons for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Public can read visible buildings"
  on public.buildings for select
  using (is_visible = true or public.is_staff());

create policy "Staff can manage buildings"
  on public.buildings for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Public can read building media"
  on public.building_media for select
  using (
    exists (
      select 1 from public.buildings
      where buildings.id = building_media.building_id
        and (buildings.is_visible = true or public.is_staff())
    )
  );

create policy "Staff can manage building media"
  on public.building_media for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Public can read visible markers on active maps"
  on public.map_markers for select
  using (
    is_visible = true
    and exists (
      select 1 from public.map_versions
      where map_versions.id = map_markers.map_id
        and map_versions.is_active = true
    )
  );

create policy "Staff can manage markers"
  on public.map_markers for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Public can read visible collection items"
  on public.collection_items for select
  using (
    status <> 'hidden'
    and exists (
      select 1 from public.buildings
      where buildings.id = collection_items.building_id
        and buildings.is_visible = true
    )
  );

create policy "Staff can manage collection items"
  on public.collection_items for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Donors can insert pending donations"
  on public.donations for insert
  with check (status = 'pending');

create policy "Users can read own donations"
  on public.donations for select
  using (public.is_admin() or user_id = auth.uid());

create policy "Admins can manage donations"
  on public.donations for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can manage payment events"
  on public.payment_events for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Anyone can insert volunteer applications"
  on public.volunteer_applications for insert
  with check (true);

create policy "Users can read own volunteer applications"
  on public.volunteer_applications for select
  using (public.is_staff() or user_id = auth.uid());

create policy "Staff can manage volunteer applications"
  on public.volunteer_applications for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Staff can manage volunteer hours"
  on public.volunteer_hours for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Users can read own volunteer hours"
  on public.volunteer_hours for select
  using (public.is_staff() or user_id = auth.uid());

create policy "Public can read visible chronicle entries"
  on public.chronicle_entries for select
  using (is_visible = true or public.is_staff());

create policy "Staff can manage chronicle entries"
  on public.chronicle_entries for all
  using (public.is_staff())
  with check (public.is_staff());

create policy "Admins can read audit log"
  on public.admin_audit_log for select
  using (public.is_admin());

create policy "Admins can insert audit log"
  on public.admin_audit_log for insert
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('maps', 'maps', true),
  ('buildings', 'buildings', true),
  ('icons', 'icons', true),
  ('reports', 'reports', true),
  ('certificates', 'certificates', false)
on conflict (id) do nothing;
