'use client';

import { useState } from 'react';
import { PartnerModal } from './PartnerModal';
import type { ObjectOption } from './PartnerModal';

type Props = {
  objects: ObjectOption[];
};

export function PartnersClient({ objects }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSuccess() {
    setModalOpen(false);
    setSubmitted(true);
  }

  return (
    <>
      {submitted ? (
        <p className="partner-submitted-msg">
          Заявка отправлена. Мы свяжемся с вами в ближайшее время.
        </p>
      ) : (
        <button
          type="button"
          className="primary-button"
          onClick={() => setModalOpen(true)}
          style={{ padding: '14px 32px', fontSize: '17px' }}
        >
          Подать заявку на партнёрство
        </button>
      )}

      {modalOpen && (
        <PartnerModal
          objects={objects}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
