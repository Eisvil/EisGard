-- The old constraint (>= 10000) blocked webhook updates when ЮMoney deducted
-- their commission (e.g. user pays 100₽ but 97₽ arrives → 9700 kopecks < 10000).
-- Minimum-amount enforcement belongs at the API layer, not here.
ALTER TABLE donations DROP CONSTRAINT donations_amount_kopecks_check;
ALTER TABLE donations ADD CONSTRAINT donations_amount_kopecks_check CHECK (amount_kopecks > 0);
