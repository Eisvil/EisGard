'use client';

import { useState } from 'react';

export type ObjectOption = {
  id: string;
  name: string;
};

type Props = {
  objects: ObjectOption[];
  onClose: () => void;
  onSuccess: () => void;
};

export function PartnerModal({ objects, onClose, onSuccess }: Props) {
  const [orgName, setOrgName] = useState('');
  const [inn, setInn] = useState('');
  const [supportType, setSupportType] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [objectId, setObjectId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): string {
    if (orgName.trim().length < 2) return 'Укажите название организации (минимум 2 символа)';
    if (inn.trim() && !/^\d{10}(\d{2})?$/.test(inn.trim())) return 'ИНН — 10 или 12 цифр';
    if (!supportType) return 'Выберите тип поддержки';
    if (description.trim().length < 10) return 'Описание — минимум 10 символов';
    if (contactName.trim().length < 2) return 'Укажите контактное лицо (минимум 2 символа)';
    if (!contactEmail.trim().includes('@')) return 'Укажите корректный email';
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        org_name:      orgName.trim(),
        support_type:  supportType,
        description:   description.trim(),
        contact_name:  contactName.trim(),
        contact_email: contactEmail.trim(),
      };
      if (inn.trim())          body.inn           = inn.trim();
      if (contactPhone.trim()) body.contact_phone = contactPhone.trim();
      if (objectId)            body.object_id     = objectId;

      const res = await fetch('/api/partner-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json() as {
        data?: { id: string };
        error?: { code: string; message: string };
      };

      if (!res.ok) {
        setError(json.error?.message ?? 'Произошла ошибка. Попробуйте ещё раз.');
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
            <p>Спасибо! Мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 className="modal-subtitle">Заявка на партнёрство</h2>

            <div className="modal-field">
              <label htmlFor="partner-org-name">Название организации</label>
              <input
                id="partner-org-name"
                type="text"
                className="input-field"
                placeholder="ООО «МеталлМастер»"
                value={orgName}
                onChange={(e) => { setOrgName(e.target.value); setError(''); }}
                disabled={loading}
                maxLength={200}
                autoComplete="organization"
              />
            </div>

            <div className="modal-field">
              <label htmlFor="partner-inn">
                ИНН <span className="modal-field-hint">(необязательно, 10 или 12 цифр)</span>
              </label>
              <input
                id="partner-inn"
                type="text"
                inputMode="numeric"
                className="input-field"
                placeholder="1234567890"
                value={inn}
                onChange={(e) => { setInn(e.target.value); setError(''); }}
                disabled={loading}
                maxLength={12}
                autoComplete="off"
              />
            </div>

            <div className="modal-field">
              <label htmlFor="partner-support-type">Тип поддержки</label>
              <select
                id="partner-support-type"
                className="input-field"
                value={supportType}
                onChange={(e) => { setSupportType(e.target.value); setError(''); }}
                disabled={loading}
              >
                <option value="">— выберите —</option>
                <option value="money">Финансирование</option>
                <option value="materials">Материалы</option>
                <option value="services">Услуги / работы</option>
                <option value="complex">Комплексная поддержка</option>
              </select>
            </div>

            <div className="modal-field">
              <label htmlFor="partner-description">Описание предложения</label>
              <textarea
                id="partner-description"
                className="input-field"
                placeholder="Опишите, что именно вы готовы предложить проекту…"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setError(''); }}
                disabled={loading}
                rows={4}
                maxLength={2000}
                style={{ resize: 'vertical', minHeight: '96px' }}
              />
            </div>

            <div className="modal-field">
              <label htmlFor="partner-contact-name">Контактное лицо</label>
              <input
                id="partner-contact-name"
                type="text"
                className="input-field"
                placeholder="Иван Иванов"
                value={contactName}
                onChange={(e) => { setContactName(e.target.value); setError(''); }}
                disabled={loading}
                maxLength={120}
                autoComplete="name"
              />
            </div>

            <div className="modal-field">
              <label htmlFor="partner-contact-email">Email</label>
              <input
                id="partner-contact-email"
                type="email"
                className="input-field"
                placeholder="ivan@company.ru"
                value={contactEmail}
                onChange={(e) => { setContactEmail(e.target.value); setError(''); }}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="modal-field">
              <label htmlFor="partner-contact-phone">
                Телефон <span className="modal-field-hint">(необязательно)</span>
              </label>
              <input
                id="partner-contact-phone"
                type="tel"
                className="input-field"
                placeholder="+7 921 000 00 00"
                value={contactPhone}
                onChange={(e) => { setContactPhone(e.target.value); setError(''); }}
                disabled={loading}
                autoComplete="tel"
              />
            </div>

            <div className="modal-field">
              <label htmlFor="partner-object">
                Объект <span className="modal-field-hint">(необязательно)</span>
              </label>
              <select
                id="partner-object"
                className="input-field"
                value={objectId}
                onChange={(e) => setObjectId(e.target.value)}
                disabled={loading}
              >
                <option value="">Не указан (общая поддержка проекта)</option>
                {objects.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? 'Отправляем…' : 'Отправить заявку'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
