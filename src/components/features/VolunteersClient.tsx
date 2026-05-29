'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VolunteerModal } from './VolunteerModal';

export type Camp = {
  id: string;
  name: string;
  date_range: string;
  max_volunteers: number;
  spots_left: number;
  description: string | null;
  is_open: boolean;
};

export type Skill = {
  id: string;
  name: string;
  category: string;
};

type Props = {
  camps: Camp[];
  skills: Skill[];
  isLoggedIn: boolean;
  defaultName?: string;
  userAppliedCampIds?: string[];
};

export function VolunteersClient({ camps, skills, isLoggedIn, defaultName, userAppliedCampIds = [] }: Props) {
  const [openCampId, setOpenCampId] = useState<string | null>(null);
  const [appliedCamps, setAppliedCamps] = useState<Set<string>>(new Set(userAppliedCampIds));
  const router = useRouter();

  const openCamp = openCampId ? camps.find((c) => c.id === openCampId) : null;

  function handleApply(campId: string) {
    if (!isLoggedIn) {
      router.push('/auth/login?next=/volunteers');
      return;
    }
    setOpenCampId(campId);
  }

  function handleSuccess(campId: string) {
    setAppliedCamps((prev) => new Set([...prev, campId]));
    setOpenCampId(null);
  }

  return (
    <>
      <div className="camps-list">
        {camps.map((camp) => {
          const isFull = camp.spots_left <= 0;
          const isClosed = !camp.is_open;
          const applied = appliedCamps.has(camp.id);
          const disabled = isFull || isClosed || applied;

          return (
            <div key={camp.id} className="camp-card panel">
              <div className="camp-card-body">
                <div className="camp-info">
                  <h3 className="camp-name">{camp.name}</h3>
                  <div className="camp-meta">
                    <span className="camp-dates">{camp.date_range}</span>
                    <span
                      className={`camp-spots${isFull || isClosed ? ' camp-spots--closed' : ''}`}
                    >
                      {isClosed
                        ? 'Набор закрыт'
                        : isFull
                        ? 'Мест нет'
                        : `${camp.spots_left} из ${camp.max_volunteers} мест`}
                    </span>
                  </div>
                  {camp.description && (
                    <p className="camp-description">{camp.description}</p>
                  )}
                </div>

                <div className="camp-action">
                  {applied ? (
                    <p className="camp-applied-msg">Заявка подана</p>
                  ) : (
                    <button
                      className="primary-button"
                      disabled={disabled}
                      onClick={() => handleApply(camp.id)}
                      style={{ padding: '12px 24px', fontSize: '15px' }}
                    >
                      {disabled && !applied ? (isClosed ? 'Закрыт' : 'Мест нет') : 'Подать заявку'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {openCamp && (
        <VolunteerModal
          campId={openCamp.id}
          campName={openCamp.name}
          campDates={openCamp.date_range}
          skills={skills}
          defaultName={defaultName}
          onClose={() => setOpenCampId(null)}
          onSuccess={() => handleSuccess(openCamp.id)}
        />
      )}
    </>
  );
}
