-- Admin audit log: immutable record of all admin actions on sensitive entities.
-- INSERT is restricted to service_role only (server-side actions).
-- SELECT is available to admin users for accountability reviews.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL,   -- 'confirm_donation', 'delete_donation', 'set_role', 'award_points', etc.
  target_type TEXT        NOT NULL,   -- 'donation', 'profile', 'material_application', etc.
  target_id   TEXT        NOT NULL,   -- UUID or other identifier as string
  payload     JSONB,                  -- action-specific details (new values, diffs, etc.)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor   ON admin_audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_target  ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log
CREATE POLICY "audit_select_admin" ON admin_audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Only server-side service_role can write entries
CREATE POLICY "audit_insert_service" ON admin_audit_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
