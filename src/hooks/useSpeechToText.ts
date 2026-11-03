/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';

// Declaraciones de tipos para la Web Speech API
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onsoundstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onsoundend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

export interface UseSpeechToTextOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  autoPunctuation?: boolean;
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseSpeechToTextReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

/**
 * Función que procesa comandos orales de puntuación y formato clínico en español.
 */
export function formatMedicalSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Reemplazo de puntuaciones y saltos de línea clínicos
  text = text.replace(/\b(punto y aparte|nueva línea|nuevo renglón)\b/gi, '\n\n');
  text = text.replace(/\b(punto y seguido|punto seguido|punto)\b/gi, '. ');
  text = text.replace(/\b(coma)\b/gi, ', ');
  text = text.replace(/\b(dos puntos)\b/gi, ': ');
  text = text.replace(/\b(punto y coma)\b/gi, '; ');
  text = text.replace(/\b(abrir interrogación|abre signo de interrogación)\b/gi, ' ¿');
  text = text.replace(/\b(cerrar interrogación|cierra signo de interrogación|signo de interrogación)\b/gi, '? ');
  text = text.replace(/\b(abrir paréntesis|abre paréntesis)\b/gi, ' (');
  text = text.replace(/\b(cerrar paréntesis|cierra paréntesis)\b/gi, ') ');

  // Limpiar espacios previos a signos de puntuación: "hola , mundo" -> "hola, mundo"
  text = text.replace(/\s+([.,;:?!)])/g, '$1');

  // Limpiar espacios múltiples continuos
  text = text.replace(/[ ]{2,}/g, ' ');

  // Mayúscula automática después de punto o inicio de línea
  text = text.replace(/(^|[.?!]\s+)([a-zñáéíóú])/g, (_match, prefix, char) => {
    return prefix + char.toUpperCase();
  });

  return text;
}

/**
 * Hook para reconocimiento de voz en navegadores mediante la Web Speech API
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const {
    lang = 'es-SV',
    continuous = true,
    interimResults = true,
    autoPunctuation = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  const checkSupport = () => {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  };

  const [isSupported] = useState<boolean>(checkSupport);
  const [error, setError] = useState<string | null>(() =>
    checkSupport() ? null : 'La API de reconocimiento de voz no es soportada en este navegador.'
  );

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef<boolean>(false);

  // Mantener sincronizado el ref para callbacks sin violar reglas de renderizado
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar si ya estaba detenido
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      const errMsg = 'El reconocimiento por voz no es compatible con este navegador.';
      setError(errMsg);
      onError?.(errMsg);
      return;
    }

    // Detener instancia previa si existe
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignorar
      }
    }

    try {
      const recognition: SpeechRecognitionInstance = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const rawTranscript = item[0]?.transcript || '';

          if (item.isFinal) {
            const formatted = autoPunctuation
              ? formatMedicalSpeech(rawTranscript)
              : rawTranscript;
            currentFinal += formatted;
          } else {
            currentInterim += rawTranscript;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => {
            const separator = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
            const updated = prev + separator + currentFinal;
            return updated;
          });
          onResult?.(currentFinal, true);
        }

        if (interimResults) {
          setInterimTranscript(currentInterim);
          if (currentInterim) {
            onResult?.(currentInterim, false);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMsg: string;
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            errorMsg = 'Permiso de micrófono denegado por el usuario o sistema.';
            break;
          case 'no-speech':
            // No se detectó voz; no se considera error crítico
            errorMsg = 'No se detectó audio/voz.';
            break;
          case 'network':
            errorMsg = 'Error de conectividad en el servicio de voz.';
            break;
          case 'audio-capture':
            errorMsg = 'No se detectó ningún micrófono conectado.';
            break;
          default:
            errorMsg = `Error de voz: ${event.error || 'desconocido'}`;
        }
        setError(errorMsg);
        onError?.(errorMsg);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      const errMsg = err?.message || 'No se pudo iniciar el micrófono';
      setError(errMsg);
      onError?.(errMsg);
      setIsListening(false);
    }
  }, [lang, continuous, interimResults, autoPunctuation, onResult, onError]);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorar
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}

