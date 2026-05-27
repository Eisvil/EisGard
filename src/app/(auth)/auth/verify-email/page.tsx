import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="auth-bg">
      <div className="auth-bg-map" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Живое Городище" width={64} height={64} />
        </div>
        <h1>Подтвердите почту</h1>
        <p className="auth-subtitle">
          Мы отправили письмо со ссылкой для подтверждения. Перейдите по ссылке,
          чтобы активировать аккаунт.
        </p>
        <p className="auth-hint">
          Не получили письмо? Проверьте папку «Спам» или вернитесь и попробуйте снова.
        </p>
        <div className="auth-footer">
          <Link href="/auth/login" className="text-link">
            ← Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}
