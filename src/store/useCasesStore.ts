import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { 
  listarCasos, 
  actualizarCaso,
  listarNotificaciones,
  marcarNotificacionLeida,
  agendarReunion,
  crearNotificacion,
  listarReuniones,
  listarHistoriales,
  registrarLog
} from '../services/firebaseService';
import { useAuthStore } from './useAuthStore';
import { useCatalogStore } from './useCatalogStore';

// 1. Tipos de Datos
export type EstadoFlujo = 'NUEVO' | 'NORMAL' | 'DEVUELTO_A_INSTITUCIONAL' | 'DEVUELTO_A_ERR' | 'CORREGIDO_POR_ERR' | 'NOTIFICADO' | 'PENDIENTE_OFICIALIZAR' | 'EN_EVALUACION' | 'EN_ASIGNACION' | 'ASIGNADO_A_ERR' | 'EN_INVESTIGACION' | 'EN_REVISION_INSTITUCIONAL' | 'EN_REVISION_SECRETARIADO' | 'APROBADO_PARA_COMITE' | 'EN_EVALUACION_COMITE' | 'DICTAMINADO' | 'CERRADO_DICTAMINADO' | 'CERRADO';

export interface AgendaReunion {
  id?: string;
  faseRelacionada: string;
  fecha: string;
  hora: string;
  convocados: string[];
  tema: string;
  estado: 'PROGRAMADA' | 'REALIZADA';
  modalidad: 'Virtual' | 'Presencial';
  enlaceOLugar: string;
  archivoBase64?: string;
  nombreArchivo?: string;
  mimeType?: string;
}

export interface CasoESAVI {
  id: string;
  id_creador?: string;
  paciente: string;
  establecimiento: string;
  id_establecimiento?: number;
  vacuna: string;
  fase: string;
  estadoFlujo: EstadoFlujo;
  riesgo: string;
  fecha: string;
  edad?: number;
  sexo?: string;
  observacionRechazo?: string;
  anexoRechazado?: string;
  observacionActual?: string;
  reuniones: AgendaReunion[];
  miembrosERR: string[];
  anexoIII_completado?: boolean;
  anexoV_completado?: boolean;
  anexoVI_completado?: boolean;
  anexoVII_completado?: boolean;
  dictamenData?: { clasificacionFinal: string; justificacionCausalidad: string; recomendaciones: string; };
  historial_cambios?: { id: string; fecha: string; usuario: string; accion: string; rol?: string }[];
}

export interface Notificacion {
  id: number;
  texto: string;
  leido: boolean;
  fecha: string;
  id_caso?: string;
}

interface CasesState {
  casos: CasoESAVI[];
  notificaciones: Notificacion[];
  isCargandoDatos: boolean;
  
  // Acciones (Mutaciones)
  cargarDatosBackend: () => Promise<void>;
  crearCaso: (nuevoCaso: CasoESAVI, datosCompletos?: any) => Promise<void>;
  devolverCaso: (idCaso: string, nuevoEstado: EstadoFlujo, observacion: string, anexo: string, textoNotificacion: string) => Promise<void>;
  avanzarCaso: (idCaso: string, nuevoEstado: EstadoFlujo, nuevaFase: string, textoNotificacion: string, nuevoRiesgo?: string, dictamenData?: any) => Promise<void>;
  marcarNotificacionLeidaStore: (idNotif: number) => Promise<void>;
  agendarReunionStore: (casoId: string, nuevaReunion: AgendaReunion) => Promise<void>;
  marcarAnexoCompletado: (idCaso: string, anexo: 'III' | 'V' | 'VI' | 'VII') => Promise<void>;
  asignarMiembrosERR: (idCaso: string, miembros: string[]) => Promise<void>;
}

