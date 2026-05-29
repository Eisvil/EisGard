'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatMoney, getProgress } from '@/lib/utils/formatMoney';
import { SupportModal } from './SupportModal';
import { HistoricalNoteAccordion } from './HistoricalNoteAccordion';
import type { SlotForDonate } from './DonateModal';

function hasContent(note: Record<string, unknown> | null | undefined): boolean {
  if (!note) return false;
  const c = note.content;
  return Array.isArray(c) && c.length > 0;
}

type Props = {
  slots: SlotForDonate[];
  objectId: string;
  objectSlug: string;
  objectName?: string;
  defaultName?: string;
};

export function SlotsSection({ slots, objectId, objectSlug, objectName, defaultName }: Props) {
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
      <div className="slots-list">
        {slots.map((slot) => {
          const pct = getProgress(slot.current_value, slot.goal_value);
          return (
            <div key={slot.id} className="slot-card">
              {slot.image_url ? (
                <img
                  src={slot.image_url}
                  alt={slot.name}
                  className="slot-card-thumb"
                />
              ) : (
                <div className="slot-card-thumb-placeholder" />
              )}
              <div className="slot-card-body">
                <p className="slot-card-name">{slot.name}</p>
                <p className="slot-card-meta">
                  {slot.slot_type === 'labor'
                    ? `${slot.current_value} ${slot.unit} из ${slot.goal_value} ${slot.unit} · ${pct}%`
                    : `${formatMoney(slot.current_value)} из ${formatMoney(slot.goal_value)} · ${pct}%`
                  }
                </p>
                <div className="mini-progress">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
              {slot.slot_type === 'labor' ? (
                <Link href="/volunteers" className="primary-button slot-card-btn">
                  Записаться волонтёром
                </Link>
              ) : (
                <button
                  className="primary-button slot-card-btn"
                  onClick={() => setSelectedSlot(slot)}
                >
                  Поддержать
                </button>
              )}
              {hasContent(slot.historical_note) && (
                <div className="slot-card-historical-note">
                  <HistoricalNoteAccordion content={slot.historical_note!} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedSlot && (
        <SupportModal
          objectId={objectId}
          slotId={selectedSlot.id}
          slotName={selectedSlot.name}
          objectName={objectName}
          objectSlug={objectSlug}
          defaultName={defaultName}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </>
  );
}
