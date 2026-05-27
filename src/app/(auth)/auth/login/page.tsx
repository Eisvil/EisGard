'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resentOk, setResentOk] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [next, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Введите email';
    if (!password) newErrors.password = 'Введите пароль';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setErrors({});
    setUnconfirmed(false);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setUnconfirmed(true);
      } else if (error.message.includes('Invalid login credentials')) {
        setErrors({ general: 'Неверный email или пароль' });
      } else {
        setErrors({ general: error.message });
      }
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleResend() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.resend({ type: 'signup', email });
    setResentOk(true);
  }

  return (
    <div className="auth-bg">
      <div className="auth-bg-map" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Живое Городище" width={64} height={64} />
        </div>
        <h1>Вход в аккаунт</h1>
        <p className="auth-subtitle">Войдите, чтобы участвовать в жизни Городища</p>

        {errors.general && (
          <div className="auth-alert">{errors.general}</div>
        )}

        {unconfirmed && (
          <div className="auth-alert">
            Email не подтверждён.{' '}
            {resentOk ? (
              <span>Письмо отправлено повторно.</span>
            ) : (
              <button type="button" className="text-link" onClick={handleResend}>
                Отправить ещё раз
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`input-field${errors.email ? ' error' : ''}`}
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
              disabled={loading}
              autoComplete="email"
              placeholder="ivan@example.com"
            />
            {errors.email && <p className="modal-error">{errors.email}</p>}
          </div>

          <div className="modal-field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              className={`input-field${errors.password ? ' error' : ''}`}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && <p className="modal-error">{errors.password}</p>}
          </div>

          <div className="auth-forgot">
            <Link href="/auth/reset" className="text-link">Забыли пароль?</Link>
          </div>

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? 'Вхожу…' : 'Войти'}
          </button>
        </form>

        <div className="auth-footer">
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="text-link">Зарегистрироваться</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
