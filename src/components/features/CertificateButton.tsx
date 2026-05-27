'use client';

import { useState } from 'react';

export function CertificateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/profile/certificate', { method: 'POST' });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data?.error?.message ?? 'Не удалось сгенерировать сертификат. Попробуйте позже.';
        setError(msg);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sertifikat-uchastnika.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Не удалось подключиться к сервису. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        className="cert-btn"
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? 'Генерируется...' : 'Скачать сертификат'}
      </button>
      {error && <p className="cert-error">{error}</p>}
    </div>
  );
}
