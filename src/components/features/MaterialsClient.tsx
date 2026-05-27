'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MaterialModal } from './MaterialModal';
import type { MaterialItem } from './MaterialModal';

type MaterialWithObject = MaterialItem & {
  percent: number;
  object_name: string | null;
  object_slug: string | null;
};

type Props = {
  materials: MaterialWithObject[];
  isLoggedIn: boolean;
};

export function MaterialsClient({ materials, isLoggedIn }: Props) {
  const [activeMaterial, setActiveMaterial] = useState<MaterialWithObject | null>(null);
  const [donatedIds, setDonatedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  function handleDonate(material: MaterialWithObject) {
    if (!isLoggedIn) {
      router.push('/auth/login?next=/materials');
      return;
    }
    setActiveMaterial(material);
  }

  function handleSuccess(id: string) {
    setDonatedIds((prev) => new Set([...prev, id]));
    setActiveMaterial(null);
  }

  return (
    <>
      <div className="materials-list">
        {materials.map((m) => {
          const donated = donatedIds.has(m.id);
          const isFull = m.percent >= 100;

          return (
            <div key={m.id} className="material-row panel">
              <div className="material-row-info">
                <div className="material-row-top">
                  <span className="material-name">{m.name}</span>
                  {m.object_name && (
                    <span className="material-object-tag">{m.object_name}</span>
                  )}
                </div>
                {m.needed_qty !== null && (
                  <div className="material-progress-wrap">
                    <div className="mini-progress" style={{ marginBottom: '4px' }}>
                      <span style={{ width: `${m.percent}%` }} />
                    </div>
                    <div className="material-qty-row">
                      <span className="material-qty-text">
                        {formatQty(m.received_qty, m.unit)} из {formatQty(m.needed_qty, m.unit)}
                      </span>
                      <span className="material-percent">{m.percent}%</span>
                    </div>
                  </div>
                )}
                {m.needed_qty === null && (
                  <p className="material-qty-text" style={{ margin: '4px 0 0' }}>
                    Получено: {formatQty(m.received_qty, m.unit)}
                  </p>
                )}
              </div>
              <div className="material-row-action">
                {donated ? (
                  <p className="material-donated-msg">Заявка подана</p>
                ) : (
                  <button
                    className="primary-button"
                    disabled={isFull}
                    onClick={() => handleDonate(m)}
                    style={{ padding: '10px 22px', fontSize: '14px', whiteSpace: 'nowrap' }}
                  >
                    {isFull ? 'Набрали' : 'Пожертвовать'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeMaterial && (
        <MaterialModal
          material={activeMaterial}
          onClose={() => setActiveMaterial(null)}
          onSuccess={() => handleSuccess(activeMaterial.id)}
        />
      )}
    </>
  );
}

function formatQty(qty: number, unit: string): string {
  const n = Number.isInteger(qty) ? qty : parseFloat(qty.toFixed(2));
  return `${n.toLocaleString('ru-RU')} ${unit}`;
}
