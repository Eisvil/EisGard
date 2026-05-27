-- Seed: тестовые материалы для раздела /materials
-- Идемпотентная: INSERT ... ON CONFLICT DO NOTHING

-- Кузница
INSERT INTO materials (id, name, description, unit, needed_qty, received_qty, object_id, is_active, sort_order)
SELECT
  '11111111-0001-0000-0000-000000000000'::uuid,
  'Дубовый уголь (кузнечный)',
  'Для кузнечного горна. Фракция 25–50 мм, без пыли.',
  'кг',
  200,
  48,
  o.id,
  true,
  1
FROM objects o WHERE o.slug = 'kuznitsa'
ON CONFLICT (id) DO NOTHING;

INSERT INTO materials (id, name, description, unit, needed_qty, received_qty, object_id, is_active, sort_order)
SELECT
  '11111111-0002-0000-0000-000000000000'::uuid,
  'Прокат арматурный Ø12 мм',
  'Сталь Ст3, прутки 6 м. Используется для поковок и инструмента.',
  'м',
  80,
  15,
  o.id,
  true,
  2
FROM objects o WHERE o.slug = 'kuznitsa'
ON CONFLICT (id) DO NOTHING;

-- Гончарная мастерская
INSERT INTO materials (id, name, description, unit, needed_qty, received_qty, object_id, is_active, sort_order)
SELECT
  '11111111-0003-0000-0000-000000000000'::uuid,
  'Глина керамическая жирная',
  'Беложгущаяся или светло-серая. Без посторонних примесей.',
  'кг',
  150,
  0,
  o.id,
  true,
  1
FROM objects o WHERE o.slug = 'goncharnaya'
ON CONFLICT (id) DO NOTHING;

-- Жилые избы
INSERT INTO materials (id, name, description, unit, needed_qty, received_qty, object_id, is_active, sort_order)
SELECT
  '11111111-0004-0000-0000-000000000000'::uuid,
  'Брёвна сосновые Ø24–28 см',
  'Длина 6 м, сухостой или зимний сруб. Для возведения стен.',
  'шт',
  60,
  12,
  o.id,
  true,
  1
FROM objects o WHERE o.slug = 'zhilye-izby'
ON CONFLICT (id) DO NOTHING;

INSERT INTO materials (id, name, description, unit, needed_qty, received_qty, object_id, is_active, sort_order)
SELECT
  '11111111-0005-0000-0000-000000000000'::uuid,
  'Доски обрезные 50×150 мм',
  'Сосна, длина 4–6 м. Для полов и перекрытий.',
  'м³',
  4,
  0,
  o.id,
  true,
  2
FROM objects o WHERE o.slug = 'zhilye-izby'
ON CONFLICT (id) DO NOTHING;

-- Общие материалы (без привязки к объекту)
INSERT INTO materials (id, name, description, unit, needed_qty, received_qty, object_id, is_active, sort_order)
VALUES
  ('11111111-0006-0000-0000-000000000000'::uuid,
   'Гвозди кованые (реплика)',
   'Железные гвозди 80–120 мм ручной ковки или качественная реплика.',
   'кг', 30, 5, NULL, true, 10),
  ('11111111-0007-0000-0000-000000000000'::uuid,
   'Известь строительная негашёная',
   'Для кладки, штукатурки и побелки. ГОСТ 9179.',
   'кг', 500, 120, NULL, true, 11)
ON CONFLICT (id) DO NOTHING;
