'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import NPCDialog from './NPCDialog';
import { getAvailableQuests, acceptQuest, type QuestWithStatus } from '@/app/actions/quests';

interface QuestOverlayProps {
  npcName: string;
  npcPortraitUrl: string;
  userId?: string;
  onClose: () => void;
}

export default function QuestOverlay({ npcName, npcPortraitUrl, userId, onClose }: QuestOverlayProps) {
  const [quests, setQuests] = useState<QuestWithStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    getAvailableQuests(userId).then((result) => {
      if (result.length === 0) {
        setEmpty(true);
      } else {
        setQuests(result);
        // Prioritize: show first accepted quest, otherwise first new quest
        const acceptedIdx = result.findIndex(q => q.status === 'accepted');
        setCurrentIndex(acceptedIdx >= 0 ? acceptedIdx : 0);
      }
      setLoading(false);
    }).catch(() => {
      setEmpty(true);
      setLoading(false);
    });
  }, [userId]);

  const handleAccept = useCallback(async () => {
    const quest = quests[currentIndex];
    if (!quest) return;
    const { error } = await acceptQuest(quest.id);
    if (!error) {
      setQuests(prev => prev.map((q, i) =>
        i === currentIndex ? { ...q, status: 'accepted' as const } : q
      ));
    }
  }, [quests, currentIndex]);

  const handleDecline = useCallback(() => {
    if (currentIndex < quests.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, quests.length, onClose]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const currentQuest = quests[currentIndex];

  return (
    <div className="quest-overlay" aria-modal="true" role="dialog" aria-label="Задания Ведуна">
      <div className="quest-backdrop" onClick={onClose} aria-hidden="true" />

      {loading && (
        <div className="quest-overlay-loading">
          <div className="npc-dialog-wrap">
            <div className="npc-dialog">
              <p className="npc-text" style={{ padding: '24px', textAlign: 'center' }}>
                Ведун думает…
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && empty && (
        <div className="npc-dialog-wrap">
          <div className="npc-dialog" role="dialog" aria-label="Нет заданий">
            <div className="npc-portrait-wrap">
              <img
                src={npcPortraitUrl || '/npc/elder.png'}
                alt={npcName}
                className="npc-portrait"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement | null)
                    ?.style.setProperty('display', 'flex');
                }}
              />
              <div className="npc-portrait-fallback" />
              <span className="npc-name">{npcName}</span>
            </div>
            <div className="npc-speech">
              <p className="npc-title">Нет заданий</p>
              <p className="npc-text">
                Сейчас у меня нет заданий для тебя, путник. Загляни позже.
              </p>
              <div className="npc-footer">
                <div className="npc-actions">
                  <button className="npc-btn-secondary" onClick={onClose}>
                    Хорошо
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !empty && currentQuest && (
        <NPCDialog
          mode="quest"
          quest={currentQuest}
          questIndex={currentIndex}
          totalQuests={quests.length}
          npcName={npcName}
          npcPortraitUrl={npcPortraitUrl}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onClose={onClose}
          onPrev={() => setCurrentIndex(i => Math.max(0, i - 1))}
          onNext={() => setCurrentIndex(i => Math.min(quests.length - 1, i + 1))}
        />
      )}
    </div>
  );
}
