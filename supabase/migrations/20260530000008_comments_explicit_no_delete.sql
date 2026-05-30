-- Security/documentation: object_comments uses soft-delete (is_deleted flag).
-- Physical DELETE is blocked by RLS default-deny for regular users.
-- Admin deletion is handled via comments_all_admin policy (FOR ALL).
-- This migration makes the intent explicit to prevent future confusion.

COMMENT ON TABLE object_comments IS
  'Soft-delete table: use is_deleted=true instead of physical DELETE. '
  'Physical DELETE by users is blocked by RLS default-deny. '
  'Admin soft-deletes via PATCH (is_deleted=true) through comments_all_admin policy.';

-- Explicit policy: block physical DELETE for non-admin users to make intent clear
-- (RLS already denies by default, but explicit is better than implicit)
CREATE POLICY "comments_no_delete_users" ON object_comments
  FOR DELETE
  USING (false);
