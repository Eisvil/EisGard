-- Атомарный инкремент current_value у слота (вызывается из webhook)
CREATE OR REPLACE FUNCTION increment_slot_value(p_slot_id UUID, p_value INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE slots SET current_value = current_value + p_value WHERE id = p_slot_id;
END;
$$;

-- Атомарный инкремент total_raised_rub у объекта (вызывается из webhook)
CREATE OR REPLACE FUNCTION increment_object_raised(p_object_id UUID, p_value INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE objects SET total_raised_rub = total_raised_rub + p_value WHERE id = p_object_id;
END;
$$;
