import { useState, useEffect, useCallback, useRef } from 'react';
import { dbLocal, obtenerContadorPendientes } from '../services/offline/offlineDB';
import { sincronizarPendientes, type SyncProgress } from '../services/offline/syncEngine';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('');

  const autoSyncDebounceRef = useRef<number | null>(null);

  // Actualizar el conteo de elementos pendientes en cola
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await obtenerContadorPendientes();
      setPendingCount(count);
    } catch (e) {
      // Ignorar errores si la base está ocupada
    }
  }, []);

  // Función para disparar la sincronización (sea automática o manual)
  const executeSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    setSyncStatusText('Iniciando sincronización...');

    try {
      const res = await sincronizarPendientes((progreso: SyncProgress) => {
        setSyncStatusText(`Sincronizando ${progreso.actual} de ${progreso.total}...`);
      });

      await refreshPendingCount();

      if (res.totalProcesados > 0) {
        setSyncStatusText(`Completado: ${res.totalProcesados} sincronizados`);
      } else {
        setSyncStatusText('');
      }
    } catch (error) {
      console.error('Fallo en sincronización:', error);
      setSyncStatusText('Error al sincronizar');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusText(''), 4000);
    }
  }, [isSyncing, refreshPendingCount]);

  useEffect(() => {
    // 1. Escuchar cambios de conectividad
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sincronización con un debounce de 2 segundos para asegurar conexión estable
      if (autoSyncDebounceRef.current) {
        window.clearTimeout(autoSyncDebounceRef.current);
      }
      autoSyncDebounceRef.current = window.setTimeout(() => {
        executeSync();
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (autoSyncDebounceRef.current) {
        window.clearTimeout(autoSyncDebounceRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Consulta inicial de pendientes
    refreshPendingCount();

    // 3. Revisión periódica de la cola cada 10 segundos
    const interval = setInterval(() => {
      refreshPendingCount();
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      if (autoSyncDebounceRef.current) {
        window.clearTimeout(autoSyncDebounceRef.current);
      }
    };
  }, [executeSync, refreshPendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncStatusText,
    refreshPendingCount,
    triggerManualSync: executeSync
  };
}
