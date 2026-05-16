-- Живое Городище: MVP seed data.
-- Run after 0001_initial_schema.sql.

insert into public.map_versions (id, title, description, image_url, width, height, is_active, published_at)
values (
  '00000000-0000-0000-0000-000000000101',
  'Карта поселения MVP',
  'Первая интерактивная карта для публичного прототипа.',
  '/assets/settlement-map.png',
  1672,
  941,
  true,
  now()
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  image_url = excluded.image_url,
  width = excluded.width,
  height = excluded.height,
  is_active = excluded.is_active,
  published_at = excluded.published_at;

insert into public.icons (id, title, lucide_name, category)
values
  ('00000000-0000-0000-0000-000000000201', 'Кузница', 'Hammer', 'building'),
  ('00000000-0000-0000-0000-000000000202', 'Огороды', 'Leaf', 'building'),
  ('00000000-0000-0000-0000-000000000203', 'Курятник', 'Bird', 'building'),
  ('00000000-0000-0000-0000-000000000204', 'Загон', 'Home', 'building')
on conflict (id) do update set
  title = excluded.title,
  lucide_name = excluded.lucide_name,
  category = excluded.category;

insert into public.buildings (
  id,
  slug,
  title,
  zone,
  short_description,
  description,
  historical_note,
  budget_amount,
  collected_amount,
  status,
  is_visible,
  main_image_url,
  icon_lucide_name,
  sort_order
)
values
  (
    '00000000-0000-0000-0000-000000000301',
    'kuznica',
    'Кузница',
    'craft',
    'Сердце ремесленной жизни поселения.',
    'Здесь будут коваться железо, рождаться инструменты и оружие наших предков. Кузница станет первой мастерской, где гости увидят живую работу ремесленника.',
    'В поселениях X-XIII веков кузнец был одним из ключевых мастеров: от его работы зависели хозяйство, строительство, охота и военное дело.',
    200000,
    136000,
    'building',
    true,
    '/assets/buildings/kuznica.png',
    'Hammer',
    10
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'ogorody',
    'Огороды',
    'public',
    'Исторические грядки, садовые культуры и плетни.',
    'Огороды покажут, как община выращивала пищу, лекарственные травы и полезные растения. Это тихая, но очень живая часть будущего городища.',
    'Грядки, плодовые деревья, изгороди и простые водные решения были частью повседневной устойчивости поселения.',
    100000,
    42000,
    'fundraising',
    true,
    '/assets/buildings/ogorody.png',
    'Leaf',
    20
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    'kuryatnik',
    'Курятник',
    'household',
    'Первый живой объект хозяйственной части.',
    'Курятник добавит поселению настоящий быт: птицу, кормление, уход, детские экскурсии и простую хозяйственную механику.',
    'Домашняя птица была важным источником яиц, мяса и перьев, а малые хозяйственные постройки формировали повседневный ритм двора.',
    50000,
    7500,
    'idea',
    true,
    '/assets/buildings/kuryatnik.png',
    'Bird',
    30
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    'zagon-dlya-kur',
    'Загон для кур',
    'household',
    'Огороженный выгул с навесом.',
    'Загон нужен, чтобы птица могла жить на открытом воздухе, а гости видели хозяйственный уклад поселения не только на картинках.',
    'Простые плетни, навесы и выгородки были естественной частью хозяйственного двора.',
    15000,
    0,
    'idea',
    true,
    '/assets/buildings/zagon-dlya-kur.png',
    'Home',
    40
  )
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  zone = excluded.zone,
  short_description = excluded.short_description,
  description = excluded.description,
  historical_note = excluded.historical_note,
  budget_amount = excluded.budget_amount,
  collected_amount = excluded.collected_amount,
  status = excluded.status,
  is_visible = excluded.is_visible,
  main_image_url = excluded.main_image_url,
  icon_lucide_name = excluded.icon_lucide_name,
  sort_order = excluded.sort_order;

insert into public.map_markers (id, map_id, building_id, icon_id, label, x_percent, y_percent, is_visible)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'Кузница', 44.50, 47.00, true),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000202', 'Огороды', 51.50, 21.00, true),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000203', 'Курятник', 76.60, 34.00, true),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000204', 'Загон для кур', 70.50, 79.00, true)
on conflict (id) do update set
  label = excluded.label,
  x_percent = excluded.x_percent,
  y_percent = excluded.y_percent,
  is_visible = excluded.is_visible;

