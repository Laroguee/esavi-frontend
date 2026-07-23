import { create } from 'zustand';
import dayjs from 'dayjs';

// 1. Tipos de Datos
export type EstadoFlujo = 'NORMAL' | 'DEVUELTO_A_INSTITUCIONAL' | 'DEVUELTO_A_ERR' | 'CORREGIDO_POR_ERR';

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
  marcarNotificacionLeida: (idNotif: number) => void;
}

// 2. Base de Datos Simulada Inicial
const CASOS_INICIALES: CasoESAVI[] = [
  { id: 'ESAVI-MINSAL-2025-001', paciente: 'Juan Pérez', establecimiento: 'U.S. Barrios', vacuna: 'COVID-19', fase: 'Fase 2: Riesgo', estadoFlujo: 'NORMAL', riesgo: 'Alto', fecha: dayjs().subtract(2, 'hour').toISOString() },
  { id: 'ESAVI-ISSS-2025-002', paciente: 'María López', establecimiento: 'Hospital Médico Quirúrgico', vacuna: 'Influenza', fase: 'Fase 5: Control Calidad', estadoFlujo: 'NORMAL', riesgo: 'Medio', fecha: dayjs().subtract(23, 'hour').toISOString() },
  { id: 'ESAVI-MINSAL-2025-003', paciente: 'Carlos Ruiz', establecimiento: 'U.S. San Miguel', vacuna: 'DPT', fase: 'Fase 5: Control Calidad', estadoFlujo: 'NORMAL', riesgo: 'Bajo', fecha: dayjs().subtract(10, 'hour').toISOString() },
];

const NOTIFICACIONES_INICIALES: Notificacion[] = [
  { id: 1, texto: "Bienvenido al Sistema Nacional ESAVI.", leido: false, fecha: "Justo ahora" }
];

// 3. Creación del Store
export const useCasesStore = create<CasesState>((set) => ({
  casos: CASOS_INICIALES,
  notificaciones: NOTIFICACIONES_INICIALES,

  // LA MAGIA DE LA MÁQUINA DE ESTADOS:
  devolverCaso: (idCaso, nuevoEstado, observacion, anexo, textoNotificacion) => 
    set((state) => {
      // 1. Actualizamos el caso
      const nuevosCasos = state.casos.map(caso => 
        caso.id === idCaso 
          ? { ...caso, estadoFlujo: nuevoEstado, observacionRechazo: observacion, anexoRechazado: anexo }
          : caso
      );

      // 2. Disparamos una nueva notificación
      const nuevaNotif: Notificacion = {
        id: Date.now(), // ID único
        texto: textoNotificacion,
        leido: false,
        fecha: "Hace un momento"
      };

      return {
        casos: nuevosCasos,
        notificaciones: [nuevaNotif, ...state.notificaciones] // Agregamos la nueva al inicio
      };
    }),

  marcarNotificacionLeida: (idNotif) =>
    set((state) => ({
      notificaciones: state.notificaciones.map(n => 
        n.id === idNotif ? { ...n, leido: true } : n
      )
    }))
}));