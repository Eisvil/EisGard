'use client';

import { User } from 'lucide-react';
import Link from 'next/link';
import { TutorialStep } from '@/lib/tutorial/steps';

interface NPCDialogProps {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export default function NPCDialog({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: NPCDialogProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div className="npc-dialog-wrap">
    <div className="npc-dialog" role="dialog" aria-modal="false" aria-label="Обучение">
      <div className="npc-portrait-wrap">
        <img
          src="/npc/elder.png"
          alt="Ведун"
          className="npc-portrait"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty(
              'display',
              'flex'
            );
          }}
        />
        <div className="npc-portrait-fallback">
          <User size={40} strokeWidth={1.5} />
        </div>
        <span className="npc-name">Ведун</span>
      </div>

      <div className="npc-speech">
        <p className="npc-title">{step.title}</p>
        <p className="npc-text">{step.text}</p>

        <div className="npc-footer">
          <div className="npc-steps" aria-label={`Шаг ${stepIndex + 1} из ${totalSteps}`}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`npc-dot${i === stepIndex ? ' npc-dot--active' : ''}`}
              />
            ))}
          </div>

          <div className="npc-actions">
            {!isFirst && (
              <button className="npc-btn-secondary" onClick={onPrev}>
                Назад
              </button>
            )}

            {isLast ? (
              <>
                <Link href="/auth/register" className="primary-button npc-btn-cta" onClick={onSkip}>
                  Стать участником
                </Link>
                <button className="npc-btn-skip" onClick={onSkip}>
                  Позже
                </button>
              </>
            ) : (
              <>
                <button className="primary-button npc-btn-next" onClick={onNext}>
                  {isFirst ? 'Начать' : 'Далее'}
                </button>
                <button className="npc-btn-skip" onClick={onSkip}>
                  Пропустить
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
