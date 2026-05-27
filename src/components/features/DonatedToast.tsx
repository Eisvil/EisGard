'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { show: boolean };

export function DonatedToast({ show }: Props) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), 3000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [show]);

  return (
    <div className={`toast${visible ? ' visible' : ''}`} role="status" aria-live="polite">
      Спасибо за ваш вклад в городище!
    </div>
  );
}
