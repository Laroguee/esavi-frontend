import { useEffect, useRef, useState, useCallback } from 'react';
import type { UseFormWatch, UseFormReset, UseFormGetValues } from 'react-hook-form';
import { guardarAnexoOffline, obtenerAnexoOffline, eliminarBorradorOffline } from '../services/offline/offlineDB';

interface UseFormAutoSaveOptions<T extends Record<string, any>> {
  idCaso?: string;
  casoId?: string;
  tipoAnexo: string;
  watch: UseFormWatch<T>;
  reset: UseFormReset<T>;
  getValues: UseFormGetValues<T>;
  enabled?: boolean;
  debounceMs?: number;
}

export function useFormAutoSave<T extends Record<string, any>>({
  idCaso,
  casoId,
  tipoAnexo,
  watch,
  reset,
  getValues,
  enabled = true,
  debounceMs = 1500
}: UseFormAutoSaveOptions<T>) {
  const resolvedCasoId = idCaso || casoId;
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasDraftAvailable, setHasDraftAvailable] = useState<boolean>(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<T | null>(null);

  const debounceTimerRef = useRef<number | null>(null);
  const previousValuesRef = useRef<string>('');
  const isInitialLoadDoneRef = useRef<boolean>(false);

  // 1. Detectar si existe un borrador previo en Dexie al montar el componente
  useEffect(() => {
    if (!enabled || !resolvedCasoId) return;

    let isMounted = true;
    async function checkForDraft() {
      try {
        const borrador = await obtenerAnexoOffline(resolvedCasoId!, tipoAnexo);
        if (!isMounted) return;

        if (borrador && borrador.estado === 'BORRADOR' && borrador.datos) {
          const keys = Object.keys(borrador.datos);
          if (keys.length > 0) {
            setHasDraftAvailable(true);
            setDraftTimestamp(borrador.updatedAt);
            setDraftData(borrador.datos as T);
          }
        }
      } catch (err) {
        console.warn(`[AutoSave] Error al consultar borrador de ${tipoAnexo}:`, err);
      } finally {
        isInitialLoadDoneRef.current = true;
      }
    }

    checkForDraft();
    return () => { isMounted = false; };
  }, [resolvedCasoId, tipoAnexo, enabled]);

  // 2. Función interna para persistir en Dexie
  const persistDraft = useCallback(async (values: T) => {
    if (!resolvedCasoId || !enabled) return;
    setIsSaving(true);
    try {
      await guardarAnexoOffline(resolvedCasoId, tipoAnexo, values, false);
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn(`[AutoSave] Error al guardar borrador de ${tipoAnexo} en Dexie:`, err);
    } finally {
      setIsSaving(false);
    }
  }, [resolvedCasoId, tipoAnexo, enabled]);

  // 3. Suscripción a cambios del formulario (watch) con debounce
  useEffect(() => {
    if (!enabled || !resolvedCasoId) return;

    const subscription = watch((values) => {
      // Ignorar si aún no termina la carga inicial
      if (!isInitialLoadDoneRef.current) return;

      const serialized = JSON.stringify(values);
      // Evitar guardar si no hay cambios reales
      if (serialized === previousValuesRef.current) return;
      previousValuesRef.current = serialized;

      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        persistDraft(values as T);
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [watch, persistDraft, enabled, resolvedCasoId, debounceMs]);

  // 4. Restaurar los datos del borrador en el formulario
  const restoreDraft = useCallback(() => {
    if (draftData) {
      const currentValues = getValues();
      reset({
        ...currentValues,
        ...draftData
      });
      setHasDraftAvailable(false);
      setLastSavedAt(draftTimestamp ? new Date(draftTimestamp) : new Date());
    }
  }, [draftData, getValues, reset, draftTimestamp]);

  // 5. Descartar el borrador local
  const discardDraft = useCallback(async () => {
    if (resolvedCasoId) {
      await eliminarBorradorOffline(resolvedCasoId, tipoAnexo);
      setHasDraftAvailable(false);
      setDraftData(null);
    }
  }, [resolvedCasoId, tipoAnexo]);

  // 6. Limpiar borrador tras envío exitoso al servidor
  const clearDraft = useCallback(async () => {
    if (resolvedCasoId) {
      await eliminarBorradorOffline(resolvedCasoId, tipoAnexo);
      setHasDraftAvailable(false);
      setDraftData(null);
      setLastSavedAt(null);
    }
  }, [resolvedCasoId, tipoAnexo]);

  return {
    lastSavedAt,
    isSaving,
    hasDraftAvailable,
    draftTimestamp,
    restoreDraft,
    discardDraft,
    clearDraft
  };
}
