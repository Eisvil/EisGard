'use client';

import { useState } from 'react';
import { SubscribeModal } from './SubscribeModal';

type Props = {
  objectId: string;
  objectSlug: string;
  objectName: string;
  defaultName?: string;
};

export function SubscribeSectionClient({ objectId, objectSlug, objectName, defaultName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="subscribe-section">
      <button
        type="button"
        className="text-link subscribe-btn"
        onClick={() => setOpen(true)}
      >
        ↻ Ежемесячная поддержка
      </button>
      {open && (
        <SubscribeModal
          objectId={objectId}
          objectSlug={objectSlug}
          objectName={objectName}
          defaultName={defaultName}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
