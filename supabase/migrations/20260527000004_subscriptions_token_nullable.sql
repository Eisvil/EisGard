-- US-003: ymoney_token nullable — recurring token приходит только при merchant API.
-- P2P quickpay токен не возвращает; поле заполняется при наличии.
ALTER TABLE subscriptions ALTER COLUMN ymoney_token DROP NOT NULL;
