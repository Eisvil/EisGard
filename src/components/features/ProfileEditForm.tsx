'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface ProfileData {
  full_name: string;
  birth_date: string | null;
  in_chronicle: boolean;
}

interface Props {
  profile: ProfileData;
  skills: Skill[];
  userSkillIds: string[];
}

export function ProfileEditForm({ profile, skills, userSkillIds }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name);
  const [birthDate, setBirthDate] = useState(profile.birth_date ?? '');
  const [inChronicle, setInChronicle] = useState(profile.in_chronicle);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    new Set(userSkillIds),
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSkill(id: string) {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          birth_date: birthDate || null,
          in_chronicle: inChronicle,
          skill_ids: Array.from(selectedSkills),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Ошибка сохранения');
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError('Ошибка соединения. Попробуйте снова.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="profile-edit-form" onSubmit={handleSubmit}>
      <div className="profile-edit-field">
        <label className="profile-edit-label" htmlFor="full_name">
          Имя и фамилия
        </label>
        <input
          id="full_name"
          type="text"
          className="profile-edit-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          minLength={2}
          maxLength={120}
          required
        />
      </div>

      <div className="profile-edit-field">
        <label className="profile-edit-label" htmlFor="birth_date">
          Дата рождения
        </label>
        <input
          id="birth_date"
          type="date"
          className="profile-edit-input"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      {skills.length > 0 && (
        <div className="profile-edit-field">
          <span className="profile-edit-label">Мои навыки</span>
          <div className="skills-checkboxes">
            {skills.map((skill) => (
              <label key={skill.id} className="skill-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedSkills.has(skill.id)}
                  onChange={() => toggleSkill(skill.id)}
                />
                {skill.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="profile-edit-field profile-edit-field--inline">
        <label className="skill-checkbox-label">
          <input
            type="checkbox"
            checked={inChronicle}
            onChange={(e) => setInChronicle(e.target.checked)}
          />
          Отображаться в летописи
        </label>
      </div>

      <div className="profile-edit-actions">
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        {success && <span className="profile-edit-success">Сохранено!</span>}
        {error && <span className="profile-edit-error">{error}</span>}
      </div>
    </form>
  );
}
