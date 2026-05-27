-- US-003: добавляем статус 'pending' для подписок до подтверждения первого платежа.
-- Без этого подписка создавалась 'active' до оплаты — при прерыве оплаты блокировала повторную попытку.
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('pending','active','paused','cancelled','payment_failed'));
