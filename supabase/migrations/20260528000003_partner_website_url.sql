-- Add partner_website_url to partner_applications and object_partners
ALTER TABLE partner_applications
  ADD COLUMN IF NOT EXISTS partner_website_url TEXT;

ALTER TABLE object_partners
  ADD COLUMN IF NOT EXISTS partner_website_url TEXT;
