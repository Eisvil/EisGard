'use client';

import { useState } from 'react';

type Props = {
  objectId: string;
  objectSlug: string;
  objectName: string;
  defaultName?: string;
  onClose: () => void;
};

export function SubscribeModal({ objectId, objectSlug, objectName, defaultName, onClose }: Props) {
  const [amount, setAmount] = useState('300');
  const [displayName, setDisplayName] = useState(defaultName ?? '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [nameError, setNameError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    let ok = true;
    const kopecks = Math.round(parseFloat(amount || '0') * 100);
    if (!amount || kopecks < 30000) {
      setAmountError('Минимальная сумма 300 ₽/мес');
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
    setGeneralError('');
    if (!validate()) return;

    setLoading(true);
    const kopecks = Math.round(parseFloat(amount) * 100);

    try {
      const res = await fetch('/api/donations/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_id: objectId,
          object_slug: objectSlug,
          amount_kopecks: kopecks,
          display_name: displayName.trim(),
          is_anonymous: isAnonymous,
        }),
      });

      const json = await res.json() as {
        data?: { redirect_url: string };
        error?: { code: string; message: string };
      };

      if (json.error?.code === 'ALREADY_SUBSCRIBED') {
        setGeneralError('У вас уже есть активная подписка на этот объект. Управляйте ею в личном кабинете.');
        setLoading(false);
        return;
      }

      if (!res.ok || !json.data?.redirect_url) {
        setGeneralError(json.error?.message ?? 'Ошибка. Попробуйте ещё раз.');
        setLoading(false);
        return;
      }

      window.location.href = json.data.redirect_url;
    } catch {
      setGeneralError('Нет соединения. Попробуйте ещё раз.');
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-sheet">
        <h2>Ежемесячная поддержка</h2>
        <p className="modal-subtitle">{objectName} · автоматически каждый месяц</p>

        {generalError && (
          <div className="modal-general-error">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-field">
            <label htmlFor="sub-amount">
              Сумма в месяц (₽) <span className="modal-field-hint">от 300 ₽</span>
            </label>
            <input
              id="sub-amount"
              type="number"
              min="300"
              step="100"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
              className={`input-field${amountError ? ' error' : ''}`}
              placeholder="300"
              disabled={loading}
            />
            {amountError && <p className="modal-error">{amountError}</p>}
          </div>

          <div className="modal-field">
            <label htmlFor="sub-name">Имя в летописи</label>
            <input
              id="sub-name"
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
            Поддерживать анонимно
          </label>

          <p className="modal-hint">
            Первое списание — сейчас. Следующие — 1-го числа каждого месяца.
            Отменить можно в любой момент в личном кабинете.
          </p>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Переход...' : 'Подключить подписку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
