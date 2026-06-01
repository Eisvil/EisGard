'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import NPCDialog from './NPCDialog';
import { TUTORIAL_STEPS, TUTORIAL_STORAGE_KEY, type TutorialStep } from '@/lib/tutorial/steps';

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
  const [steps, setSteps] = useState<TutorialStep[]>(TUTORIAL_STEPS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = steps[stepIndex];

  const updateSpotlight = useCallback(
    (index: number, stepsArr: TutorialStep[]) => {
      const step = stepsArr[index];
      if (!step?.selector) {
        setSpotlight(null);
        return;
      }
      const rect = getSpotlightRect(step.selector, step.padding ?? 12);
      setSpotlight(rect);
    },
    []
  );

  const handleComplete = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
    } catch {}
  }, []);

  const handleNext = useCallback(() => {
    setSteps((prev) => {
      const next = stepIndex + 1;
      if (next >= prev.length) {
        handleComplete();
        return prev;
      }
      setStepIndex(next);
      timerRef.current = setTimeout(() => updateSpotlight(next, prev), 50);
      return prev;
    });
  }, [stepIndex, handleComplete, updateSpotlight]);

  const handlePrev = useCallback(() => {
    const prev = Math.max(0, stepIndex - 1);
    setStepIndex(prev);
    timerRef.current = setTimeout(() => updateSpotlight(prev, steps), 50);
  }, [stepIndex, steps, updateSpotlight]);

  // Attach click listeners for interactive steps
  useEffect(() => {
    if (!active || !currentStep?.interactive || !currentStep?.selector) return;

    let debounced = false;
    const handler = () => {
      if (debounced) return;
      debounced = true;
      // Let the native click propagate first (hotspot selects), then advance
      timerRef.current = setTimeout(() => handleNext(), 350);
    };

    const elements = document.querySelectorAll(currentStep.selector);
    elements.forEach((el) => el.addEventListener('click', handler, true));

    return () => {
      elements.forEach((el) => el.removeEventListener('click', handler, true));
    };
  }, [active, currentStep, handleNext]);

  // Escape key
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleComplete();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, handleComplete]);

  // Auto-start: fetch steps from DB, then check localStorage
  useEffect(() => {
    let cancelled = false;

    async function init() {
      let done = false;
      try {
        done = !!localStorage.getItem(TUTORIAL_STORAGE_KEY);
      } catch {}
      if (done) return;

      // Fetch steps from DB (with timeout fallback)
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 1500);
        const res = await fetch('/api/tutorial-steps', { signal: ctrl.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data.data) && data.data.length > 0) {
            // Map snake_case DB fields to camelCase TutorialStep
            const mapped: TutorialStep[] = data.data.map((row: Record<string, unknown>) => ({
              selector: row.selector as string | undefined,
              title: row.title as string,
              text: row.text as string,
              padding: row.padding as number | undefined,
              interactive: row.interactive as boolean | undefined,
              interactiveHint: row.interactive_hint as string | undefined,
            }));
            setSteps(mapped);
          }
        }
      } catch {
        // fallback to default steps (already set)
      }

      if (!cancelled) {
        timerRef.current = setTimeout(() => {
          setStepIndex(0);
          setSpotlight(null);
          setActive(true);
        }, 900);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Re-measure on resize/scroll
  useEffect(() => {
    if (!active) return;
    const measure = () => updateSpotlight(stepIndex, steps);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [active, stepIndex, steps, updateSpotlight]);

  if (!active) return null;

  const isInteractive = !!currentStep?.interactive;

  return (
    <>
      {/* click-catcher — not rendered for interactive steps so user can click the spotlit element */}
      {!isInteractive && (
        <div
          className="tutorial-click-catcher"
          onClick={handleNext}
          aria-hidden="true"
        />
      )}

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

      <NPCDialog
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleComplete}
      />
    </>
  );
}

export function replayTutorial() {
  try {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch {}
  window.location.reload();
}
