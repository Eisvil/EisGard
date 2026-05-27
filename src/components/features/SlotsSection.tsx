'use client';

import { useState } from 'react';
import { formatMoney, getProgress } from '@/lib/utils/formatMoney';
import { DonateModal, type SlotForDonate } from './DonateModal';

type Props = {
  slots: SlotForDonate[];
  objectId: string;
  objectSlug: string;
  defaultName?: string;
};

export function SlotsSection({ slots, objectId, objectSlug, defaultName }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<SlotForDonate | null>(null);

  if (slots.length === 0) {
    return (
      <p style={{ color: 'var(--olive-soft)', fontFamily: 'var(--sans)', marginBottom: '32px' }}>
        Слоты пока не добавлены. Следите за обновлениями.
      </p>
    );
  }

  return (
    <>
      <div className="slots-grid">
        {slots.map((slot) => {
          const pct = getProgress(slot.current_value, slot.goal_value);
          return (
            <div key={slot.id} className="slot-card">
              <p className="slot-card-name">{slot.name}</p>
              <p className="slot-card-meta">
                {formatMoney(slot.current_value)} из {formatMoney(slot.goal_value)} · {pct}%
              </p>
              <div className="mini-progress">
                <span style={{ width: `${pct}%` }} />
              </div>
              <button
                className="primary-button"
                style={{ width: '100%', fontSize: '15px', padding: '10px 0' }}
                onClick={() => setSelectedSlot(slot)}
              >
                Поддержать деньгами
              </button>
            </div>
          );
        })}
      </div>

      {selectedSlot && (
        <DonateModal
          slot={selectedSlot}
          objectId={objectId}
          objectSlug={objectSlug}
          defaultName={defaultName}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </>
  );
}
