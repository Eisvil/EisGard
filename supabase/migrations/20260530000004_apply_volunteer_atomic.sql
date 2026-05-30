-- Security: atomically check camp availability and insert volunteer application.
-- Replaces the non-atomic check-then-insert pattern in the API route,
-- which was vulnerable to a race condition allowing overbooking.

CREATE OR REPLACE FUNCTION apply_volunteer_atomic(
  p_user_id  UUID,
  p_camp_id  UUID,
  p_comment  TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_camp_id        UUID;
  v_is_open        BOOLEAN;
  v_max_volunteers INTEGER;
  v_taken          INTEGER;
BEGIN
  -- Lock the camp row for the duration of this transaction
  SELECT id, is_open, max_volunteers
  INTO v_camp_id, v_is_open, v_max_volunteers
  FROM volunteer_camps
  WHERE id = p_camp_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  IF NOT v_is_open THEN
    RETURN QUERY SELECT false, 'CAMP_CLOSED'::TEXT;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_taken
  FROM volunteer_applications
  WHERE camp_id = p_camp_id
    AND status IN ('pending', 'approved');

  IF v_taken >= v_max_volunteers THEN
    RETURN QUERY SELECT false, 'CAMP_FULL'::TEXT;
    RETURN;
  END IF;

  BEGIN
    INSERT INTO volunteer_applications (user_id, camp_id, comment, status)
    VALUES (p_user_id, p_camp_id, p_comment, 'pending');
  EXCEPTION
    WHEN unique_violation THEN
      RETURN QUERY SELECT false, 'ALREADY_APPLIED'::TEXT;
      RETURN;
  END;

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_volunteer_atomic(UUID, UUID, TEXT) TO authenticated;
