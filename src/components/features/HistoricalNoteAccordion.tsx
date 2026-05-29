'use client';

import { useState } from 'react';
import { TiptapRenderer } from './TiptapRenderer';

type Props = {
  content: Record<string, unknown>;
};

export function HistoricalNoteAccordion({ content }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="historical-note-accordion">
      <button
        type="button"
        className="historical-note-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>Историческая справка</span>
        <span style={{ fontSize: '12px', fontFamily: 'var(--sans)', fontWeight: 400 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="historical-note-body">
          <TiptapRenderer content={content} />
        </div>
      )}
    </div>
  );
}
