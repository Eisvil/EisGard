create table public.project_settings (
  id text primary key default 'main',
  project_name text not null default 'Живое Городище',
  legal_name text not null default 'НКО / фонд будет указан позже',
  contact_email text not null default 'info@example.ru',
  telegram_admin_chat text not null default 'служебный чат не подключен',
  donation_terms text not null default 'Пожертвование является добровольным вкладом в строительство выбранного объекта. Публичное имя отображается только при согласии участника.',
  privacy_policy text not null default 'Персональные данные используются для подтверждения вклада, связи с участником и ведения цифровой летописи проекта.',
  payment_provider_preference text not null default 'mock',
  tbank_collection_enabled boolean not null default false,
  tbank_collection_url text,
  tbank_collection_title text not null default 'Сбор Т-Банка',
  tbank_collection_description text not null default 'Внешняя ссылка на сбор денег в Т-Банке. После оплаты администратор подтверждает вклад вручную.',
  yookassa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_settings_singleton check (id = 'main'),
  constraint project_settings_payment_provider check (
    payment_provider_preference in ('mock', 'tbank_collection_manual', 'yookassa')
  ),
  constraint project_settings_tbank_url_required check (
    tbank_collection_enabled = false
    or (tbank_collection_url is not null and length(trim(tbank_collection_url)) > 0)
  )
);

create trigger touch_project_settings_updated_at
  before update on public.project_settings
  for each row execute function public.touch_updated_at();

alter table public.project_settings enable row level security;

grant select on public.project_settings to anon, authenticated;
grant all on public.project_settings to service_role;

create policy "Public can read project settings"
  on public.project_settings for select
  using (id = 'main');

create policy "Staff can manage project settings"
  on public.project_settings for all
  using (public.is_staff())
  with check (public.is_staff());

insert into public.project_settings (id)
values ('main')
on conflict (id) do nothing;
