import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';

// 1. Tipos de Datos
export type EstadoFlujo = 'NORMAL' | 'DEVUELTO_A_INSTITUCIONAL' | 'DEVUELTO_A_ERR' | 'CORREGIDO_POR_ERR' | 'NUEVO' | 'NOTIFICADO' | 'EN_EVALUACION' | 'ASIGNADO_A_ERR' | 'EN_INVESTIGACION' | 'EN_REVISION_SECRETARIADO' | 'APROBADO_PARA_COMITE' | 'EN_EVALUACION_COMITE' | 'CERRADO_DICTAMINADO';

export interface AgendaReunion {
  id: string;
  faseRelacionada: string;
  fecha: string;
  hora: string;
  convocados: string[];
  tema: string;
  estado: 'PROGRAMADA' | 'REALIZADA';
  modalidad: 'Virtual' | 'Presencial';
  enlaceOLugar: string;
}

export interface CasoESAVI {
  id: string;
  paciente: string;
  establecimiento: string;
  vacuna: string;
  fase: string;
  estadoFlujo: EstadoFlujo;
  riesgo: string;
  fecha: string;
  observacionRechazo?: string;
  anexoRechazado?: string;
  observacionActual?: string;
  reuniones: AgendaReunion[];
  miembrosERR: string[];
  anexoIII_completado?: boolean;
  anexoV_completado?: boolean;
  anexoVI_completado?: boolean;
  anexoVII_completado?: boolean;
}

export interface Notificacion {
  id: number;
  texto: string;
  leido: boolean;
  fecha: string;
}

interface CasesState {
  casos: CasoESAVI[];
  notificaciones: Notificacion[];
  
  // Acciones (Mutaciones)
  devolverCaso: (idCaso: string, nuevoEstado: EstadoFlujo, observacion: string, anexo: string, textoNotificacion: string) => void;
  avanzarCaso: (idCaso: string, nuevoEstado: EstadoFlujo, nuevaFase: string, textoNotificacion: string, nuevoRiesgo?: string) => void;
  marcarNotificacionLeida: (idNotif: number) => void;
  agendarReunion: (casoId: string, nuevaReunion: AgendaReunion) => void;
  marcarAnexoCompletado: (idCaso: string, anexo: 'III' | 'V' | 'VI' | 'VII') => void;
  asignarMiembrosERR: (idCaso: string, miembros: string[]) => void;
}

