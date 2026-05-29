-- increment_points должна иметь SECURITY DEFINER чтобы всегда выполняться
-- с правами владельца (обходить RLS) независимо от вызывающей роли.
-- Без этого вызов через anon/authenticated клиент блокируется RLS на profiles.
CREATE OR REPLACE FUNCTION public.increment_points(p_user_id uuid, p_points integer)
  RETURNS profiles
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE result profiles;
BEGIN
  UPDATE profiles SET points = points + p_points WHERE id = p_user_id RETURNING * INTO result;
  RETURN result;
END;
$$;
