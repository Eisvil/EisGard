'use client';

import { useState } from 'react';

export type MaterialItem = {
  id: string;
  name: string;
  unit: string;
  needed_qty: number | null;
  received_qty: number;
};

type Props = {
  material: MaterialItem;
  onClose: () => void;
  onSuccess: () => void;
};

export function MaterialModal({ material, onClose, onSuccess }: Props) {
  const [quantity, setQuantity] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): string {
    const qty = parseFloat(quantity.replace(',', '.'));
    if (!quantity || isNaN(qty) || qty <= 0) {
      return 'Укажите количество';
    }
    if (!phone.trim() && !telegram.trim()) {
      return 'Укажите телефон или Telegram для связи';
    }
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        material_id: material.id,
        quantity: parseFloat(quantity.replace(',', '.')),
      };
      if (phone.trim()) body.contact_phone = phone.trim();
      if (telegram.trim()) body.contact_telegram = telegram.trim();
      if (comment.trim()) body.comment = comment.trim();

      const res = await fetch('/api/material-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json() as {
        data?: { id: string };
        error?: { code: string; message: string };
      };

      if (!res.ok) {
        const code = json.error?.code;
        if (code === 'MATERIAL_INACTIVE') {
          setError('Этот материал больше не принимается.');
        } else {
          setError(json.error?.message ?? 'Произошла ошибка. Попробуйте ещё раз.');
        }
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setTimeout(onSuccess, 1800);
    } catch {
      setError('Нет соединения. Попробуйте ещё раз.');
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="modal-sheet">
        {submitted ? (
          <div className="volunteer-success">
            <div className="volunteer-success-icon">✓</div>
            <h2>Заявка принята!</h2>
            <p>Мы свяжемся с вами для уточнения деталей по материалу «{material.name}».</p>
          </div>
        ) : (
          <>
            <h2>Пожертвовать материал</h2>
            <p className="modal-subtitle">{material.name}</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-field">
                <label htmlFor="mat-qty">
                  Количество <span className="modal-field-hint">({material.unit})</span>
                </label>
                <input
                  id="mat-qty"
                  type="text"
                  inputMode="decimal"
                  className="input-field"
                  placeholder={`Напр.: 5`}
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setError(''); }}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <div className="modal-field">
                <label htmlFor="mat-phone">Телефон</label>
                <input
                  id="mat-phone"
                  type="tel"
                  className="input-field"
                  placeholder="+7 900 000-00-00"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(''); }}
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>

              <div className="modal-field">
                <label htmlFor="mat-telegram">
                  Telegram <span className="modal-field-hint">(необязательно, если указан телефон)</span>
                </label>
                <input
                  id="mat-telegram"
                  type="text"
                  className="input-field"
                  placeholder="@username"
                  value={telegram}
                  onChange={(e) => { setTelegram(e.target.value); setError(''); }}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <div className="modal-field">
                <label htmlFor="mat-comment">
                  Комментарий <span className="modal-field-hint">(необязательно, до 500 знаков)</span>
                </label>
                <textarea
                  id="mat-comment"
                  rows={3}
                  maxLength={500}
                  className="input-field"
                  placeholder="Уточните состояние, место передачи или другие детали..."
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); }}
                  disabled={loading}
                  style={{ resize: 'vertical', minHeight: '72px' }}
                />
              </div>

              {error && <p className="modal-error" style={{ marginBottom: '12px' }}>{error}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={onClose}
                  disabled={loading}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                  style={{ padding: '12px 28px' }}
                >
                  {loading ? 'Отправка...' : 'Отправить заявку'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
