'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { MaterialModal } from './MaterialModal';
import type { MaterialItem } from './MaterialModal';

type MaterialWithObject = MaterialItem & {
  percent: number;
  object_name: string | null;
  object_slug: string | null;
};

type Props = {
  materials: MaterialWithObject[];
};

export function MaterialsClient({ materials }: Props) {
  const [activeMaterial, setActiveMaterial] = useState<MaterialWithObject | null>(null);
  const [donatedIds, setDonatedIds] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    createBrowserSupabaseClient().auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  function handleDonate(material: MaterialWithObject) {
    if (!isLoggedIn) {
      setShowAuthPrompt(true);
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
      {showAuthPrompt && (
        <div className="auth-prompt-banner panel">
          <p>Для подачи заявки нужен аккаунт</p>
          <div className="auth-prompt-actions">
            <a href="/auth/login?next=/materials" className="primary-button auth-prompt-btn">Войти</a>
            <a href="/auth/register?next=/materials" className="text-link auth-prompt-btn">Зарегистрироваться</a>
          </div>
        </div>
      )}
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
                    {isFull ? 'Собрано' : 'Предложить материал'}
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
