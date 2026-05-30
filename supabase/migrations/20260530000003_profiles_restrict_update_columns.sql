-- Security: prevent users from escalating their own role via direct Supabase client calls.
-- The previous profiles_update_own policy allowed ANY column update on own row,
-- meaning a user could PATCH { role: 'admin' } directly and bypass API validation.

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- New policy: user can update own row only if role stays the same.
-- The WITH CHECK re-reads the current role from DB and compares to the proposed new value.
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );
