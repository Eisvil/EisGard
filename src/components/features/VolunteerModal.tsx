'use client';

import { useState } from 'react';
import type { Skill } from './VolunteersClient';

type Props = {
  campId: string;
  campName: string;
  campDates: string;
  skills: Skill[];
  defaultName?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function VolunteerModal({ campId, campName, campDates, skills, onClose, onSuccess }: Props) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleSkill(id: string) {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/volunteer-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camp_id: campId,
          skill_ids: selectedSkills,
          comment: comment.trim() || undefined,
        }),
      });

      const json = await res.json() as { data?: { id: string }; error?: { code: string; message: string } };

      if (!res.ok) {
        const code = json.error?.code;
        if (code === 'ALREADY_APPLIED') {
          setError('Вы уже подали заявку на этот заезд.');
        } else if (code === 'CAMP_FULL') {
          setError('Все места на этот заезд уже заняты.');
        } else if (code === 'CAMP_CLOSED') {
          setError('Набор на этот заезд закрыт.');
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
            <p>Мы свяжемся с вами для подтверждения участия в заезде «{campName}».</p>
          </div>
        ) : (
          <>
            <h2>Подать заявку</h2>
            <p className="modal-subtitle">{campName} · {campDates}</p>

            <form onSubmit={handleSubmit} noValidate>
              {skills.length > 0 && (
                <div className="modal-field">
                  <label>Ваши навыки <span className="modal-field-hint">(необязательно)</span></label>
                  <div className="skills-checkboxes">
                    {skills.map((skill) => (
                      <label key={skill.id} className="skills-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill.id)}
                          onChange={() => toggleSkill(skill.id)}
                          disabled={loading}
                        />
                        {skill.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-field">
                <label htmlFor="volunteer-comment">
                  Комментарий <span className="modal-field-hint">(необязательно, до 1000 знаков)</span>
                </label>
                <textarea
                  id="volunteer-comment"
                  maxLength={1000}
                  rows={4}
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); setError(''); }}
                  className="input-field"
                  placeholder="Расскажите немного о себе или задайте вопрос..."
                  disabled={loading}
                  style={{ resize: 'vertical', minHeight: '96px' }}
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
