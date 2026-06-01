'use client';

import { User } from 'lucide-react';
import Link from 'next/link';
import { TutorialStep } from '@/lib/tutorial/steps';
import type { QuestWithStatus } from '@/app/actions/quests';

type TutorialProps = {
  mode?: 'tutorial';
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  npcName?: string;
  npcPortraitUrl?: string;
};

type QuestProps = {
  mode: 'quest';
  quest: QuestWithStatus;
  questIndex: number;
  totalQuests: number;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  npcName?: string;
  npcPortraitUrl?: string;
};

type NPCDialogProps = TutorialProps | QuestProps;

function NpcPortrait({ name, portraitUrl }: { name: string; portraitUrl: string }) {
  return (
    <div className="npc-portrait-wrap">
      <img
        src={portraitUrl || '/npc/elder.png'}
        alt={name}
        className="npc-portrait"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
        }}
      />
      <div className="npc-portrait-fallback">
        <User size={40} strokeWidth={1.5} />
      </div>
      <span className="npc-name">{name}</span>
    </div>
  );
}

const ACTION_TYPE_LABELS: Record<QuestWithStatus['action_type'], string> = {
  donate:    'Пожертвовать',
  subscribe: 'Подписаться',
  volunteer: 'Записаться',
  material:  'Помочь материалами',
  partner:   'Стать партнёром',
};

export default function NPCDialog(props: NPCDialogProps) {
  const npcName = props.npcName ?? 'Ведун';
  const npcPortraitUrl = props.npcPortraitUrl ?? '';

  if (props.mode === 'quest') {
    const { quest, questIndex, totalQuests, onAccept, onDecline, onClose, onPrev, onNext } = props;
    const hasMore = totalQuests > 1;

    return (
      <div className="npc-dialog-wrap">
        <div className="npc-dialog" role="dialog" aria-modal="false" aria-label="Задание Ведуна">
          <NpcPortrait name={npcName} portraitUrl={npcPortraitUrl} />

          <div className="npc-speech">
            <p className="npc-title">{quest.title}</p>
            <p className="npc-text">{quest.description}</p>

            {quest.reward_text && (
              <p className="npc-reward-hint">🏅 {quest.reward_text}</p>
            )}

            <div className="npc-footer">
              {hasMore && (
                <div className="npc-steps" aria-label={`Задание ${questIndex + 1} из ${totalQuests}`}>
                  {Array.from({ length: totalQuests }).map((_, i) => (
                    <span
                      key={i}
                      className={`npc-dot${i === questIndex ? ' npc-dot--active' : ''}`}
                    />
                  ))}
                </div>
              )}

              <div className="npc-actions">
                {quest.status === 'completed' ? (
                  <>
                    <span className="npc-completed-badge">Выполнено ✓</span>
                    <button className="npc-btn-secondary" onClick={onClose}>
                      Закрыть
                    </button>
                  </>
                ) : quest.status === 'accepted' ? (
                  <>
                    {quest.action_url && (
                      <Link href={quest.action_url} className="primary-button npc-btn-cta" onClick={onClose}>
                        {ACTION_TYPE_LABELS[quest.action_type]}
                      </Link>
                    )}
                    <button className="npc-btn-skip" onClick={onClose}>
                      Закрыть
                    </button>
                  </>
                ) : (
                  <>
                    {hasMore && questIndex > 0 && (
                      <button className="npc-btn-secondary" onClick={onPrev}>
                        ←
                      </button>
                    )}
                    <button className="primary-button npc-btn-next" onClick={onAccept}>
                      Принять задание
                    </button>
                    <button className="npc-btn-skip" onClick={onDecline}>
                      Отложить
                    </button>
                    {hasMore && questIndex < totalQuests - 1 && (
                      <button className="npc-btn-secondary" onClick={onNext}>
                        →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Tutorial mode (existing behaviour, unchanged) ──────────────────────────
  const { step, stepIndex, totalSteps, onNext, onPrev, onSkip } = props;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const isInteractive = !!step.interactive;

  return (
    <div className="npc-dialog-wrap">
      <div className="npc-dialog" role="dialog" aria-modal="false" aria-label="Обучение">
        <NpcPortrait name={npcName} portraitUrl={npcPortraitUrl} />

        <div className="npc-speech">
          <p className="npc-title">{step.title}</p>
          <p className="npc-text">{step.text}</p>

          {isInteractive && step.interactiveHint && (
            <span className="npc-interactive-hint" aria-live="polite">
              ↑ {step.interactiveHint}
            </span>
          )}

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
              ) : !isInteractive ? (
                <>
                  <button className="primary-button npc-btn-next" onClick={onNext}>
                    {isFirst ? 'Начать' : 'Далее'}
                  </button>
                  <button className="npc-btn-skip" onClick={onSkip}>
                    Пропустить
                  </button>
                </>
              ) : (
                <button className="npc-btn-skip" onClick={onSkip}>
                  Пропустить
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
