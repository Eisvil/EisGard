-- Fix: SECURITY DEFINER functions require explicit SET search_path = public
-- in newer Supabase/GoTrue versions, otherwise the trigger cannot find the profiles table.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Участник'));
  RETURN NEW;
END;
$$;
