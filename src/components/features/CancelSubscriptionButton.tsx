'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = { subscriptionId: string };

export function CancelSubscriptionButton({ subscriptionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/subscriptions/${subscriptionId}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  }

  return (
    <button
      type="button"
      className="cancel-sub-btn"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? 'Отмена...' : confirmed ? 'Подтвердить отмену' : 'Отменить'}
    </button>
  );
}
