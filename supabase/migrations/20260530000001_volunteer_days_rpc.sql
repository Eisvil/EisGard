-- Публичный агрегат: сумма отработанных волонтёрских дней.
-- SECURITY DEFINER обходит RLS (vol_apps_select_own не пускает anon-клиент).
-- Функция возвращает только агрегат — личные данные участников не раскрываются.
CREATE OR REPLACE FUNCTION get_volunteer_days_total()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(days_worked), 0)::INTEGER
  FROM volunteer_applications
  WHERE status = 'completed';
$$;

-- Разрешаем вызов для анонимных пользователей (публичный сайт использует anon-ключ)
GRANT EXECUTE ON FUNCTION get_volunteer_days_total() TO anon, authenticated;
