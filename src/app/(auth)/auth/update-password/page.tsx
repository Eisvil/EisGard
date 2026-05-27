'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

const PASSWORD_RE = /^(?=.*\d).{8,}$/;

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!password) {
      newErrors.password = 'Введите пароль';
    } else if (!PASSWORD_RE.test(password)) {
      newErrors.password = 'Минимум 8 символов и одна цифра';
    }
    if (!confirm) {
      newErrors.confirm = 'Повторите пароль';
    } else if (password !== confirm) {
      newErrors.confirm = 'Пароли не совпадают';
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setErrors({});

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/'), 2000);
  }

  if (done) {
    return (
      <div className="auth-bg">
        <div className="auth-bg-map" aria-hidden="true" />
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/logo.png" alt="Живое Городище" width={64} height={64} />
          </div>
          <div className="auth-success">
            Пароль успешно изменён. Перенаправляю…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <div className="auth-bg-map" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Живое Городище" width={64} height={64} />
        </div>
        <h1>Новый пароль</h1>
        <p className="auth-subtitle">Придумайте надёжный пароль для аккаунта</p>

        {errors.general && (
          <div className="auth-alert">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-field">
            <label htmlFor="password">Новый пароль</label>
            <input
              id="password"
              type="password"
              className={`input-field${errors.password ? ' error' : ''}`}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.password && <p className="modal-error">{errors.password}</p>}
            <p className="auth-hint">Минимум 8 символов и одна цифра</p>
          </div>

          <div className="modal-field">
            <label htmlFor="confirm">Повторите пароль</label>
            <input
              id="confirm"
              type="password"
              className={`input-field${errors.confirm ? ' error' : ''}`}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: undefined })); }}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.confirm && <p className="modal-error">{errors.confirm}</p>}
          </div>

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? 'Сохраняю…' : 'Сохранить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
}
