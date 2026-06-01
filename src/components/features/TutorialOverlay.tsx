'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import NPCDialog from './NPCDialog';
import { TUTORIAL_STEPS, TUTORIAL_STORAGE_KEY } from '@/lib/tutorial/steps';

interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function getSpotlightRect(selector: string, padding = 12): SpotlightRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: r.left - padding,
    top: r.top - padding,
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  };
}

export default function TutorialOverlay() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = TUTORIAL_STEPS[stepIndex];

  const updateSpotlight = useCallback((index: number) => {
    const step = TUTORIAL_STEPS[index];
    if (!step.selector) {
      setSpotlight(null);
      return;
    }
    const rect = getSpotlightRect(step.selector, step.padding ?? 12);
    setSpotlight(rect);
  }, []);

  const handleComplete = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
    } catch {}
  }, []);

  const handleNext = useCallback(() => {
    const next = stepIndex + 1;
    if (next >= TUTORIAL_STEPS.length) {
      handleComplete();
      return;
    }
    setStepIndex(next);
    // allow DOM to update before measuring
    timerRef.current = setTimeout(() => updateSpotlight(next), 50);
  }, [stepIndex, handleComplete, updateSpotlight]);

  const handlePrev = useCallback(() => {
    const prev = Math.max(0, stepIndex - 1);
    setStepIndex(prev);
    timerRef.current = setTimeout(() => updateSpotlight(prev), 50);
  }, [stepIndex, updateSpotlight]);

  // Escape key — skip tutorial
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleComplete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, handleComplete]);

  // Auto-start on first visit
  useEffect(() => {
    let done = false;
    try {
      done = !!localStorage.getItem(TUTORIAL_STORAGE_KEY);
    } catch {}
    if (done) return;

    timerRef.current = setTimeout(() => {
      setStepIndex(0);
      setSpotlight(null);
      setActive(true);
    }, 900);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Re-measure spotlight on resize/scroll
  useEffect(() => {
    if (!active) return;
    const measure = () => updateSpotlight(stepIndex);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [active, stepIndex, updateSpotlight]);

  if (!active) return null;

  return (
    <>
      {/* click-catcher behind spotlight: clicking dark area advances tutorial */}
      <div
        className="tutorial-click-catcher"
        onClick={handleNext}
        aria-hidden="true"
      />

      {/* spotlight hole with box-shadow backdrop */}
      {spotlight && (
        <div
          className="tutorial-spotlight"
          style={{
            left: spotlight.left,
            top: spotlight.top,
            width: spotlight.width,
            height: spotlight.height,
          }}
          aria-hidden="true"
        />
      )}

      {/* NPC dialog */}
      <NPCDialog
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={TUTORIAL_STEPS.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleComplete}
      />
    </>
  );
}

// Public helper — call to replay tutorial (used by HUD button)
export function replayTutorial() {
  try {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch {}
  window.location.reload();
}
