import { dbLocal, type TareaSincronizacion, guardarAnexoOffline, guardarEvidenciaOffline } from './offlineDB';
import { guardarEnSheets, subirArchivoEvidencia, registrarLog } from '../firebaseService';

// Helper para convertir Blob a DataURI Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface SyncProgress {
  total: number;
  actual: number;
  itemActual?: string;
  errorCount: number;
}

let isSyncRunning = false;

/**
 * Procesa la cola de sincronización (Outbox) subiendo primero archivos binarios
 * y luego despachando los formularios a Firestore.
 */
export async function sincronizarPendientes(
  onProgress?: (progress: SyncProgress) => void
): Promise<{ success: boolean; totalProcesados: number; errores: number }> {
  // Evitar ejecuciones simultáneas de sincronización
  if (isSyncRunning) {
    return { success: false, totalProcesados: 0, errores: 0 };
  }

  // Verificar si hay conectividad
  if (!navigator.onLine) {
    return { success: false, totalProcesados: 0, errores: 0 };
  }

  isSyncRunning = true;
  let totalProcesados = 0;
  let errores = 0;

  try {
    const tareas: TareaSincronizacion[] = await dbLocal.colaSincronizacion
      .orderBy('prioridad')
      .toArray();

    const total = tareas.length;
    if (total === 0) {
      isSyncRunning = false;
      return { success: true, totalProcesados: 0, errores: 0 };
    }

    for (let i = 0; i < total; i++) {
      const tarea = tareas[i];
      onProgress?.({
        total,
        actual: i + 1,
        itemActual: tarea.tipo === 'EVIDENCIA_ARCHIVO' ? 'Subiendo evidencia multimedia' : 'Sincronizando formulario anexo',
        errorCount: errores
      });

      try {
        if (tarea.tipo === 'EVIDENCIA_ARCHIVO') {
          const evidencia = await dbLocal.evidenciasLocales.get(tarea.referenciaId);
          if (evidencia && evidencia.estado !== 'SINCRONIZADO') {
            const base64 = await blobToBase64(evidencia.archivoBlob);
            const res = await subirArchivoEvidencia(
              evidencia.id_caso,
              evidencia.categoria,
              base64,
              evidencia.tipoMime,
              evidencia.nombreArchivo,
              'Sincronizador Offline'
            );

            if (res.success) {
              evidencia.estado = 'SINCRONIZADO';
              evidencia.urlRemota = res.data?.url;
              await dbLocal.evidenciasLocales.put(evidencia);
              await dbLocal.colaSincronizacion.delete(tarea.id);
              totalProcesados++;
            } else {
              errores++;
              tarea.intentos += 1;
              tarea.ultimoError = res.error || 'Fallo al subir a servidor';
              await dbLocal.colaSincronizacion.put(tarea);
            }
          } else {
            // Ya estaba sincronizado o no existe
            await dbLocal.colaSincronizacion.delete(tarea.id);
          }
        } else if (tarea.tipo === 'ANEXO') {
          const anexo = await dbLocal.anexosLocales.get(tarea.referenciaId);
          if (anexo && anexo.estado !== 'SINCRONIZADO') {
            const res = await guardarEnSheets(anexo.tipo_anexo, anexo.datos);
            if (res.success) {
              anexo.estado = 'SINCRONIZADO';
              await dbLocal.anexosLocales.put(anexo);
              await dbLocal.colaSincronizacion.delete(tarea.id);
              totalProcesados++;
            } else {
              errores++;
              tarea.intentos += 1;
              tarea.ultimoError = res.error || 'Error guardando en Firestore';
              await dbLocal.colaSincronizacion.put(tarea);
            }
          } else {
            await dbLocal.colaSincronizacion.delete(tarea.id);
          }
        }
      } catch (err: any) {
        console.error('Error en item de sincronización:', err);
        errores++;
      }
    }

    if (totalProcesados > 0) {
      registrarLog('OFFLINE_SYNC', 'Sistema', `Se sincronizaron exitosamente ${totalProcesados} elementos desde almacenamiento local`);
    }

    return { success: errores === 0, totalProcesados, errores };
  } finally {
    isSyncRunning = false;
  }
}

/**
 * Guarda un anexo en la nube si hay red, o en la base local (Dexie) si está offline o hay error de conexión
 */
export async function guardarAnexoHibrido(
  id_caso: string,
  tipo_anexo: string,
  payloadDatos: any
): Promise<{ success: boolean; offline: boolean; message: string }> {
  if (!navigator.onLine) {
    await guardarAnexoOffline(id_caso, tipo_anexo, payloadDatos, true);
    return {
      success: true,
      offline: true,
      message: 'Guardado localmente en su dispositivo (Sin conexión). Se sincronizará automáticamente al detectar red.'
    };
  }

  try {
    const res = await guardarEnSheets(tipo_anexo, payloadDatos);
    if (res.success) {
      return {
        success: true,
        offline: false,
        message: 'Guardado y sincronizado exitosamente con la base nacional.'
      };
    } else {
      await guardarAnexoOffline(id_caso, tipo_anexo, payloadDatos, true);
      return {
        success: true,
        offline: true,
        message: 'El servidor no respondió. El formulario fue resguardado en el dispositivo y se sincronizará automáticamente.'
      };
    }
  } catch (err: any) {
    await guardarAnexoOffline(id_caso, tipo_anexo, payloadDatos, true);
    return {
      success: true,
      offline: true,
      message: 'Conexión inestable detectada. El formulario quedó protegido en su dispositivo y se sincronizará automáticamente.'
    };
  }
}

/**
 * Guarda un archivo de evidencia en la nube o en IndexedDB si no hay red
 */
export async function guardarEvidenciaHibrida(
  id_caso: string,
  categoria: 'clinica' | 'pni' | 'epidemiologica' | 'general' | 'regulatorio',
  file: File,
  usuario: string
): Promise<{ success: boolean; offline: boolean; url?: string; message: string }> {
  if (!navigator.onLine) {
    await guardarEvidenciaOffline(id_caso, categoria, file);
    return {
      success: true,
      offline: true,
      message: 'Archivo guardado en el dispositivo. Se subirá automáticamente al detectar conexión.'
    };
  }

  try {
    const base64Str = await blobToBase64(file);
    const res = await subirArchivoEvidencia(id_caso, categoria, base64Str, file.type, file.name, usuario);
    if (res.success) {
      return {
        success: true,
        offline: false,
        url: res.data?.url,
        message: 'Archivo subido correctamente al repositorio de evidencias.'
      };
    } else {
      await guardarEvidenciaOffline(id_caso, categoria, file);
      return {
        success: true,
        offline: true,
        message: 'No se pudo contactar el servidor. El archivo se guardó localmente en cola.'
      };
    }
  } catch (err) {
    await guardarEvidenciaOffline(id_caso, categoria, file);
    return {
      success: true,
      offline: true,
      message: 'Fallo de red al subir archivo. Se guardó localmente en cola de sincronización.'
    };
  }
}
