'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/utils/formatMoney';

export type SupportModalProps = {
  objectId?: string | null;
  slotId?: string | null;
  slotName?: string;
  objectName?: string;
  objectSlug?: string;
  defaultName?: string;
  onClose: () => void;
};

type Tab = 'once' | 'monthly';

export function SupportModal({
  objectId,
  slotId,
  slotName,
  objectName,
  objectSlug,
  defaultName,
  onClose,
}: SupportModalProps) {
  const [tab, setTab] = useState<Tab>('once');
  const [amount, setAmount] = useState('1000');
  const [displayName, setDisplayName] = useState(defaultName ?? '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const minRub = 100;

  function validate(): boolean {
    let ok = true;
    const kopecks = Math.round(parseFloat(amount || '0') * 100);
    if (!amount || kopecks < 10000) {
      setAmountError(`Минимальная сумма ${minRub} ₽`);
      ok = false;
    } else {
      setAmountError('');
    }
    if (!displayName.trim() || displayName.trim().length < 2) {
      setNameError('Укажите имя (минимум 2 символа)');
      ok = false;
    } else {
      setNameError('');
    }
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const kopecks = Math.round(parseFloat(amount) * 100);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const successURL = objectSlug
      ? `${siteUrl}/objects/${objectSlug}?donated=true`
      : `${siteUrl}/?donated=true`;

    try {
      if (tab === 'once') {
        const res = await fetch('/api/donations/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            object_id: objectId ?? null,
            object_slug: objectSlug ?? null,
            slot_id: slotId ?? null,
            amount_kopecks: kopecks,
            display_name: displayName.trim(),
            is_anonymous: isAnonymous,
          }),
        });
        const json = await res.json() as { data?: { redirect_url: string }; error?: { message: string } };
        if (!res.ok || !json.data?.redirect_url) {
          setAmountError(json.error?.message ?? 'Ошибка. Попробуйте ещё раз.');
          setLoading(false);
          return;
        }
        window.location.href = json.data.redirect_url;
      } else {
        const res = await fetch('/api/donations/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            object_id: objectId ?? null,
            object_slug: objectSlug ?? null,
            amount_kopecks: kopecks,
            display_name: displayName.trim(),
            is_anonymous: isAnonymous,
          }),
        });
        const json = await res.json() as { data?: { redirect_url: string }; error?: { message: string } };
        if (!res.ok || !json.data?.redirect_url) {
          setAmountError(json.error?.message ?? 'Ошибка. Попробуйте ещё раз.');
          setLoading(false);
          return;
        }
        window.location.href = json.data.redirect_url;
      }
    } catch {
      setAmountError('Нет соединения. Попробуйте ещё раз.');
      setLoading(false);
    }
  }

  const contextLabel = slotName
    ? slotName
    : objectName
      ? objectName
      : 'Поддержать проект';

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-sheet">
        <h2>Поддержать проект</h2>
        <p className="support-modal-context">{contextLabel}</p>

        <div className="support-modal-tabs">
          <button
            type="button"
            className={`support-modal-tab${tab === 'once' ? ' active' : ''}`}
            onClick={() => setTab('once')}
          >
            Разовый вклад
          </button>
          <button
            type="button"
            className={`support-modal-tab${tab === 'monthly' ? ' active' : ''}`}
            onClick={() => setTab('monthly')}
          >
            Ежемесячно
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-field">
            <label htmlFor="support-amount">
              Сумма (₽){' '}
              <span className="modal-field-hint">
                от {minRub} ₽{tab === 'monthly' ? '/мес.' : ''}
              </span>
            </label>
            <input
              id="support-amount"
              type="number"
              min={minRub}
              step="100"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
              className={`input-field${amountError ? ' error' : ''}`}
              placeholder="1 000"
              disabled={loading}
            />
            {amountError && <p className="modal-error">{amountError}</p>}
          </div>

          <div className="modal-field">
            <label htmlFor="support-name">Имя в летописи</label>
            <input
              id="support-name"
              type="text"
              maxLength={120}
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setNameError(''); }}
              className={`input-field${nameError ? ' error' : ''}`}
              placeholder="Ваше имя"
              disabled={loading}
            />
            {nameError && <p className="modal-error">{nameError}</p>}
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={loading}
            />
            Анонимно
          </label>

          <div className="modal-actions">
            <button type="button" className="modal-close-btn" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading
                ? 'Переход...'
                : tab === 'once'
                  ? 'Перейти к оплате'
                  : 'Оформить подписку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
