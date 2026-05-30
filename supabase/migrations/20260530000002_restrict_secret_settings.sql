-- Security: restrict public read access to sensitive settings keys
-- ymoney_notification_secret is the webhook signing secret — readable by any
-- authenticated user via the old settings_select_public policy.
-- ymoney_wallet is the payment wallet number — public exposure enables phishing.

DROP POLICY IF EXISTS "settings_select_public" ON settings;

CREATE POLICY "settings_select_public" ON settings
  FOR SELECT
  USING (key NOT IN ('ymoney_notification_secret', 'ymoney_wallet'));

-- Admin retains full access via the existing settings_all_admin policy.
