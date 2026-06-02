'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';
import NPCDialog from './NPCDialog';
import {
  getAvailableQuests, acceptQuest, completeQuest,
  type QuestWithStatus, type DialogChoice,
} from '@/app/actions/quests';

interface QuestOverlayProps {
  npcId: string;
  npcName: string;
  npcPortraitUrl: string;
  userId?: string;
  onClose: () => void;
  onAllCompleted?: (shouldHideNpc: boolean) => void;
  onOpenSupport?: () => void;
  onQuestChanged?: () => void;
}

export default function QuestOverlay({ npcId, npcName, npcPortraitUrl, userId, onClose, onAllCompleted, onOpenSupport, onQuestChanged }: QuestOverlayProps) {
  const [quests, setQuests] = useState<QuestWithStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dialogIndex, setDialogIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [questFailed, setQuestFailed] = useState(false);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    getAvailableQuests(userId, npcId).then((result) => {
      if (result.length === 0 || result.every(q => q.status === 'completed')) {
        setEmpty(true);
        if (result.length > 0) {
          const shouldHide = result.some(q => q.hide_npc_on_complete);
          onAllCompleted?.(shouldHide);
        }
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

  const goToQuest = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setDialogIndex(0);
    setQuestFailed(false);
  }, []);

  const handleDialogComplete = useCallback(async () => {
    const quest = quests[currentIndex];
    if (!quest) return;
    const { error } = await completeQuest(quest.id);
    if (!error) {
      onQuestChanged?.();

      // Перезагружаем список — после выполнения могли открыться задания,
      // заблокированные prerequisite_quest_id текущего квеста.
      const refreshed = await getAvailableQuests(userId, npcId);

      if (refreshed.length === 0 || refreshed.every(q => q.status === 'completed')) {
        setEmpty(true);
        const shouldHide = refreshed.some(q => q.hide_npc_on_complete);
        if (refreshed.length > 0) onAllCompleted?.(shouldHide);
      } else {
        setQuests(refreshed);
        // Переходим к первому незавершённому квесту
        const nextIdx = refreshed.findIndex(q => q.status !== 'completed');
        setCurrentIndex(nextIdx >= 0 ? nextIdx : 0);
        setDialogIndex(0);
      }
    }
  }, [quests, currentIndex, onAllCompleted, onQuestChanged, userId, npcId]);

  const handleNextDialog = useCallback(() => {
    const quest = quests[currentIndex];
    if (!quest) return;

    const dialogs = quest.dialogs?.length ? quest.dialogs : [{ type: 'text' as const, text: quest.description }];
    const isLast = dialogIndex >= dialogs.length - 1;

    if (isLast && quest.action_type === 'dialog') {
      handleDialogComplete();
    } else {
      setDialogIndex(i => i + 1);
    }
  }, [dialogIndex, quests, currentIndex, handleDialogComplete]);

  const handleAccept = useCallback(async () => {
    const quest = quests[currentIndex];
    if (!quest) return;
    const { error } = await acceptQuest(quest.id);
    if (!error) {
      setQuests(prev => prev.map((q, i) =>
        i === currentIndex ? { ...q, status: 'accepted' as const } : q
      ));
      setDialogIndex(0);
      onQuestChanged?.();
    }
  }, [quests, currentIndex, onQuestChanged]);

  const handleDecline = useCallback(() => {
    if (currentIndex < quests.length - 1) {
      goToQuest(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, quests.length, onClose, goToQuest]);

  const handleDialogFail = useCallback(() => {
    setQuestFailed(true);
  }, []);

  const handleChoose = useCallback((next: DialogChoice['next']) => {
    const quest = quests[currentIndex];
    if (next === 'decline') {
      if (quest?.action_type === 'dialog') return handleDialogFail();
      return handleDecline();
    }
    if (next === 'next') return handleNextDialog();
    if (next === 'accept') return handleAccept();
  }, [quests, currentIndex, handleDialogFail, handleDecline, handleNextDialog, handleAccept]);

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

      {/* Fail state: неправильный ответ в dialog-квесте */}
      {!loading && !empty && questFailed && (
        <div className="npc-dialog-wrap">
          <div className="npc-dialog" role="dialog" aria-label="Неверный ответ">
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
              <p className="npc-title">{npcName}</p>
              <p className="npc-text">
                Ступай путник. Подумай хорошенько и приходи в другой раз.
              </p>
              <div className="npc-footer">
                <div className="npc-actions">
                  <button className="npc-btn-secondary" onClick={onClose}>Хорошо, вернусь позже</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !empty && !questFailed && currentQuest && (
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
          onCtaClick={
            (currentQuest.action_type === 'donate' || currentQuest.action_type === 'subscribe') && onOpenSupport
              ? onOpenSupport
              : undefined
          }
        />
      )}
    </div>
  );
}
