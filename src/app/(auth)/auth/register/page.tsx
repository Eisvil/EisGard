'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

const FULL_NAME_RE = /^[\p{L}\s\-]{2,120}$/u;
const PASSWORD_RE = /^(?=.*\d).{8,}$/;

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    consent?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!fullName.trim()) {
      e.fullName = 'Введите имя';
    } else if (!FULL_NAME_RE.test(fullName.trim())) {
      e.fullName = 'Имя: 2–120 символов, только буквы, пробел, дефис';
    }
    if (!email) {
      e.email = 'Введите email';
    } else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      e.email = 'Некорректный email';
    }
    if (!password) {
      e.password = 'Введите пароль';
    } else if (!PASSWORD_RE.test(password)) {
      e.password = 'Минимум 8 символов и хотя бы одна цифра';
    }
    if (!consent) {
      e.consent = 'Необходимо согласие на обработку персональных данных';
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setErrors({});

    const supabase = createBrowserSupabaseClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${siteUrl}/auth/verify-email`,
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.status === 422) {
        setErrors({ email: 'Этот email уже зарегистрирован' });
      } else {
        setErrors({ general: error.message });
      }
      setLoading(false);
      return;
    }

    router.push('/auth/verify-email');
  }

  return (
    <div className="auth-bg">
      <div className="auth-bg-map" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Живое Городище" width={64} height={64} />
        </div>
        <h1>Стать участником</h1>
        <p className="auth-subtitle">Создайте аккаунт и присоединяйтесь к строительству</p>

        {errors.general && (
          <div className="auth-alert">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-field">
            <label htmlFor="fullName">Имя и фамилия</label>
            <input
              id="fullName"
              type="text"
              className={`input-field${errors.fullName ? ' error' : ''}`}
              value={fullName}
              onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: undefined })); }}
              disabled={loading}
              autoComplete="name"
              placeholder="Иван Петров"
            />
            {errors.fullName && <p className="modal-error">{errors.fullName}</p>}
          </div>

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
              autoComplete="new-password"
            />
            {errors.password && <p className="modal-error">{errors.password}</p>}
            <p className="auth-hint">Минимум 8 символов и одна цифра</p>
          </div>

          <div>
            <div className="auth-consent">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={e => { setConsent(e.target.checked); setErrors(p => ({ ...p, consent: undefined })); }}
                disabled={loading}
              />
              <label htmlFor="consent" className="auth-consent-label">
                Я согласен(а) на{' '}
                <Link href="/personal-data" target="_blank" rel="noopener noreferrer">
                  обработку персональных данных
                </Link>
              </label>
            </div>
            {errors.consent && <p className="auth-consent-error">{errors.consent}</p>}
          </div>

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? 'Регистрирую…' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="text-link">Войти</Link>
        </div>
      </div>
    </div>
  );
}
