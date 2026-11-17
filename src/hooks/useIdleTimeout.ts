import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIdleTimeoutOptions {
  enabled?: boolean;
  idleTimeMs?: number;      // Por defecto: 15 minutos
  warningTimeSec?: number;  // Por defecto: 60 segundos de gracia
  onTimeout: () => void;
}

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'keydown',
  'mousedown',
  'touchstart',
  'scroll',
  'input'
];

export function useIdleTimeout({
  enabled = true,
  idleTimeMs = 15 * 60 * 1000,
  warningTimeSec = 60,
  onTimeout
}: UseIdleTimeoutOptions) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningTimeSec);

  const idleTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const warningOpenRef = useRef(false);

  useEffect(() => {
    warningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    clearAllTimers();
    if (!enabled) return;

    idleTimerRef.current = window.setTimeout(() => {
      setIsWarningOpen(true);
      setSecondsRemaining(warningTimeSec);

      countdownIntervalRef.current = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearAllTimers();
            setIsWarningOpen(false);
            onTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, idleTimeMs);
  }, [clearAllTimers, enabled, idleTimeMs, warningTimeSec, onTimeout]);

  const stayActive = useCallback(() => {
    setIsWarningOpen(false);
    setSecondsRemaining(warningTimeSec);
    startIdleTimer();
  }, [startIdleTimer, warningTimeSec]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      setIsWarningOpen(false);
      return;
    }

    const handleActivity = () => {
      // Mientras el modal de advertencia esté visible, exigir confirmación explícita
      if (!warningOpenRef.current) {
        startIdleTimer();
      }
    };

    startIdleTimer();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [enabled, startIdleTimer, clearAllTimers]);

  return {
    isWarningOpen,
    secondsRemaining,
    stayActive
  };
}
