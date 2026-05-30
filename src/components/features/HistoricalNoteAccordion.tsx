'use client';

import { useState } from 'react';
import { TiptapRenderer } from './TiptapRenderer';

type Props = {
  content: Record<string, unknown>;
};

function hasRealContent(content: Record<string, unknown>): boolean {
  const nodes = content.content;
  if (!Array.isArray(nodes) || nodes.length === 0) return false;
  return nodes.some((node: unknown) => {
    const n = node as Record<string, unknown>;
    const children = n.content as unknown[] | undefined;
    return Array.isArray(children) && children.length > 0;
  });
}

export function HistoricalNoteAccordion({ content }: Props) {
  const [open, setOpen] = useState(false);

  if (!hasRealContent(content)) return null;

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
