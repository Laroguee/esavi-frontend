import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { registrarLog } from '../services/firebaseService';

interface UseContentProtectionOptions {
  enabled?: boolean;
  enableKeyboardBlock?: boolean;
  enableContextMenuBlock?: boolean;
  enableBlurOnFocusLoss?: boolean;
  blurDebounceMs?: number;
  onViolation?: (violationType: 'copy' | 'cut' | 'print' | 'source' | 'devtools' | 'contextmenu') => void;
}

export function useContentProtection(options: UseContentProtectionOptions = {}) {
  const {
    enabled = true,
    enableKeyboardBlock = true,
    enableContextMenuBlock = true,
    enableBlurOnFocusLoss = true,
    blurDebounceMs = 200,
    onViolation
  } = options;

  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const blurTimeoutRef = useRef<number | null>(null);
  const lastLogTimeRef = useRef<number>(0);

  const { userName, userEmail } = useAuthStore();

  // Helper para registrar intento con rate-limiting (máximo 1 log cada 30 segundos para evitar saturación)
  const logSecurityAttempt = useCallback((tipo: string) => {
    const now = Date.now();
    if (now - lastLogTimeRef.current > 30000) {
      lastLogTimeRef.current = now;
      const usuarioIdentificador = userName || userEmail || 'Usuario Anónimo';
      registrarLog('SEGURIDAD', usuarioIdentificador, `Intento de acceso/copia no autorizada: ${tipo}`);
    }
  }, [userName, userEmail]);

  // Verificar si un elemento es editable (input, textarea o contenteditable)
  const isEditableElement = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tagName = target.tagName.toUpperCase();
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return true;
    }
    return target.isContentEditable || target.closest('[contenteditable="true"]') !== null;
  };

  useEffect(() => {
    if (!enabled) return;

    // 1. Manejo de atajos de teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enableKeyboardBlock) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const inEditable = isEditableElement(e.target);

      // A) Bloqueo estricto universal (incluso dentro de inputs)
      // - Ctrl+P (Imprimir)
      // - Ctrl+U (Ver código fuente)
      // - Ctrl+S (Guardar página como HTML)
      // - F12 / Atajos de DevTools (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (
        (isCtrlOrCmd && key === 'p') ||
        (isCtrlOrCmd && key === 'u') ||
        (isCtrlOrCmd && key === 's') ||
        e.key === 'F12' ||
        (isCtrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();

        const tipo = key === 'p' ? 'print' : (key === 'u' || key === 's' ? 'source' : 'devtools');
        onViolation?.(tipo);
        logSecurityAttempt(tipo);
        return;
      }

      // B) Bloqueo condicional de copia/corte
      // Si el foco NO está en un input o textarea editable, bloquear Ctrl+C / Ctrl+X
      if (isCtrlOrCmd && (key === 'c' || key === 'x')) {
        if (!inEditable) {
          e.preventDefault();
          e.stopPropagation();
          const tipo = key === 'c' ? 'copy' : 'cut';
          onViolation?.(tipo);
          logSecurityAttempt(tipo);
        }
      }
    };

    // 2. Manejo de Clic Derecho (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      if (!enableContextMenuBlock) return;

      // Permitir menú contextual en inputs para permitir pegar / corregir ortografía si el usuario lo necesita
      if (isEditableElement(e.target)) {
        return;
      }

      // Bloquear en cualquier otra zona (tablas, expedientes, botones, fondo)
      e.preventDefault();
      onViolation?.('contextmenu');
    };

    // 3. Detección de pérdida de foco y cambio de pestaña (Anti-Snipping / Anti-Captura)
    const handleFocusLoss = () => {
      if (!enableBlurOnFocusLoss) return;

      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }

      blurTimeoutRef.current = window.setTimeout(() => {
        // Verificar si la ventana realmente perdió el foco o la pestaña está oculta
        if (document.visibilityState === 'hidden' || !document.hasFocus()) {
          setIsShieldActive(true);
        }
      }, blurDebounceMs);
    };

    const handleFocusGain = () => {
      if (!enableBlurOnFocusLoss) return;

      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
      setIsShieldActive(false);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', handleFocusLoss);
    window.addEventListener('focus', handleFocusGain);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleFocusLoss();
      } else {
        handleFocusGain();
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', handleFocusLoss);
      window.removeEventListener('focus', handleFocusGain);
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [
    enabled,
    enableKeyboardBlock,
    enableContextMenuBlock,
    enableBlurOnFocusLoss,
    blurDebounceMs,
    onViolation,
    logSecurityAttempt
  ]);

  const dismissShield = useCallback(() => {
    setIsShieldActive(false);
  }, []);

  return {
    isShieldActive,
    dismissShield
  };
}