// 2. Base de Datos Simulada Inicial
const CASOS_INICIALES: CasoESAVI[] = [
  { id: 'ESAVI-MINSAL-2025-001', paciente: 'Infante Desconocido', establecimiento: 'Hospital Rosales', vacuna: 'BCG', fase: 'Fase 1: Notificación', estadoFlujo: 'NUEVO', riesgo: 'Sin clasificar', fecha: dayjs().subtract(1, 'hour').toISOString(), reuniones: [], miembrosERR: [], anexoIII_completado: false, anexoV_completado: false, anexoVI_completado: false, anexoVII_completado: false },
  { id: 'ESAVI-ISSS-2025-002', paciente: 'Ana Gómez', establecimiento: 'Policlínico Zacamil', vacuna: 'VPH', fase: 'Fase 1: Notificación', estadoFlujo: 'NOTIFICADO', riesgo: 'Bajo', fecha: dayjs().subtract(5, 'hour').toISOString(), reuniones: [], miembrosERR: [], anexoIII_completado: false, anexoV_completado: false, anexoVI_completado: false, anexoVII_completado: false },
  { id: 'ESAVI-MINSAL-2025-003', paciente: 'Luis Torres', establecimiento: 'U.S. San Jacinto', vacuna: 'DPT', fase: 'Fase 2: Evaluación', estadoFlujo: 'EN_EVALUACION', riesgo: 'Medio', fecha: dayjs().subtract(1, 'day').toISOString(), reuniones: [], miembrosERR: [], anexoIII_completado: false, anexoV_completado: false, anexoVI_completado: false, anexoVII_completado: false },
  { id: 'ESAVI-ISSS-2025-004', paciente: 'Marta Ríos', establecimiento: 'Hospital Amatepec', vacuna: 'COVID-19', fase: 'Fase 3: Asignación ERR', estadoFlujo: 'ASIGNADO_A_ERR', riesgo: 'Alto', fecha: dayjs().subtract(2, 'day').toISOString(), reuniones: [], miembrosERR: ['medico.ss@minsal.gob.sv', 'epidemio.local@minsal.gob.sv'], anexoIII_completado: false, anexoV_completado: false, anexoVI_completado: false, anexoVII_completado: false },
  { id: 'ESAVI-MINSAL-2025-005', paciente: 'Carlos Ruiz', establecimiento: 'U.S. Barrios', vacuna: 'Influenza', fase: 'Fase 4: Investigación', estadoFlujo: 'EN_INVESTIGACION', riesgo: 'Grave', fecha: dayjs().subtract(3, 'day').toISOString(), reuniones: [], miembrosERR: ['medico.ss@minsal.gob.sv', 'epidemio.local@minsal.gob.sv', 'inmuno.puesto@minsal.gob.sv'], anexoIII_completado: false, anexoV_completado: false, anexoVI_completado: false, anexoVII_completado: false },
  { id: 'ESAVI-SANIDAD-2025-006', paciente: 'Sgto. Pérez', establecimiento: 'Hospital Militar', vacuna: 'Fiebre Amarilla', fase: 'Fase 5: Control Calidad', estadoFlujo: 'EN_REVISION_SECRETARIADO', riesgo: 'Alto', fecha: dayjs().subtract(4, 'day').toISOString(), reuniones: [], miembrosERR: ['medico.ss@minsal.gob.sv'], anexoIII_completado: true, anexoV_completado: true, anexoVI_completado: true, anexoVII_completado: true },
  { id: 'ESAVI-ISSS-2025-007', paciente: 'Elena Castro', establecimiento: 'Hospital Médico Quirúrgico', vacuna: 'Rotavirus', fase: 'Fase 5: Control Calidad', estadoFlujo: 'DEVUELTO_A_INSTITUCIONAL', riesgo: 'Medio', fecha: dayjs().subtract(5, 'day').toISOString(), observacionActual: 'Falta firma en el Anexo VII', observacionRechazo: 'Falta firma en el Anexo VII', anexoRechazado: 'Anexo VII (Clínico)', reuniones: [], miembrosERR: ['epidemio.local@minsal.gob.sv'], anexoIII_completado: true, anexoV_completado: true, anexoVI_completado: true, anexoVII_completado: true },
  { id: 'ESAVI-MINSAL-2025-008', paciente: 'Jorge Ramos', establecimiento: 'U.S. San Miguel', vacuna: 'Neumococo', fase: 'Fase 5: Control Calidad', estadoFlujo: 'DEVUELTO_A_ERR', riesgo: 'Bajo', fecha: dayjs().subtract(6, 'day').toISOString(), observacionActual: 'Completar dirección exacta', observacionRechazo: 'Completar dirección exacta', anexoRechazado: 'Anexo VI (Domiciliaria)', reuniones: [], miembrosERR: ['medico.ss@minsal.gob.sv'], anexoIII_completado: true, anexoV_completado: true, anexoVI_completado: true, anexoVII_completado: true },
  { id: 'ESAVI-ISSS-2025-009', paciente: 'Rosa Silva', establecimiento: 'Hospital Regional Santa Ana', vacuna: 'COVID-19', fase: 'Fase 6: Dictamen', estadoFlujo: 'EN_EVALUACION_COMITE', riesgo: 'Grave', fecha: dayjs().subtract(10, 'day').toISOString(), reuniones: [], miembrosERR: ['medico.ss@minsal.gob.sv', 'inmuno.puesto@minsal.gob.sv'], anexoIII_completado: true, anexoV_completado: true, anexoVI_completado: true, anexoVII_completado: true },
  { id: 'ESAVI-MINSAL-2025-010', paciente: 'Fernando López', establecimiento: 'U.S. Unicentro', vacuna: 'Hepatitis B', fase: 'Fase 6: Dictamen', estadoFlujo: 'CERRADO_DICTAMINADO', riesgo: 'Bajo', fecha: dayjs().subtract(15, 'day').toISOString(), reuniones: [], miembrosERR: ['medico.ss@minsal.gob.sv'], anexoIII_completado: true, anexoV_completado: true, anexoVI_completado: true, anexoVII_completado: true },
];