// 2. Creación del Store
export const useCasesStore = create<CasesState>()(
  persist(
    (set, get) => ({
      casos: [],
      notificaciones: [],
      isCargandoDatos: false,

      cargarDatosBackend: async () => {
        if (import.meta.env.VITE_USE_API !== 'true') return;
        set({ isCargandoDatos: true });

        const email = useAuthStore.getState().userEmail || '';
        const role = useAuthStore.getState().currentRole || '';

        try {
          // 1. Cargar Casos
          const resCasos = await listarCasos();
          if (resCasos && resCasos.success && resCasos.data) {
            // Mapeo básico de Sheets a CasoESAVI
            const currentCasos = get().casos;
            const pasosStr = ['NUEVO', 'NOTIFICADO', 'EN_EVALUACION', 'ASIGNADO_A_ERR', 'EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL', 'CORREGIDO_POR_ERR', 'EN_REVISION_INSTITUCIONAL', 'EN_REVISION_SECRETARIADO', 'APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO'];

            const mappedCasos: CasoESAVI[] = resCasos.data.map((row: any) => {
              const existingCaso = currentCasos.find(c => c.id === row.id_caso);
              
              const dbEstadoIndex = pasosStr.indexOf(row.estado_flujo || 'NUEVO');
              const localEstadoIndex = pasosStr.indexOf(existingCaso?.estadoFlujo || 'NUEVO');
              
              const isDbRechazo = row.estado_flujo === 'DEVUELTO_A_INSTITUCIONAL' || row.estado_flujo === 'DEVUELTO_A_ERR';
              const usarLocal = !!existingCaso && !isDbRechazo && (localEstadoIndex > dbEstadoIndex);

              const mapEstadoToFase = (estado: string) => {
                if (estado === 'NUEVO' || estado === 'NOTIFICADO') return 'Fase 1: Notificación';
                if (estado === 'EN_EVALUACION' || estado === 'PENDIENTE_OFICIALIZAR') return 'Fase 2: Evaluación';
                if (estado === 'EN_ASIGNACION' || estado === 'ASIGNADO_A_ERR') return 'Fase 3: Asignación';
                if (estado === 'EN_INVESTIGACION' || estado === 'DEVUELTO_A_ERR' || estado === 'CORREGIDO_POR_ERR') return 'Fase 4: Investigación';
                if (estado === 'EN_REVISION_INSTITUCIONAL' || estado === 'DEVUELTO_A_INSTITUCIONAL' || estado === 'EN_REVISION_SECRETARIADO' || estado === 'APROBADO_PARA_COMITE') return 'Fase 5: Control de Calidad';
                if (estado === 'EN_EVALUACION_COMITE' || estado === 'DICTAMINADO') return 'Fase 6: Comité Externo';
                if (estado === 'CERRADO_DICTAMINADO' || estado === 'CERRADO') return 'Expediente Cerrado';
                return 'Fase Activa';
              };

              const estadoFinal = usarLocal ? existingCaso!.estadoFlujo : row.estado_flujo;
              return {
              id: row.id_caso,
              id_creador: row.id_creador,
              paciente: row.nombre_paciente || row.identificador_paciente || 'Desconocido',
              establecimiento: row.establecimiento_notificador || 'Desconocido',
              id_establecimiento: row.id_establecimiento ? Number(row.id_establecimiento) : undefined,
              vacuna: row.nombre_vacuna || 'Otra',
              fase: mapEstadoToFase(estadoFinal),
              estadoFlujo: estadoFinal,
              riesgo: usarLocal ? (existingCaso?.riesgo || 'Sin clasificar') : (row.riesgo || 'Sin clasificar'),
              fecha: row.fecha_notificacion || new Date().toISOString(),
              edad: row.edad ? Number(row.edad) : undefined,
              sexo: row.sexo || undefined,
              miembrosERR: usarLocal ? (existingCaso?.miembrosERR || []) : (row.miembros_err ? JSON.parse(row.miembros_err) : []),
              reuniones: row.reuniones ? JSON.parse(row.reuniones) : [],
              historial_cambios: [], // Will populate below from the separate collection
              anexoIII_completado: usarLocal ? (existingCaso?.anexoIII_completado || false) : (String(row.anexoIII).toLowerCase() === 'true'),
              anexoV_completado: usarLocal ? (existingCaso?.anexoV_completado || false) : (String(row.anexoV).toLowerCase() === 'true'),
              anexoVI_completado: usarLocal ? (existingCaso?.anexoVI_completado || false) : (String(row.anexoVI).toLowerCase() === 'true'),
              anexoVII_completado: usarLocal ? (existingCaso?.anexoVII_completado || false) : (String(row.anexoVII).toLowerCase() === 'true'),
              dictamenData: usarLocal ? existingCaso?.dictamenData : (row.dictamen_data ? JSON.parse(row.dictamen_data) : undefined),
              anexoRechazado: row.anexo_rechazado || undefined,
              observacionRechazo: row.observacion_rechazo || undefined,
              observacionActual: row.observacion_rechazo || undefined,
            };
            });

            // Filtro institucional: Locales solo ven los casos de su establecimiento o si fueron asignados al ERR
            let casosFiltrados = mappedCasos;
            if (role.includes('LOCAL')) {
              const myEstablecimiento = useAuthStore.getState().userEstablecimiento || '';
              casosFiltrados = mappedCasos.filter(c => 
                c.id_creador === email ||
                c.miembrosERR.includes(email) || 
                c.establecimiento === myEstablecimiento ||
                c.estadoFlujo === 'NUEVO' // Fase 1 que ellos crearon
              ); 
            } else if (role.includes('INSTITUCIONAL')) {
              const myMacro = useAuthStore.getState().userInstitucionMacro || '';
              const catalog = useCatalogStore.getState().establecimientos;
              casosFiltrados = mappedCasos.filter(c => {
                // Siempre permitir si el usuario institucional fue el creador o es miembro del ERR
                if (c.id_creador === email || c.miembrosERR.includes(email)) return true;

                // Buscar la macro institución usando el ID del establecimiento
                let caseMacro = 'MINSAL'; // Default fallback
                if (c.id_establecimiento) {
                   const estab = catalog.find(e => e.id === c.id_establecimiento);
                   if (estab) caseMacro = estab.institucionMacro;
                } else {
                   // Fallback heredado para casos viejos sin ID
                   const searchStr = (c.establecimiento + " " + c.id).toUpperCase();
                   if (searchStr.includes('ISSS')) caseMacro = 'ISSS';
                }
                return caseMacro === myMacro;
              });
            }
            
            set({ casos: casosFiltrados });
          }

          // 2. Cargar Notificaciones
          const resNotif = await listarNotificaciones(role, email);
          if (resNotif && resNotif.success && resNotif.data) {
            const mappedNotifs: Notificacion[] = resNotif.data.map((n: any) => ({
              id: Number(n.id),
              texto: n.texto,
              leido: String(n.leido).toLowerCase() === 'true',
              fecha: dayjs(n.fecha_creacion).fromNow(),
              id_caso: n.id_caso ? String(n.id_caso) : undefined
            }));
            
            // Filtrar notificaciones asegurando que el caso asociado sea visible para este usuario
            const validCaseIds = new Set(get().casos.map(c => String(c.id)));
            const notifsFiltradas = mappedNotifs.filter(n => !n.id_caso || validCaseIds.has(n.id_caso));
            
            set({ notificaciones: notifsFiltradas });
          }

          // 3. Cargar Reuniones y adjuntarlas a los casos
          const resReuniones = await listarReuniones();
          if (resReuniones && resReuniones.success && resReuniones.data) {
            set((state) => {
              const casosConReuniones = state.casos.map(caso => {
                const reunionesDelCaso = resReuniones.data
                  .filter((r: any) => String(r.id_caso) === String(caso.id))
                  .map((r: any) => ({
                    id: r.id,
                    faseRelacionada: r.fase_relacionada,
                    fecha: r.fecha,
                    hora: r.hora,
                    tema: r.tema,
                    modalidad: r.modalidad,
                    enlaceOLugar: r.enlace_lugar,
                    estado: 'PROGRAMADA' as 'PROGRAMADA' | 'REALIZADA',
                    convocados: (typeof r.convocados === 'string') ? JSON.parse(r.convocados || '[]') : []
                  }));
                return { ...caso, reuniones: reunionesDelCaso };
              });
              return { casos: casosConReuniones };
            });
          }

          // 4. Cargar Historial de Cambios
          const resHistorial = await listarHistoriales();
          if (resHistorial && resHistorial.success && resHistorial.data) {
            set((state) => {
              const casosConHistorial = state.casos.map(caso => {
                const historialDelCaso = resHistorial.data
                  .filter((h: any) => String(h.id_caso) === String(caso.id))
                  .map((h: any) => ({
                    id: h.id_log || Date.now().toString(),
                    fecha: dayjs(h.fecha).format("DD/MM/YYYY HH:mm A"),
                    usuario: h.usuario,
                    accion: h.accion,
                    rol: h.rol || ''
                  }))
                  .sort((a, b) => {
                    // Sort descending by raw date if possible, but we formatted it. Let's just reverse for now as Firebase returns roughly chronological usually, or we can use the ID
                    return b.id.localeCompare(a.id);
                  });
                return { ...caso, historial_cambios: historialDelCaso };
              });
              return { casos: casosConHistorial };
            });
          }
        } catch (error) {
          console.error("Error cargando backend:", error);
        } finally {
          set({ isCargandoDatos: false });
        }
      },

      crearCaso: async (nuevoCaso) => {
        set((state) => ({ casos: [nuevoCaso, ...state.casos] }));
      },

      devolverCaso: async (idCaso, nuevoEstado, observacion, anexo, textoNotificacion) => {
        const userEmail = useAuthStore.getState().userEmail || 'Desconocido';

        if (import.meta.env.VITE_USE_API === 'true') {
          await actualizarCaso(idCaso, {
            estado_flujo: nuevoEstado,
            observacion_rechazo: observacion || '',
            anexo_rechazado: anexo || ''
          });
          await registrarLog(idCaso, userEmail, textoNotificacion);

          // Crear notificación para el rol destino
          if (nuevoEstado === 'DEVUELTO_A_ERR') {
            const rolDestino = anexo?.includes('V (') ? 'INMUNO_LOCAL' 
                             : anexo?.includes('VI (') ? 'EPIDEMIO_LOCAL' 
                             : anexo?.includes('VII (') ? 'ESAVI_LOCAL' 
                             : 'ESAVI_LOCAL'; // default a ESAVI local
            await crearNotificacion({
              id_caso: idCaso,
              rol_destino: rolDestino,
              texto: `El expediente ${idCaso} ha sido devuelto para corrección en ${anexo}`
            });
          } else if (nuevoEstado === 'DEVUELTO_A_INSTITUCIONAL') {
            await crearNotificacion({
              id_caso: idCaso,
              rol_destino: 'ESAVI_INSTITUCIONAL',
              texto: `El Secretariado ha devuelto el expediente ${idCaso} para corrección en ${anexo}`
            });
          }
        }
        
        set((state) => {
          const nuevosCasos = state.casos.map(caso => 
            caso.id === idCaso 
              ? { ...caso, estadoFlujo: nuevoEstado, observacionRechazo: observacion, anexoRechazado: anexo, observacionActual: observacion }
              : caso
          );
          return { casos: nuevosCasos };
        });
      },

      avanzarCaso: async (idCaso, nuevoEstado, nuevaFase, textoNotificacion, nuevoRiesgo, dictamenData) => {
        const userEmail = useAuthStore.getState().userEmail || 'Desconocido';
        const userRole = useAuthStore.getState().currentRole || 'Sistema';

        if (import.meta.env.VITE_USE_API === 'true') {
          const updates: any = { 
            estado_flujo: nuevoEstado,
            observacion_rechazo: '',
            anexo_rechazado: ''
          };
          if (nuevoRiesgo) updates.riesgo = nuevoRiesgo;
          if (dictamenData) updates.dictamen_data = JSON.stringify(dictamenData);
          const res = await actualizarCaso(idCaso, updates);
          if (res && !res.success) {
            throw new Error(res.error || 'Error al actualizar el estado del caso en el backend');
          }
          await registrarLog(idCaso, userEmail, textoNotificacion);
        }

        set((state) => {
          const nuevosCasos = state.casos.map(caso => 
            caso.id === idCaso 
              ? { 
                  ...caso, 
                  estadoFlujo: nuevoEstado, 
                  fase: nuevaFase, 
                  observacionRechazo: undefined, 
                  anexoRechazado: undefined, 
                  observacionActual: undefined, 
                  ...(nuevoRiesgo ? { riesgo: nuevoRiesgo } : {}),
                  ...(dictamenData ? { dictamenData } : {}),
                  historial_cambios: [
                    {
                      id: Date.now().toString(),
                      fecha: dayjs().format("DD/MM/YYYY HH:mm A"),
                      usuario: userEmail,
                      rol: userRole,
                      accion: textoNotificacion
                    },
                    ...(caso.historial_cambios || [])
                  ]
                }
              : caso
          );
          return { casos: nuevosCasos };
        });
      },

      marcarNotificacionLeidaStore: async (idNotif) => {
        if (import.meta.env.VITE_USE_API === 'true') {
           await marcarNotificacionLeida(idNotif);
        }
        set((state) => ({
          notificaciones: state.notificaciones.map(n => 
            n.id === idNotif ? { ...n, leido: true } : n
          )
        }));
      },
        
      agendarReunionStore: async (casoId, nuevaReunion) => {
        let reunionFinal = { ...nuevaReunion, id: nuevaReunion.id || `REU-${Date.now()}` };
        if (import.meta.env.VITE_USE_API === 'true') {
           const payloadReunion = {
             id: reunionFinal.id,
             id_caso: casoId,
             fase_relacionada: nuevaReunion.faseRelacionada,
             fecha: nuevaReunion.fecha,
             hora: nuevaReunion.hora,
             tema: nuevaReunion.tema,
             modalidad: nuevaReunion.modalidad,
             enlace_lugar: nuevaReunion.enlaceOLugar,
             convocados: nuevaReunion.convocados
           };
           const res = await agendarReunion(payloadReunion);
           if (res && res.id) reunionFinal.id = res.id;
        }

        set((state) => ({
          casos: state.casos.map(caso =>
            caso.id === casoId
              ? { ...caso, reuniones: [...(caso.reuniones || []), reunionFinal] }
              : caso
          )
        }));
      },
        
      marcarAnexoCompletado: async (idCaso, anexo) => {
        const colMap: any = { 'III': 'anexoIII', 'V': 'anexoV', 'VI': 'anexoVI', 'VII': 'anexoVII' };
        if (import.meta.env.VITE_USE_API === 'true') {
           await actualizarCaso(idCaso, { [colMap[anexo]]: true });
        }

        set((state) => {
          const nuevosCasos = state.casos.map(caso => {
            if (caso.id === idCaso) {
              const updated = { ...caso };
              if (anexo === 'III') updated.anexoIII_completado = true;
              if (anexo === 'V') updated.anexoV_completado = true;
              if (anexo === 'VI') updated.anexoVI_completado = true;
              if (anexo === 'VII') updated.anexoVII_completado = true;
              
              return updated;
            }
            return caso;
          });

          return { casos: nuevosCasos };
        });

        // Orquestación: Si V, VI y VII están completados, avanzar de fase
        const stateAfter = get();
        const casoDespues = stateAfter.casos.find(c => c.id === idCaso);
        
        if (casoDespues && casoDespues.anexoV_completado && casoDespues.anexoVI_completado && casoDespues.anexoVII_completado && casoDespues.estadoFlujo === 'EN_INVESTIGACION') {
          // Avanzamos el caso a revisión primaria (Institucional)
          await stateAfter.avanzarCaso(idCaso, 'EN_REVISION_INSTITUCIONAL', 'Fase 5: Revisión Primaria', 'El trabajo de campo (Anexos V, VI, VII) ha sido completado por los tres investigadores.');
          
          if (import.meta.env.VITE_USE_API === 'true') {
            await crearNotificacion({
              id_caso: idCaso,
              rol_destino: 'ESAVI_INSTITUCIONAL',
              texto: `El trabajo de campo para el caso ${idCaso} ha finalizado. Por favor, inicie la Revisión Primaria.`
            });
          }
        }
      },
        
      asignarMiembrosERR: async (idCaso, miembros) => {
        if (import.meta.env.VITE_USE_API === 'true') {
           await actualizarCaso(idCaso, { miembros_err: JSON.stringify(miembros) });
        }

        set((state) => ({
          casos: state.casos.map(caso =>
            caso.id === idCaso ? { ...caso, miembrosERR: miembros } : caso
          )
        }));
      }
    }),
    { name: 'esavi-cases-storage' }
  )
);
