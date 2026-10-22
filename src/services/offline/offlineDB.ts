import Dexie, { type Table } from 'dexie';

// 1. Modelo de Casos en Caché Local para consulta offline
export interface CasoCacheLocal {
  id: string;
  data: any;
  ultima_actualizacion: string;
}

// 2. Modelo de Anexos (Formularios clínicos, puestos de vacuna, etc.)
export interface AnexoLocal {
  id: string; // Formato: `${id_caso}_${tipo_anexo}`
  id_caso: string;
  tipo_anexo: string;
  datos: any;
  estado: 'BORRADOR' | 'PENDIENTE_SYNC' | 'SINCRONIZADO' | 'ERROR';
  version: number;
  updatedAt: string;
}

// 3. Modelo de Evidencias Binarias (Fotos, PDFs, notas clínicas)
export interface EvidenciaLocal {
  id: string; // UUID local
  id_caso: string;
  categoria: 'clinica' | 'pni' | 'epidemiologica' | 'general' | 'regulatorio';
  nombreArchivo: string;
  tipoMime: string;
  tamanoBytes: number;
  archivoBlob: Blob; // Almacenamiento binario directo en IndexedDB
  estado: 'PENDIENTE_SYNC' | 'SUBIENDO' | 'SINCRONIZADO' | 'ERROR';
  urlRemota?: string;
  errorMensaje?: string;
  createdAt: string;
}

// 4. Cola de Sincronización (Outbox)
export interface TareaSincronizacion {
  id: string;
  tipo: 'ANEXO' | 'EVIDENCIA_ARCHIVO';
  referenciaId: string;
  prioridad: number; // 1: Archivos, 2: Documentos
  intentos: number;
  ultimoError?: string;
  createdAt: string;
}

// Inicialización de la base de datos Dexie
export class EsaviOfflineDB extends Dexie {
  casosCache!: Table<CasoCacheLocal, string>;
  anexosLocales!: Table<AnexoLocal, string>;
  evidenciasLocales!: Table<EvidenciaLocal, string>;
  colaSincronizacion!: Table<TareaSincronizacion, string>;

  constructor() {
    super('esavi_offline_db');
    this.version(1).stores({
      casosCache: 'id, ultima_actualizacion',
      anexosLocales: 'id, id_caso, tipo_anexo, estado, updatedAt',
      evidenciasLocales: 'id, id_caso, categoria, estado, createdAt',
      colaSincronizacion: 'id, tipo, referenciaId, prioridad, createdAt'
    });
  }
}

export const dbLocal = new EsaviOfflineDB();

// ==========================================
// FUNCIONES DE APOYO / HELPERS TRANSACCIONALES
// ==========================================

/**
 * Guarda o actualiza un lote de casos en la memoria local al iniciar sesión
 */
export async function guardarCasosEnCache(casos: any[]): Promise<void> {
  if (!casos || casos.length === 0) return;
  const now = new Date().toISOString();
  const registros: CasoCacheLocal[] = casos.map((c) => ({
    id: c.id,
    data: c,
    ultima_actualizacion: now
  }));
  await dbLocal.casosCache.bulkPut(registros);
}

/**
 * Obtiene todos los casos almacenados localmente si no hay conexión a internet
 */
export async function obtenerCasosCache(): Promise<any[]> {
  const registros = await dbLocal.casosCache.toArray();
  return registros.map(r => r.data);
}

/**
 * Guarda o actualiza un formulario anexo en IndexedDB
 */
export async function guardarAnexoOffline(
  id_caso: string,
  tipo_anexo: string,
  datos: any,
  marcarParaSync = true
): Promise<AnexoLocal> {
  const id = `${id_caso}_${tipo_anexo}`;
  const estado = marcarParaSync ? 'PENDIENTE_SYNC' : 'BORRADOR';
  const now = new Date().toISOString();

  const registroExistente = await dbLocal.anexosLocales.get(id);
  const version = (registroExistente?.version || 0) + 1;

  const anexo: AnexoLocal = {
    id,
    id_caso,
    tipo_anexo,
    datos,
    estado,
    version,
    updatedAt: now
  };

  await dbLocal.transaction('rw', dbLocal.anexosLocales, dbLocal.colaSincronizacion, async () => {
    await dbLocal.anexosLocales.put(anexo);

    if (marcarParaSync) {
      const tareaId = `SYNC_ANEXO_${id}`;
      await dbLocal.colaSincronizacion.put({
        id: tareaId,
        tipo: 'ANEXO',
        referenciaId: id,
        prioridad: 2,
        intentos: 0,
        createdAt: now
      });
    }
  });

  return anexo;
}

/**
 * Recupera un anexo guardado en local (sea borrador o pendiente)
 */
export async function obtenerAnexoOffline(id_caso: string, tipo_anexo: string): Promise<AnexoLocal | undefined> {
  const id = `${id_caso}_${tipo_anexo}`;
  return await dbLocal.anexosLocales.get(id);
}

/**
 * Guarda un archivo binario (Blob/File) en IndexedDB listo para ser sincronizado
 */
export async function guardarEvidenciaOffline(
  id_caso: string,
  categoria: 'clinica' | 'pni' | 'epidemiologica' | 'general' | 'regulatorio',
  file: File
): Promise<EvidenciaLocal> {
  const id = `EVID_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  const evidencia: EvidenciaLocal = {
    id,
    id_caso,
    categoria,
    nombreArchivo: file.name,
    tipoMime: file.type || 'application/octet-stream',
    tamanoBytes: file.size,
    archivoBlob: file, // File es un Blob con metadata
    estado: 'PENDIENTE_SYNC',
    createdAt: now
  };

  await dbLocal.transaction('rw', dbLocal.evidenciasLocales, dbLocal.colaSincronizacion, async () => {
    await dbLocal.evidenciasLocales.put(evidencia);
    await dbLocal.colaSincronizacion.put({
      id: `SYNC_FILE_${id}`,
      tipo: 'EVIDENCIA_ARCHIVO',
      referenciaId: id,
      prioridad: 1, // Prioridad 1: los archivos se suben antes para tener sus URLs
      intentos: 0,
      createdAt: now
    });
  });

  return evidencia;
}

/**
 * Obtiene todas las evidencias locales asociadas a un caso
 */
export async function obtenerEvidenciasCasoOffline(id_caso: string): Promise<EvidenciaLocal[]> {
  return await dbLocal.evidenciasLocales.where('id_caso').equals(id_caso).toArray();
}

/**
 * Devuelve el total de elementos pendientes de sincronizar
 */
export async function obtenerContadorPendientes(): Promise<number> {
  return await dbLocal.colaSincronizacion.count();
}

/**
 * Devuelve la lista detallada de elementos pendientes
 */
export async function obtenerDetallePendientes(): Promise<{
  anexos: AnexoLocal[];
  evidencias: EvidenciaLocal[];
}> {
  const anexos = await dbLocal.anexosLocales.where('estado').equals('PENDIENTE_SYNC').toArray();
  const evidencias = await dbLocal.evidenciasLocales.where('estado').equals('PENDIENTE_SYNC').toArray();
  return { anexos, evidencias };
}
