import { createHash } from 'crypto';

interface WebhookFields {
  notification_type: string;
  operation_id: string;
  amount: string;
  currency: string;
  datetime: string;
  sender: string;
  codepro: string;
  label: string;
  sha1_hash: string;
}

export function verifyWebhookSignature(fields: WebhookFields, secret: string): boolean {
  const str = [
    fields.notification_type,
    fields.operation_id,
    fields.amount,
    fields.currency,
    fields.datetime,
    fields.sender,
    fields.codepro,
    secret,
    fields.label,
  ].join('&');

  const computed = createHash('sha1').update(str).digest('hex');
  return computed === fields.sha1_hash;
}

// card-incoming notifications append 'unaccepted' field to the SHA-1 string
export function verifyCardSignature(fields: WebhookFields, secret: string, unaccepted: string): boolean {
  const str = [
    fields.notification_type,
    fields.operation_id,
    fields.amount,
    fields.currency,
    fields.datetime,
    fields.sender,
    fields.codepro,
    secret,
    fields.label,
    unaccepted,
  ].join('&');

  const computed = createHash('sha1').update(str).digest('hex');
  console.log('[ymoney-card] str:', JSON.stringify(str));
  console.log('[ymoney-card] computed:', computed);
  console.log('[ymoney-card] received:', fields.sha1_hash);
  console.log('[ymoney-card] match:', computed === fields.sha1_hash);
  return computed === fields.sha1_hash;
}

interface QuickpayParams {
  wallet: string;
  sum: number;
  label: string;
  targets: string;
  successURL: string;
}

export function buildQuickpayUrl(params: QuickpayParams): string {
  const base = 'https://yoomoney.ru/quickpay/confirm.xml';
  const query = new URLSearchParams({
    receiver: params.wallet,
    'quickpay-form': 'button',
    targets: params.targets,
    sum: params.sum.toFixed(2),
    label: params.label,
    successURL: params.successURL,
  });
  return `${base}?${query.toString()}`;
}