const NOTIFICACIONES_INICIALES: Notificacion[] = [
  { id: 1, texto: "Bienvenido al Sistema Nacional ESAVI.", leido: false, fecha: "Justo ahora" }
];

// 3. Creación del Store
export const useCasesStore = create<CasesState>()(
  persist(
    (set) => ({
      casos: CASOS_INICIALES,
      notificaciones: NOTIFICACIONES_INICIALES,

      // LA MAGIA DE LA MÁQUINA DE ESTADOS:
      devolverCaso: (idCaso, nuevoEstado, observacion, anexo, textoNotificacion) => 
        set((state) => {
          // 1. Actualizamos el caso
          const nuevosCasos = state.casos.map(caso => 
            caso.id === idCaso 
              ? { ...caso, estadoFlujo: nuevoEstado, observacionRechazo: observacion, anexoRechazado: anexo, observacionActual: observacion }
              : caso
          );

      let finalNotifText = textoNotificacion;
      if (nuevoEstado === 'DEVUELTO_A_INSTITUCIONAL') {
        finalNotifText = "El Secretariado ha devuelto el expediente para revisión.";
      } else if (nuevoEstado === 'DEVUELTO_A_ERR') {
        finalNotifText = "La Jefatura solicita correcciones en los anexos de campo.";
      }

      // 2. Disparamos una nueva notificación
      const nuevaNotif: Notificacion = {
        id: Date.now(), // ID único
        texto: finalNotifText,
        leido: false,
        fecha: "Hace un momento"
      };

      return {
        casos: nuevosCasos,
        notificaciones: [nuevaNotif, ...state.notificaciones] // Agregamos la nueva al inicio
      };
    }),

  avanzarCaso: (idCaso, nuevoEstado, nuevaFase, textoNotificacion, nuevoRiesgo) => 
    set((state) => {
      const nuevosCasos = state.casos.map(caso => 
        caso.id === idCaso 
          ? { ...caso, estadoFlujo: nuevoEstado, fase: nuevaFase, observacionRechazo: undefined, anexoRechazado: undefined, observacionActual: undefined, ...(nuevoRiesgo ? { riesgo: nuevoRiesgo } : {}) }
          : caso
      );

      const nuevaNotif: Notificacion = {
        id: Date.now(),
        texto: textoNotificacion,
        leido: false,
        fecha: "Hace un momento"
      };

      return {
        casos: nuevosCasos,
        notificaciones: [nuevaNotif, ...state.notificaciones]
      };
    }),

  marcarNotificacionLeida: (idNotif) =>
    set((state) => ({
      notificaciones: state.notificaciones.map(n => 
        n.id === idNotif ? { ...n, leido: true } : n
      )
    })),
    
  agendarReunion: (casoId, nuevaReunion) =>
    set((state) => ({
      casos: state.casos.map(caso =>
        caso.id === casoId
          ? { ...caso, reuniones: [...caso.reuniones, nuevaReunion] }
          : caso
      )
    })),
    
  marcarAnexoCompletado: (idCaso, anexo) =>
    set((state) => ({
      casos: state.casos.map(caso => {
        if (caso.id === idCaso) {
          if (anexo === 'III') return { ...caso, anexoIII_completado: true };
          if (anexo === 'V') return { ...caso, anexoV_completado: true };
          if (anexo === 'VI') return { ...caso, anexoVI_completado: true };
          if (anexo === 'VII') return { ...caso, anexoVII_completado: true };
        }
        return caso;
      })
    })),
    
  asignarMiembrosERR: (idCaso, miembros) =>
    set((state) => ({
      casos: state.casos.map(caso =>
        caso.id === idCaso ? { ...caso, miembrosERR: miembros } : caso
      )
    }))
  }),
  { name: 'esavi-cases-storage' }
));