'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';
import NPCDialog from './NPCDialog';
import { getAvailableQuests, acceptQuest, type QuestWithStatus, type DialogChoice } from '@/app/actions/quests';

interface QuestOverlayProps {
  npcId: string;
  npcName: string;
  npcPortraitUrl: string;
  userId?: string;
  onClose: () => void;
}

export default function QuestOverlay({ npcId, npcName, npcPortraitUrl, userId, onClose }: QuestOverlayProps) {
  const [quests, setQuests] = useState<QuestWithStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dialogIndex, setDialogIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    getAvailableQuests(userId, npcId).then((result) => {
      if (result.length === 0) {
        setEmpty(true);
      } else {
        setQuests(result);
        const acceptedIdx = result.findIndex(q => q.status === 'accepted');
        setCurrentIndex(acceptedIdx >= 0 ? acceptedIdx : 0);
      }
      setLoading(false);
    }).catch(() => {
      setEmpty(true);
      setLoading(false);
    });
  }, [userId, npcId]);

  // Reset dialog index when switching quests
  const goToQuest = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setDialogIndex(0);
  }, []);

  const handleNextDialog = useCallback(() => {
    setDialogIndex(i => i + 1);
  }, []);

  const handleAccept = useCallback(async () => {
    const quest = quests[currentIndex];
    if (!quest) return;
    const { error } = await acceptQuest(quest.id);
    if (!error) {
      setQuests(prev => prev.map((q, i) =>
        i === currentIndex ? { ...q, status: 'accepted' as const } : q
      ));
      setDialogIndex(0);
    }
  }, [quests, currentIndex]);

  const handleDecline = useCallback(() => {
    if (currentIndex < quests.length - 1) {
      goToQuest(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, quests.length, onClose, goToQuest]);

  const handleChoose = useCallback((next: DialogChoice['next']) => {
    if (next === 'next')    return handleNextDialog();
    if (next === 'accept')  return handleAccept();
    if (next === 'decline') return handleDecline();
  }, [handleNextDialog, handleAccept, handleDecline]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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
              <p className="npc-text" style={{ padding: '24px', textAlign: 'center' }}>Ведун думает…</p>
            </div>
          </div>
        </div>
      )}

      {!loading && empty && (
        <div className="npc-dialog-wrap">
          <div className="npc-dialog" role="dialog" aria-label="Нет заданий">
            <div className="npc-portrait-wrap">
              {npcPortraitUrl && (
                <img
                  src={npcPortraitUrl}
                  alt={npcName}
                  className="npc-portrait"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="npc-portrait-fallback" style={npcPortraitUrl ? undefined : { display: 'flex' }}>
                <User size={40} strokeWidth={1.5} />
              </div>
              <span className="npc-name">{npcName}</span>
            </div>
            <div className="npc-speech">
              <p className="npc-title">Нет заданий</p>
              <p className="npc-text">Сейчас у меня нет заданий для тебя, путник. Загляни позже.</p>
              <div className="npc-footer">
                <div className="npc-actions">
                  <button className="npc-btn-secondary" onClick={onClose}>Хорошо</button>
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
          dialogIndex={dialogIndex}
          npcName={npcName}
          npcPortraitUrl={npcPortraitUrl}
          onNextDialog={handleNextDialog}
          onChoose={handleChoose}
          onClose={onClose}
          onPrev={() => goToQuest(Math.max(0, currentIndex - 1))}
          onNext={() => goToQuest(Math.min(quests.length - 1, currentIndex + 1))}
        />
      )}
    </div>
  );
}
