'use client';

import { useEffect } from 'react';

export function ObjectViewTracker({ objectId }: { objectId: string }) {
  useEffect(() => {
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ object_id: objectId }),
    }).catch(() => {});
  }, [objectId]);
  return null;
}
