-- US-013: поиск профиля по email для ручного доната
CREATE OR REPLACE FUNCTION find_user_by_email(p_email TEXT)
RETURNS TABLE(id UUID, full_name TEXT, role TEXT, points INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.role, p.points
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE lower(u.email) = lower(p_email)
  LIMIT 1;
END;
$$;

-- US-015: постраничный список пользователей с email
CREATE OR REPLACE FUNCTION get_users_with_email(
  p_limit  INT     DEFAULT 50,
  p_offset INT     DEFAULT 0,
  p_search TEXT    DEFAULT NULL,
  p_role   TEXT    DEFAULT NULL
)
RETURNS TABLE(
  id         UUID,
  full_name  TEXT,
  email      TEXT,
  role       TEXT,
  points     INTEGER,
  title_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    u.email,
    p.role,
    p.points,
    t.name  AS title_name,
    p.avatar_url,
    p.created_at
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  LEFT  JOIN public.titles t ON t.id = p.title_id
  WHERE
    (p_search IS NULL OR
     p.full_name ILIKE '%' || p_search || '%' OR
     u.email     ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR p.role = p_role)
  ORDER BY p.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

-- US-015: счётчик пользователей для пагинации
CREATE OR REPLACE FUNCTION count_users(
  p_search TEXT DEFAULT NULL,
  p_role   TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  cnt BIGINT;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.id
  WHERE
    (p_search IS NULL OR
     p.full_name ILIKE '%' || p_search || '%' OR
     u.email     ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR p.role = p_role);
  RETURN cnt;
END;
$$;
