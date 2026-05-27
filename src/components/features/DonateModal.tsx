'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/utils/formatMoney';

export type SlotForDonate = {
  id: string;
  name: string;
  goal_value: number;
  current_value: number;
  unit: string;
};

type Props = {
  slot: SlotForDonate;
  objectId: string;
  objectSlug: string;
  defaultName?: string;
  onClose: () => void;
};

export function DonateModal({ slot, objectId, objectSlug, defaultName, onClose }: Props) {
  const [amount, setAmount] = useState('1000');
  const [displayName, setDisplayName] = useState(defaultName ?? '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    let ok = true;
    const kopecks = Math.round(parseFloat(amount || '0') * 100);
    if (!amount || kopecks < 10000) {
      setAmountError('Минимальная сумма 100 ₽');
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

    try {
      const res = await fetch('/api/donations/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_id: objectId,
          object_slug: objectSlug,
          slot_id: slot.id,
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
    } catch {
      setAmountError('Нет соединения. Попробуйте ещё раз.');
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sheet">
        <h2>Поддержать деньгами</h2>
        <p className="modal-subtitle">{slot.name} · цель {formatMoney(slot.goal_value)}</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-field">
            <label htmlFor="donate-amount">
              Сумма (₽) <span className="modal-field-hint">от 100 ₽</span>
            </label>
            <input
              id="donate-amount"
              type="number"
              min="100"
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
            <label htmlFor="donate-name">Имя в летописи</label>
            <input
              id="donate-name"
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
            Пожертвовать анонимно
          </label>

          <div className="modal-actions">
            <button type="button" className="modal-close-btn" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Переход...' : 'Перейти к оплате'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
