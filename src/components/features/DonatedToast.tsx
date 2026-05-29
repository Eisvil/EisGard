'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DonatedToastInner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchParams.get('donated') !== 'true') return;
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), 3000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [searchParams]);

  return (
    <div className={`toast${visible ? ' visible' : ''}`} role="status" aria-live="polite">
      Спасибо за ваш вклад в городище!
    </div>
  );
}

export function DonatedToast() {
  return (
    <Suspense fallback={null}>
      <DonatedToastInner />
    </Suspense>
  );
}
