-- Link object_partners back to the originating partner_application
ALTER TABLE object_partners
  ADD COLUMN IF NOT EXISTS partner_application_id UUID
    REFERENCES partner_applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_object_partners_app_id
  ON object_partners(partner_application_id);