insert into public.collection_items (
  id,
  building_id,
  title,
  description,
  image_url,
  contribution_type,
  target_amount,
  collected_amount,
  unit_amount,
  quantity_total,
  quantity_funded,
  status,
  sort_order
)
values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000301', 'Горн кузницы', 'Каменная кладка, жаровая зона и базовое оснащение горна.', '/assets/buildings/kuznica.png', 'money', 120000, 0, 2500, 3, 0, 'available', 10),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000301', 'Кровля кузницы', 'Дранка, крепления и работа по защите мастерской от непогоды.', '/assets/buildings/kuznica.png', 'money', 80000, 0, 8000, 5, 0, 'available', 20),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000301', 'Малый инструмент', 'Молотки, клещи, напильники и расходные материалы.', '/assets/buildings/kuznica.png', 'money', 100000, 0, 5000, 12, 0, 'available', 30),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000302', 'Историческая грядка', 'Плетеный короб, земля, посадочный материал.', '/assets/buildings/ogorody.png', 'money', 12000, 0, 1500, 8, 0, 'available', 10),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000302', 'Плодовое дерево', 'Саженец, опора и уход в первый сезон.', '/assets/buildings/ogorody.png', 'money', 30000, 0, 3000, 10, 0, 'available', 20),
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000303', 'Сруб курятника', 'Деревянный каркас и базовая сборка.', '/assets/buildings/kuryatnik.png', 'money', 30000, 0, 5000, 6, 0, 'available', 10),
  ('00000000-0000-0000-0000-000000000507', '00000000-0000-0000-0000-000000000303', 'Насесты и кормушки', 'Внутреннее оснащение для птицы.', '/assets/buildings/kuryatnik.png', 'money', 12000, 0, 1500, 8, 0, 'available', 20),
  ('00000000-0000-0000-0000-000000000508', '00000000-0000-0000-0000-000000000304', 'Плетень', 'Материалы и сборка ограждения.', '/assets/buildings/zagon-dlya-kur.png', 'money', 10000, 0, 1000, 10, 0, 'available', 10),
  ('00000000-0000-0000-0000-000000000509', '00000000-0000-0000-0000-000000000304', 'Навес', 'Небольшая защита от солнца и дождя.', '/assets/buildings/zagon-dlya-kur.png', 'money', 7500, 0, 2500, 3, 0, 'available', 20)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  image_url = excluded.image_url,
  contribution_type = excluded.contribution_type,
  target_amount = excluded.target_amount,
  collected_amount = excluded.collected_amount,
  unit_amount = excluded.unit_amount,
  quantity_total = excluded.quantity_total,
  quantity_funded = excluded.quantity_funded,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.chronicle_entries (
  id,
  type,
  building_id,
  item_id,
  title,
  text,
  public_name,
  amount,
  hours,
  is_visible,
  created_at
)
values
  ('00000000-0000-0000-0000-000000000601', 'donation', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000501', 'Первый вклад в горн', 'поддержал горн кузницы', 'Иван Петров', 5000, null, true, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000602', 'volunteer_hours', '00000000-0000-0000-0000-000000000301', null, 'Волонтерский выезд', 'заявила волонтерский выезд к кузнице', 'Артель из Казани', null, 120, true, now() - interval '5 hours'),
  ('00000000-0000-0000-0000-000000000603', 'donation', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000502', 'Кровля кузницы', 'закрыла часть кровли кузницы', 'Мария Соколова', 3000, null, true, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000604', 'donation', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000505', 'Плодовое дерево', 'подарил плодовое дерево для огородов', 'Тайный доброхот', 3000, null, true, now() - interval '2 days')
on conflict (id) do update set
  title = excluded.title,
  text = excluded.text,
  public_name = excluded.public_name,
  amount = excluded.amount,
  hours = excluded.hours,
  is_visible = excluded.is_visible,
  created_at = excluded.created_at;
