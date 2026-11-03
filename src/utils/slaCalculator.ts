import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export interface SLAStatus {
  estado: 'PENDIENTE_ASIGNACION' | 'COMPLETADO' | 'A_TIEMPO' | 'POR_VENCER' | 'VENCIDO';
  etiqueta: string;
  color: 'default' | 'success' | 'warning' | 'error' | 'info';
  horasTranscurridas: number;
  horasRestantes: number;
  limiteHoras: number;
  esGrave: boolean;
  rowColor?: string;
}

/**
 * Parsea fechas en distintos formatos habituales del sistema (ISO, DD/MM/YYYY, etc.)
 */
export function parseSLADate(dateStr: string): dayjs.Dayjs {
  if (!dateStr) return dayjs();
  let parsed = dayjs(dateStr, "DD/MM/YYYY hh:mm A", true);
  if (!parsed.isValid()) parsed = dayjs(dateStr, "DD/MM/YYYY HH:mm A", true);
  if (!parsed.isValid()) parsed = dayjs(dateStr, "YYYY-MM-DDTHH:mm:ss", true);
  if (!parsed.isValid()) parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed : dayjs();
}

/**
 * Calcula el cumplimiento de SLA del Equipo de Respuesta Rápida (ERR)
 * Normativa:
 * - 24 horas fijas para casos GRAVES / ALTOS / CRÍTICOS
 * - 48 horas fijas para casos MODERADOS / MEDIOS / LEVES
 * - El tiempo se cuenta exclusivamente a partir de la fecha de asignación del ERR
 * - En caso de devoluciones (DEVUELTO_A_ERR), se mantiene el tiempo acumulado
 */
export function calcularSLA_ERR(caso: any, rolUsuario?: string): SLAStatus {
  // 1. Determinar nivel de gravedad y límite de horas
  const riesgoStr = String(caso?.riesgo || '').toUpperCase();
  const esGrave = riesgoStr.includes('ALTO') || 
                  riesgoStr.includes('CRÍTICO') || 
                  riesgoStr.includes('CRITICO') || 
                  riesgoStr.includes('GRAVE') || 
                  riesgoStr.includes('ROJO');
  
  const limiteHoras = esGrave ? 24 : 48;

  // 2. Determinar la fecha de inicio del reloj del ERR
  let fechaInicio = caso?.fechaAsignacionERR || caso?.fecha_asignacion_err;

  // Fallback 1: Buscar en el historial de cambios si no tiene el campo directo
  if (!fechaInicio && caso?.historial_cambios && Array.isArray(caso.historial_cambios)) {
    const logAsignacion = caso.historial_cambios.slice().reverse().find((h: any) => {
      const accion = String(h?.accion || '').toLowerCase();
      return accion.includes('asignado') || 
             accion.includes('equipo de respuesta') || 
             accion.includes('err') || 
             accion.includes('fase 4');
    });
    if (logAsignacion?.fecha) {
      fechaInicio = logAsignacion.fecha;
    }
  }

  // Fallback 2: Si el caso aún no llega a Fase 3/4
  const estadosPrevios = ['NUEVO', 'NORMAL', 'NOTIFICADO', 'EN_EVALUACION', 'PENDIENTE_OFICIALIZAR', 'EN_ASIGNACION'];
  if (!fechaInicio && estadosPrevios.includes(caso?.estadoFlujo)) {
    return {
      estado: 'PENDIENTE_ASIGNACION',
      etiqueta: 'Pendiente de Asignar ERR',
      color: 'default',
      horasTranscurridas: 0,
      horasRestantes: limiteHoras,
      limiteHoras,
      esGrave,
      rowColor: 'inherit'
    };
  }

  // Fallback 3: Si está en Fase 4 o superior pero no se encontró log, usar fecha del caso
  if (!fechaInicio) {
    fechaInicio = caso?.fecha || new Date().toISOString();
  }

  // 3. Determinar si la tarea ya fue completada (por rol o globalmente)
  let yaCompletado = false;
  let fechaFin = dayjs();

  if (rolUsuario === 'INMUNO_LOCAL' && caso?.anexoV_completado) {
    yaCompletado = true;
    if (caso?.anexoV_fecha_completado) {
      fechaFin = parseSLADate(caso.anexoV_fecha_completado);
    }
  } else if (rolUsuario === 'EPIDEMIO_LOCAL' && caso?.anexoVI_completado) {
    yaCompletado = true;
    if (caso?.anexoVI_fecha_completado) {
      fechaFin = parseSLADate(caso.anexoVI_fecha_completado);
    }
  } else if (rolUsuario === 'ESAVI_LOCAL' && caso?.anexoVII_completado) {
    yaCompletado = true;
    if (caso?.anexoVII_fecha_completado) {
      fechaFin = parseSLADate(caso.anexoVII_fecha_completado);
    }
  } else if (caso?.anexoV_completado && caso?.anexoVI_completado && caso?.anexoVII_completado) {
    yaCompletado = true;
  } else if (['EN_REVISION_INSTITUCIONAL', 'EN_REVISION_SECRETARIADO', 'APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(caso?.estadoFlujo)) {
    yaCompletado = true;
  }

  // 4. Calcular diferencia de horas
  const start = parseSLADate(fechaInicio);
  const horasTranscurridas = Math.max(0, fechaFin.diff(start, 'hour'));
  const horasRestantes = limiteHoras - horasTranscurridas;
  const esDevuelto = caso?.estadoFlujo === 'DEVUELTO_A_ERR';
  const tagDevuelto = esDevuelto ? ' [Devuelto]' : '';

  if (yaCompletado) {
    return {
      estado: 'COMPLETADO',
      etiqueta: `Completado (${horasTranscurridas}h)`,
      color: 'success',
      horasTranscurridas,
      horasRestantes: 0,
      limiteHoras,
      esGrave,
      rowColor: 'inherit'
    };
  }

  // Estado Vencido
  if (horasRestantes < 0) {
    const exceso = Math.abs(horasRestantes);
    return {
      estado: 'VENCIDO',
      etiqueta: `Vencido (+${exceso}h)${tagDevuelto}`,
      color: 'error',
      horasTranscurridas,
      horasRestantes,
      limiteHoras,
      esGrave,
      rowColor: '#ffebee'
    };
  }

  // Estado Por Vencer (ultimas 4 horas)
  if (horasRestantes <= 4) {
    return {
      estado: 'POR_VENCER',
      etiqueta: `Por vencer (${horasRestantes}h rest.)${tagDevuelto}`,
      color: 'warning',
      horasTranscurridas,
      horasRestantes,
      limiteHoras,
      esGrave,
      rowColor: '#fff8e1'
    };
  }

  // Estado A Tiempo
  return {
    estado: 'A_TIEMPO',
    etiqueta: `A tiempo (${horasRestantes}h rest.)${tagDevuelto}`,
    color: 'success',
    horasTranscurridas,
    horasRestantes,
    limiteHoras,
    esGrave,
    rowColor: 'inherit'
  };
}

