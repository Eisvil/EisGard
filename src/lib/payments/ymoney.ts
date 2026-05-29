import { createHmac } from 'crypto';

// New ЮMoney signing (from 18 May 2026): HMAC-SHA256 of all params except 'sign',
// sorted alphabetically by key, values RFC-3986 URL-encoded, joined as key=value&...
export function verifyNotification(params: Record<string, string>, secret: string): boolean {
  const sign = params['sign'] ?? '';
  if (!sign) return false;

  const rest: Record<string, string> = { ...params };
  delete rest['sign'];

  const str = Object.keys(rest)
    .sort()
    .map(k => `${k}=${encodeURIComponent(rest[k] ?? '')}`)
    .join('&');

  const computed = createHmac('sha256', secret).update(str).digest('hex');
  return computed === sign;
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
