'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export default function ResetPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError('Введите email'); return; }

    setLoading(true);
    setError('');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const supabase = createBrowserSupabaseClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${siteUrl}/auth/update-password`,
    });

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <div className="auth-bg">
      <div className="auth-bg-map" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Живое Городище" width={64} height={64} />
        </div>
        <h1>Восстановление пароля</h1>
        <p className="auth-subtitle">Укажите email — пришлём ссылку для сброса</p>

        {success ? (
          <div className="auth-success">
            Письмо отправлено. Проверьте почту (и папку «Спам»).
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`input-field${error ? ' error' : ''}`}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                disabled={loading}
                autoComplete="email"
                placeholder="ivan@example.com"
              />
              {error && <p className="modal-error">{error}</p>}
            </div>

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading ? 'Отправляю…' : 'Отправить ссылку'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link href="/auth/login" className="text-link">← Вернуться ко входу</Link>
        </div>
      </div>
    </div>
  );
}
