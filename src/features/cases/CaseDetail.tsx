/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Box, Paper, Typography, Grid, Stepper, Step, StepLabel, Button, Divider, Alert, Card, CardContent, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, List, ListItem, ListItemAvatar, Avatar, ListItemText, TextField, MenuItem } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useCasesStore } from '../../store/useCasesStore';
import { listarArchivosCaso } from '../../services/firebaseService';
import { obtenerEvidenciasCasoOffline } from '../../services/offline/offlineDB';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import SendIcon from '@mui/icons-material/Send';
import GavelIcon from '@mui/icons-material/Gavel';
import GestorEvidencias from '../cases/GestorEvidencias';
import ControlCalidad from '../forms/Fase5_ControlCalidad/ControlCalidad';
import EdicionFase1Modal from './EdicionFase1Modal';
import ModalEquipoRegulatorio from './ModalEquipoRegulatorio';

const fasesConfig = [
  { label: 'Fase 1: Notificación', rolResponsable: 'Notificador (Local / Inst.)' },
  { label: 'Fase 2: Evaluación', rolResponsable: 'Equipo Coordinador Inst.' },
  { label: 'Fase 3: Asignación', rolResponsable: 'Equipo Coordinador (ESAVI Inst.)' },
  { label: 'Fase 4: Investigación', rolResponsable: 'Equipo ERR Campo' },
  { label: 'Fase 5: Control Calidad', rolResponsable: 'Equipo Coordinador (5.1) & Secretariado (5.2)' },
  { label: 'Fase 6: Dictamen', rolResponsable: 'Comité de Expertos CNED' }
];

// El historial se lee ahora directamente desde el Store

// --- COMPONENTES AUXILIARES EXTRAÍDOS FUERA DE RENDER ---
function ActionRow({ title, chipStatus, btnText, onClick, disabled, tooltipText, color = "secondary", variant = "contained", btnText2, onClick2, color2 = "primary", variant2 = "outlined" }: any) {
  const getChip = () => {
    if (chipStatus === 'Completado') return <Chip label="Completado" color="success" size="small" />;
    if (chipStatus === 'Pendiente') return <Chip label="Pendiente" color="primary" size="small" variant="outlined" />;
    if (chipStatus === 'Corrección') return <Chip label="Requiere Corrección" color="error" size="small" />;
    return <Chip label="Bloqueado" color="default" size="small" />;
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{title}</Typography>
        {getChip()}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {btnText2 && (
          <Button variant={variant2} color={color2} size="small" onClick={onClick2}>
            {btnText2}
          </Button>
        )}
        {btnText && (
          <Tooltip title={disabled ? tooltipText : ''} placement="left" arrow disableHoverListener={!disabled}>
            <span>
              <Button variant={variant} color={color} size="small" onClick={onClick} disabled={disabled} sx={{ pointerEvents: disabled ? 'none' : 'auto' }}>
                {btnText}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

function ReadOnlyField({ label, value }: { label: string, value: string }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{value}</Typography>
    </Box>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, userEmail } = useAuthStore();

  // --- CONEXIÓN AL STORE CENTRAL ---
  const { casos, devolverCaso, agendarReunionStore, avanzarCaso, guardarNotasCaso, actualizarArchivosCasoStore } = useCasesStore();
  const casoActual = casos.find(c => c.id === id);

  // --- ESTADOS PARA MODALES (Read-Only) ---
  const [openNotif, setOpenNotif] = useState(false);
  const [openEdicionFase1, setOpenEdicionFase1] = useState(false);
  const [isFase1ReadOnly, setIsFase1ReadOnly] = useState(false);
  const [openApertura, setOpenApertura] = useState(false);
  const [openDictamenModal, setOpenDictamenModal] = useState(false);
  const [openEquipoRegulatorio, setOpenEquipoRegulatorio] = useState(false);

  // --- ESTADOS PARA CHECKLISTS NORMATIVOS ---


  // --- ESTADO PARA PESTAÃ‘AS (TABS) ---
  const [tabIndex, setTabIndex] = useState(0);

  // --- ESTADOS PARA NOTAS NUEVAS ---
  const [nuevaNotaOficializacion, setNuevaNotaOficializacion] = useState('');
  const [nuevaNotaPreFase4, setNuevaNotaPreFase4] = useState('');
  const [nuevaNotaFase4, setNuevaNotaFase4] = useState('');
  const [nuevaNotaCierre, setNuevaNotaCierre] = useState('');

  const [openAgendaModal, setOpenAgendaModal] = useState(false);
  const [openEnvioComitéeModal, setOpenEnvioComitéeModal] = useState(false);
  const [openAuditoria, setOpenAuditoria] = useState(false);
  const [nuevaReunion, setNuevaReunion] = useState<{
    tema: string;
    faseRelacionada: string;
    fecha: string;
    hora: string;
    modalidad: 'Virtual' | 'Presencial';
    enlaceOLugar: string;
    archivoBase64?: string;
    nombreArchivo?: string;
    mimeType?: string;
  }>({
    tema: '',
    faseRelacionada: 'Fase 2',
    fecha: '',
    hora: '',
    modalidad: 'Virtual',
    enlaceOLugar: ''
  });



  useEffect(() => {
    let active = true;
    async function syncEvidenciasCaso() {
      if (!id) return;
      let archivosPlanos: any[] = [];
      if (navigator.onLine) {
        try {
          const res = await listarArchivosCaso(id);
          if (res.success && Array.isArray(res.data)) {
            archivosPlanos = res.data.flatMap((g: any) =>
              (g.archivos || []).map((a: any) => ({ ...a, categoria: g.carpeta }))
            );
          }
        } catch {
          // Mantener lista actual si falla red
        }
      }
      try {
        const locales = await obtenerEvidenciasCasoOffline(id);
        const localesPendientes = locales
          .filter(l => l.estado !== 'SINCRONIZADO')
          .map(l => ({
            name: l.nombreArchivo,
            categoria: l.categoria,
            size: l.tamanoBytes,
            isOffline: true
          }));
        archivosPlanos = [...localesPendientes, ...archivosPlanos];
      } catch {
        // Ignorar error de IndexedDB
      }
      if (active) {
        actualizarArchivosCasoStore(id, archivosPlanos);
      }
    }
    syncEvidenciasCaso();
    return () => { active = false; };
  }, [id, actualizarArchivosCasoStore]);

  const abrirModalAgenda = (fase: 'Fase 2' | 'Fase 3' | 'Fase 4' | 'Fase 6', temaSugerido = '') => {
    setNuevaReunion({
      tema: temaSugerido,
      faseRelacionada: fase,
      fecha: '',
      hora: '',
      modalidad: 'Virtual',
      enlaceOLugar: ''
    });
    setOpenAgendaModal(true);
  };

  const handleGuardarReunion = () => {
    if (!nuevaReunion.tema || !nuevaReunion.fecha || !nuevaReunion.hora) return;
    agendarReunionStore(casoActual!.id, {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      tema: nuevaReunion.tema,
      faseRelacionada: nuevaReunion.faseRelacionada,
      fecha: nuevaReunion.fecha,
      hora: nuevaReunion.hora,
      convocados: [],
      estado: 'PROGRAMADA',
      modalidad: nuevaReunion.modalidad,
      enlaceOLugar: nuevaReunion.enlaceOLugar,
      archivoBase64: nuevaReunion.archivoBase64,
      nombreArchivo: nuevaReunion.nombreArchivo,
      mimeType: nuevaReunion.mimeType
    });
    setOpenAgendaModal(false);
    setNuevaReunion({ tema: '', faseRelacionada: 'Fase 2', fecha: '', hora: '', modalidad: 'Virtual', enlaceOLugar: '' });

    // Eliminada la navegación automática a matriz-riesgo según requerimiento.
  };

  // =====================================================================
  // LÃ“GICA DINÁMICA DEL STEPPER BASADO EN EL STORE
  // =====================================================================
  const getActiveStepIndex = (estado: string): number => {
    if (estado === 'NUEVO' || estado === 'NOTIFICADO') return 0;
    if (estado === 'EN_EVALUACION') return 1;
    if (casoActual?.anexoV_completado && casoActual?.anexoVI_completado && casoActual?.anexoVII_completado) return 4;
    if (casoActual?.notasPreFase4 || casoActual?.anexoIII_completado || casoActual?.anexoV_completado || casoActual?.anexoVI_completado || casoActual?.anexoVII_completado) return 3;
    if (estado === 'EN_ASIGNACION' || estado === 'ASIGNADO_A_ERR') return 2;
    if (['EN_INVESTIGACION', 'DEVUELTO_A_ERR'].includes(estado)) return 3;
    if (['EN_REVISION_INSTITUCIONAL', 'DEVUELTO_A_INSTITUCIONAL', 'EN_REVISION_SECRETARIADO', 'APROBADO_PARA_COMITE'].includes(estado)) return 4;
    if (['EN_EVALUACION_COMITE', 'DICTAMINADO'].includes(estado)) return 5;
    if (['CERRADO_DICTAMINADO', 'CERRADO'].includes(estado)) return 6; // Finalizado
    return 0;
  };
  const faseActual = getActiveStepIndex(casoActual?.estadoFlujo || '');

  if (!casoActual) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
        <Alert severity="error" variant="filled" sx={{ display: 'inline-flex', fontSize: '1.2rem' }}>Expediente no encontrado ({id})</Alert>
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={() => navigate('/')}>Volver al Dashboard</Button>
        </Box>
      </Box>
    );
  }

  // --- LÃ“GICA DE COMPLETITUD ---
  const f2Completado = !['NUEVO', 'NOTIFICADO', 'EN_EVALUACION'].includes(casoActual.estadoFlujo);
  const tieneEquipoAsignado = Boolean(
    (casoActual.miembrosERR && casoActual.miembrosERR.length > 0) ||
    casoActual.fechaAsignacionERR ||
    (casoActual.equipoERR && (
      casoActual.equipoERR.idLocal ||
      casoActual.equipoERR.idLocalClinico ||
      casoActual.equipoERR.idLocalInmuno ||
      casoActual.equipoERR.idLocalEpidemio ||
      (casoActual.equipoERR as any)?.esavi_inst ||
      (Array.isArray(casoActual.equipoERR.apoyosSistema) && casoActual.equipoERR.apoyosSistema.length > 0)
    ))
  );

  const tieneInvestigacionIniciada = Boolean(
    casoActual.notasPreFase4 ||
    casoActual.anexoIII_completado ||
    casoActual.anexoV_completado ||
    casoActual.anexoVI_completado ||
    casoActual.anexoVII_completado
  );

  const f3Completado = tieneEquipoAsignado || tieneInvestigacionIniciada ||
    !['NUEVO', 'NOTIFICADO', 'EN_EVALUACION', 'EN_ASIGNACION', 'ASIGNADO_A_ERR'].includes(casoActual.estadoFlujo);

  // --- REGLAS RBAC INTEGRADAS ---
  const userEmailClean = (userEmail || '').trim().toLowerCase();
  const sameEmail = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

  const isJefe = ['ESAVI_INSTITUCIONAL', 'EPIDEMIO_INSTITUCIONAL', 'INMUNO_INSTITUCIONAL'].includes(currentRole as string);
  const idsInstAsignados = casoActual.equipoERR?.idsInstitucionales || [];
  const tieneAsignacionInstitucional = idsInstAsignados.length > 0;
  const isJefeAuditorAsignado = isJefe && (!tieneAsignacionInstitucional || idsInstAsignados.some(e => sameEmail(e, userEmailClean)));
  const isLocalOperativo = ['ESAVI_LOCAL', 'INMUNO_LOCAL', 'EPIDEMIO_LOCAL', 'ERR'].includes(currentRole as string);
  const isEsaviLocal = currentRole === 'ESAVI_LOCAL';
  const isInmunoLocal = currentRole === 'INMUNO_LOCAL';
  const isEpidemioLocal = currentRole === 'EPIDEMIO_LOCAL';
  const isEsaviInstitucional = String(currentRole).toUpperCase() === 'ESAVI_INSTITUCIONAL';
  const isSecretariado = String(currentRole).toUpperCase() === 'SECRETARIADO';
  const isSecretariadoApoyo = isSecretariado && sameEmail(casoActual.equipoRegulatorio?.apoyo, userEmailClean);
  const isSecretariadoAnalista = isSecretariado && sameEmail(casoActual.equipoRegulatorio?.analista, userEmailClean);
  const isSecretariadoCoordinador = isSecretariado && (!casoActual.equipoRegulatorio || sameEmail(casoActual.equipoRegulatorio.coordinador, userEmailClean));
  const isComitée = String(currentRole).toUpperCase() === 'COMITE_EXTERNO';
  const isObserver = ['OBSERVADOR_EPIDEMIO', 'OBSERVADOR_INMUNO'].includes(currentRole as string);

  // Candado estricto Fase 4: Los roles institucionales, secretariado, comité y observadores solo auditan o consultan.
  const isAuditorOrObserver = isJefe || isSecretariado || isComitée || isObserver;

  // Flexibilidad: Comprobar si el correo del usuario actual está en la lista de asignados (case-insensitive)
  const eq = casoActual.equipoERR;
  const isLegacyLiderOApoyo = !eq?.idLocalClinico && (sameEmail(eq?.idLocal, userEmailClean) || sameEmail(eq?.idLocal2, userEmailClean));
  const isUserAssignedToERR = (casoActual.miembrosERR || []).some(m => sameEmail(m, userEmailClean)) ||
    sameEmail(eq?.idLocalClinico, userEmailClean) ||
    sameEmail(eq?.idLocalInmuno, userEmailClean) ||
    sameEmail(eq?.idLocalEpidemio, userEmailClean) ||
    isLegacyLiderOApoyo ||
    !!eq?.apoyosSistema?.some((a: any) => sameEmail(a.email, userEmailClean) && a.permiso === 'LLENAR');

  // Asignaciones especializadas por anexo (Exclusivo para investigadores de campo locales):
  // Anexo V (Puesto de Vacunación): Exclusivo Referente de Inmunizaciones Local
  const isAssignedToV = !isAuditorOrObserver && (
    isInmunoLocal ||
    sameEmail(eq?.idLocalInmuno, userEmailClean) ||
    (isLegacyLiderOApoyo && isInmunoLocal) ||
    (isUserAssignedToERR && isInmunoLocal) ||
    !!eq?.apoyosSistema?.some((a: any) => sameEmail(a.email, userEmailClean) && ['INMUNO', 'GENERAL'].includes(String(a.areaApoyo || '')) && a.permiso === 'LLENAR')
  );

  // Anexo VI (Investigación Domiciliaria): Exclusivo Referente de Epidemiología Local
  const isAssignedToVI = !isAuditorOrObserver && (
    isEpidemioLocal ||
    sameEmail(eq?.idLocalEpidemio, userEmailClean) ||
    (isLegacyLiderOApoyo && isEpidemioLocal) ||
    (isUserAssignedToERR && isEpidemioLocal) ||
    !!eq?.apoyosSistema?.some((a: any) => sameEmail(a.email, userEmailClean) && ['EPIDEMIO', 'GENERAL'].includes(String(a.areaApoyo || '')) && a.permiso === 'LLENAR')
  );

  // Anexo VII (Evaluación Clínica): Exclusivo Referente Clínico / Farmacovigilancia Local
  const isAssignedToVII = !isAuditorOrObserver && (
    isEsaviLocal ||
    sameEmail(eq?.idLocalClinico, userEmailClean) ||
    isLegacyLiderOApoyo ||
    (isUserAssignedToERR && isEsaviLocal) ||
    !!eq?.apoyosSistema?.some((a: any) => sameEmail(a.email, userEmailClean) && ['CLINICA', 'GENERAL'].includes(String(a.areaApoyo || '')) && a.permiso === 'LLENAR')
  );

  // Anexo III (Logística): Referente Clínico Local
  const isAssignedToIII = !isAuditorOrObserver && (
    isEsaviLocal ||
    sameEmail(eq?.idLocalClinico, userEmailClean) ||
    isLegacyLiderOApoyo ||
    (isUserAssignedToERR && isEsaviLocal) ||
    !!eq?.apoyosSistema?.some((a: any) => sameEmail(a.email, userEmailClean) && ['CLINICA', 'GENERAL'].includes(String(a.areaApoyo || '')) && a.permiso === 'LLENAR')
  );
  const tieneReunionFase2 = casoActual.reuniones?.some(r => r.faseRelacionada === 'Fase 2');
  const tieneReunionFase3 = casoActual.reuniones?.some(r => r.faseRelacionada === 'Fase 3' || r.tema?.toLowerCase().includes('pre-fase 4'));
  const tieneReunionFase4 = casoActual.reuniones?.some(r => r.faseRelacionada === 'Fase 4' || r.tema?.toLowerCase().includes('campo'));
  const tieneReunionCierre = casoActual.reuniones?.some(r => r.faseRelacionada === 'Fase 6' || r.faseRelacionada === 'Fase 5');
  const totalEvidencias = (casoActual.archivosAdjuntos || []).length;
  const tieneEvidenciasRepositorio = totalEvidencias > 0;
  const riesgoUpper = (casoActual.riesgo || '').toUpperCase();
  const esRiesgoAlto = riesgoUpper.includes('ALTO') || riesgoUpper.includes('CRÍTICO') || riesgoUpper.includes('CRITICO') || riesgoUpper.includes('NACIONAL');
  const tieneDocRegulatorio = (casoActual.archivosAdjuntos || []).some((a: any) => a.categoria === 'regulatorio');

  // Guía Contextual de Roles Determinística (Sin IA)
  const guiaTurno = (() => {
    const estado = casoActual.estadoFlujo;

    if (['DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(estado)) {
      return {
        esMiTurno: false,
        esFinalizado: true,
        rolResponsable: 'Comité Nacional de Expertos (CNED)',
        titulo: 'Expediente Concluido y Dictaminado',
        mensaje: 'Este caso ha culminado su proceso normativo y cuenta con el dictamen técnico vinculante de causalidad emitido.',
        siguientePaso: 'Consultar el Dictamen de Causalidad o el Informe Técnico de Autoridades.',
        accionTexto: casoActual.dictamenData ? 'Ver Dictamen' : undefined,
        accionFn: casoActual.dictamenData ? () => setOpenDictamenModal(true) : undefined,
      };
    }

    if (estado === 'NUEVO' || estado === 'NOTIFICADO') {
      const esMiTurno = isJefe;
      return {
        esMiTurno,
        esFinalizado: false,
        rolResponsable: 'Equipo Coordinador Institucional',
        titulo: esMiTurno ? 'Tu Turno: Oficialización del Expediente (Fase 2)' : 'En Espera: Oficialización por Equipo Coordinador Institucional',
        mensaje: esMiTurno
          ? 'Como miembro del Equipo Coordinador Institucional (ESAVI / Epidemio / Inmuno), debe verificar las evidencias del caso y proceder a oficializar el expediente para iniciar la evaluación del riesgo.'
          : 'El caso ha sido registrado primariamente. Se encuentra a la espera de que el Equipo Coordinador Institucional realice el triaje, oficialice el expediente y convoque a reunión.',
        siguientePaso: 'Oficializar el expediente y agendar la reunión de triaje en la tarjeta de Fase 2.',
        accionTexto: esMiTurno ? 'Oficializar y Agendar' : undefined,
        accionFn: esMiTurno ? () => {
          if (casoActual.estadoFlujo === 'NUEVO') {
            useCasesStore.getState().avanzarCaso(casoActual.id, 'EN_EVALUACION', 'Fase 2: Evaluación', 'El caso ha entrado en fase de evaluación y triaje.', 'Sin clasificar');
          }
          abrirModalAgenda('Fase 2', 'Reunión de Evaluación y Triaje Inicial');
        } : undefined,
      };
    }

    if (estado === 'EN_EVALUACION' || estado === 'PENDIENTE_OFICIALIZAR') {
      const esMiTurno = isJefe;
      if (!tieneReunionFase2) {
        return {
          esMiTurno,
          esFinalizado: false,
          rolResponsable: 'Equipo Coordinador Institucional (ESAVI / Epidemio / Inmuno)',
          titulo: esMiTurno ? 'Tu Turno: Agendar Reunión de Triaje (Fase 2)' : 'En Espera: Programación de Reunión (Fase 2)',
          mensaje: esMiTurno
            ? 'Antes de diligenciar la Matriz de Riesgo o registrar acuerdos, debe programar la reunión inicial del Equipo Coordinador Institucional y verificar los documentos iniciales en el Gestor de Evidencias.'
            : 'El Equipo Coordinador Institucional debe agendar su reunión inicial de triaje para continuar con la evaluación.',
          siguientePaso: 'Hacer clic en "Agendar Reunión Fase 2" o ir a la pestaña "Agenda y Reuniones".',
          accionTexto: esMiTurno ? 'Agendar Reunión Fase 2' : undefined,
          accionFn: esMiTurno ? () => abrirModalAgenda('Fase 2', 'Reunión de Evaluación y Triaje Inicial') : undefined,
        };
      }
      if (!f2Completado) {
        return {
          esMiTurno,
          esFinalizado: false,
          rolResponsable: 'Equipo Coordinador Institucional (ESAVI / Epidemio / Inmuno)',
          titulo: esMiTurno ? 'Tu Turno: Evaluación de Riesgo y Evidencias Iniciales (Fase 2)' : 'En Espera: Evaluación de Riesgo por Equipo Coordinador',
          mensaje: esMiTurno
            ? 'Debe diligenciar la Matriz de Riesgo institucional para determinar el nivel de respuesta sanitaria. Recuerde revisar o adjuntar evidencias clínicas iniciales en "Gestor de Evidencias" y anotar los acuerdos de la reunión en la tarjeta de Fase 2.'
            : 'El expediente se encuentra en triaje técnico. El Equipo Coordinador Institucional está evaluando la matriz de riesgo.',
          siguientePaso: 'Completar la Matriz de Riesgo, adjuntar evidencias iniciales y guardar las notas de reunión.',
          accionTexto: esMiTurno ? 'Ir a Matriz de Riesgo' : undefined,
          accionFn: esMiTurno ? () => navigate(`/matriz-riesgo/${id}`) : undefined,
        };
      }
      if (!casoActual.notasOficializacion) {
        return {
          esMiTurno,
          esFinalizado: false,
          rolResponsable: 'Equipo Coordinador Institucional (Fase 2)',
          titulo: esMiTurno ? 'Tu Turno: Notas de Reunión y Respaldos Iniciales (Fase 2)' : 'En Espera: Registro de Acuerdos de Reunión (Fase 2)',
          mensaje: esMiTurno
            ? 'La Matriz de Riesgo está completa. Antes de asignar al equipo ERR, registre los acuerdos de la reunión en "Notas y Acuerdos de Reunión (Equipo Coordinador)" y verifique en la pestaña "Gestor de Evidencias" si se adjuntó la documentación clínica inicial.'
            : 'El Equipo Coordinador Institucional está registrando los acuerdos de la reunión inicial y validando los documentos base.',
          siguientePaso: 'Redactar las notas de reunión en la tarjeta de Fases 2 y 3 y revisar la pestaña "Gestor de Evidencias".',
          accionTexto: esMiTurno ? 'Ir a Gestor de Evidencias' : undefined,
          accionFn: esMiTurno ? () => setTabIndex(1) : undefined,
        };
      }
      return {
        esMiTurno,
        esFinalizado: false,
        rolResponsable: 'Equipo Coordinador (ESAVI Institucional)',
        titulo: esMiTurno ? 'Tu Turno: Asignación de Equipo ERR (Fase 3)' : 'En Espera: Designación de Equipo ERR',
        mensaje: esMiTurno
          ? 'La matriz de riesgo y los acuerdos de Fase 2 han sido completados. Debe designar a los profesionales responsables del ERR local (Clínico, Inmunizaciones y Epidemiología).'
          : 'La evaluación de riesgo fue completada. Se está a la espera de que la jefatura institucional asigne al equipo investigador local.',
        siguientePaso: 'Designar a los miembros del ERR en la pantalla de Asignación de Equipo.',
        accionTexto: esMiTurno ? 'Asignar Equipo ERR' : undefined,
        accionFn: esMiTurno ? () => navigate(`/asignar-equipo/${id}`) : undefined,
      };
    }

    if (estado === 'EN_ASIGNACION' || (f2Completado && !f3Completado)) {
      const esMiTurno = isJefe;
      return {
        esMiTurno,
        esFinalizado: false,
        rolResponsable: 'Equipo Coordinador (ESAVI Institucional)',
        titulo: esMiTurno ? 'Tu Turno: Asignación de Equipo ERR (Fase 3)' : 'En Espera: Asignación de Equipo ERR',
        mensaje: esMiTurno
          ? 'Debe designar formalmente al Equipo de Respuesta Rápida local que llevará a cabo la investigación de campo.'
          : 'El nivel institucional está conformando el equipo de respuesta rápida para este caso.',
        siguientePaso: 'Ingresar a Asignación de Equipo y seleccionar o registrar los profesionales locales.',
        accionTexto: esMiTurno ? 'Asignar Equipo ERR' : undefined,
        accionFn: esMiTurno ? () => navigate(`/asignar-equipo/${id}`) : undefined,
      };
    }

    if (estado === 'ASIGNADO_A_ERR' || estado === 'EN_INVESTIGACION' || estado === 'CORREGIDO_POR_ERR') {
      if (!casoActual.notasPreFase4) {
        const esMiTurno = isJefe;
        return {
          esMiTurno,
          esFinalizado: false,
          rolResponsable: 'Equipo Coordinador Institucional',
          titulo: esMiTurno ? 'Tu Turno: Inducción y Lineamientos Pre-Fase 4' : 'En Espera: Lineamientos Pre-Fase 4 por Equipo Coordinador',
          mensaje: esMiTurno
            ? (!tieneReunionFase3
                ? 'El equipo ERR ha sido asignado. Primero debe programar la reunión Pre-Fase 4 en Agenda y luego redactar las notas y acuerdos para desbloquear los anexos de campo.'
                : 'La reunión Pre-Fase 4 ya fue programada. Ahora redacte y guarde los lineamientos iniciales en "Notas y Acuerdos de Reunión (Pre-Fase 4)" para habilitar el llenado de anexos.')
            : 'El equipo local está a la espera de que el Equipo Coordinador Institucional programe la reunión Pre-Fase 4 y registre los acuerdos iniciales.',
          siguientePaso: !tieneReunionFase3
            ? 'Hacer clic en "Agendar Reunión Pre-Fase 4" y luego redactar las Notas Pre-Fase 4.'
            : 'Redactar y guardar las Notas Pre-Fase 4 en la tarjeta de Fase 4.',
          accionTexto: esMiTurno && !tieneReunionFase3 ? 'Agendar Reunión Pre-Fase 4' : undefined,
          accionFn: esMiTurno && !tieneReunionFase3 ? () => abrirModalAgenda('Fase 3', 'Reunión de Inducción Pre-Fase 4') : undefined,
        };
      } else {
        const todosAnexosCompletos = casoActual.anexoIII_completado && casoActual.anexoV_completado && casoActual.anexoVI_completado && casoActual.anexoVII_completado;
        if (todosAnexosCompletos) {
          const esMiTurno = isJefeAuditorAsignado;
          return {
            esMiTurno,
            esFinalizado: false,
            rolResponsable: 'Equipo Coordinador Institucional (Fase 5.1)',
            titulo: esMiTurno ? 'Tu Turno: Auditoría y Control de Calidad Institucional (Fase 5.1)' : 'En Espera: Control de Calidad Institucional',
            mensaje: esMiTurno
              ? 'Todos los anexos de campo han sido completados. Recuerde revisar que se hayan registrado las notas de cierre de campo (Fase 4) y evidencias adjuntas antes de aprobar el pase a Secretariado SRS.'
              : 'Los anexos de campo están completos. Los referentes institucionales designados en Fase 3 están realizando la auditoría de calidad.',
            siguientePaso: 'Hacer clic en "Auditoría Institucional" en la tarjeta de Fase 5.',
            accionTexto: esMiTurno ? 'Auditoría Institucional' : undefined,
            accionFn: esMiTurno ? () => setOpenAuditoria(true) : undefined,
          };
        }

        const puedeIII = isEsaviLocal || isAssignedToIII;
        const puedeVII = isEsaviLocal || isAssignedToVII;
        const puedeV = isInmunoLocal || isAssignedToV;
        const puedeVI = isEpidemioLocal || isAssignedToVI;
        const anexo3Listo = Boolean(casoActual.anexoIII_completado);

        const puedeOperarFase4 = !isAuditorOrObserver && isLocalOperativo && (isUserAssignedToERR || puedeIII || puedeVII || puedeV || puedeVI);

        if (puedeOperarFase4) {
          // 1. Prioridad absoluta: Anexo III (Logística) desbloquea los demás anexos
          if (puedeIII && !anexo3Listo) {
            return {
              esMiTurno: true,
              esFinalizado: false,
              rolResponsable: 'Referente Clínico / ERR Local (Anexo III)',
              titulo: 'Tu Turno: Evaluación Logística previa (Anexo III)',
              mensaje: 'Antes de habilitar el llenado de los Anexos V, VI y VII para todo el equipo ERR, complete el checklist logístico previo al despliegue.',
              siguientePaso: 'Completar y guardar el Anexo III (Evaluación Logística).',
              accionTexto: 'Completar Anexo III (Logística)',
              accionFn: () => navigate('/anexo-logistica/' + id),
            };
          }

          // 2. Bloqueo normativo mientras otro responsable completa Anexo III
          if (!anexo3Listo && ((puedeV && !casoActual.anexoV_completado) || (puedeVI && !casoActual.anexoVI_completado) || (puedeVII && !casoActual.anexoVII_completado))) {
            return {
              esMiTurno: false,
              esFinalizado: false,
              rolResponsable: 'Referente Clínico / ERR Local (Anexo III)',
              titulo: 'En Espera: Evaluación Logística Previa (Anexo III)',
              mensaje: 'Su anexo de campo se habilitará automáticamente en cuanto el Referente Clínico Local complete el Anexo III (Logística).',
              siguientePaso: 'Esperar la finalización del Anexo III para iniciar su anexo correspondiente.',
            };
          }

          // 3. Anexo específico pendiente según rol/asignación del usuario actual
          if (puedeVII && !casoActual.anexoVII_completado) {
            return {
              esMiTurno: true,
              esFinalizado: false,
              rolResponsable: 'Referente Clínico / ERR Local (Anexo VII)',
              titulo: 'Tu Turno: Evaluación Clínica (Anexo VII)',
              mensaje: 'La logística previa ya está lista. Le corresponde completar el Anexo VII (Evaluación Clínica); puede guardar borrador local automático si necesita pausar.',
              siguientePaso: 'Completar el Anexo VII (Evaluación Clínica) y adjuntar evidencias clínicas en el repositorio.',
              accionTexto: 'Llenar Anexo VII (Clínico)',
              accionFn: () => navigate(`/anexo-clinico/${id}`),
            };
          }

          if (puedeV && !casoActual.anexoV_completado) {
            return {
              esMiTurno: true,
              esFinalizado: false,
              rolResponsable: 'Inmunizaciones Local / ERR (Anexo V)',
              titulo: 'Tu Turno: Puesto de Vacunación (Anexo V)',
              mensaje: 'La logística previa ya está lista. Le corresponde completar el Anexo V (Puesto de Vacunación y cadena de frío); su avance se autoguarda localmente.',
              siguientePaso: 'Completar el Anexo V (Puesto de Vacunación) y subir respaldos de PNI en Gestor de Evidencias.',
              accionTexto: 'Llenar Anexo V (Puesto)',
              accionFn: () => navigate(`/anexo-puesto/${id}`),
            };
          }

          if (puedeVI && !casoActual.anexoVI_completado) {
            return {
              esMiTurno: true,
              esFinalizado: false,
              rolResponsable: 'Epidemiología Local / ERR (Anexo VI)',
              titulo: 'Tu Turno: Investigación Domiciliaria (Anexo VI)',
              mensaje: 'La logística previa ya está lista. Le corresponde completar el Anexo VI (Investigación Domiciliaria y Comunitaria); su avance se autoguarda localmente.',
              siguientePaso: 'Completar el Anexo VI (Domiciliaria) y cargar fichas o croquis en Gestor de Evidencias.',
              accionTexto: 'Llenar Anexo VI (Domiciliaria)',
              accionFn: () => navigate(`/anexo-domicilio/${id}`),
            };
          }
        }

        const faltantes: string[] = [];
        if (!casoActual.anexoIII_completado) faltantes.push('Anexo III (Logística)');
        if (!casoActual.anexoVII_completado) faltantes.push('Anexo VII (Clínico)');
        if (!casoActual.anexoV_completado) faltantes.push('Anexo V (Puesto)');
        if (!casoActual.anexoVI_completado) faltantes.push('Anexo VI (Domiciliaria)');
        const resumenFaltantes = faltantes.length > 0 ? faltantes.join(', ') : 'Cierre de investigación';

        if (puedeOperarFase4) {
          if (!tieneEvidenciasRepositorio) {
            return {
              esMiTurno: false,
              esFinalizado: false,
              rolResponsable: 'Equipo de Respuesta Rápida (ERR Local)',
              titulo: 'Su Anexo está Completo — En Espera del Equipo ERR',
              mensaje: `Ya completó su anexo asignado. Anexos pendientes del equipo: ${resumenFaltantes}. Recuerde verificar que existan respaldos documentales en "Gestor de Evidencias".`,
              siguientePaso: 'Cargar evidencias faltantes en el repositorio mientras el resto del ERR concluye sus anexos.',
              accionTexto: 'Ir a Gestor de Evidencias',
              accionFn: () => setTabIndex(1),
            };
          }

          return {
            esMiTurno: false,
            esFinalizado: false,
            rolResponsable: 'Equipo de Respuesta Rápida (ERR Local)',
            titulo: 'Su Anexo está Completo — En Espera del Equipo ERR',
            mensaje: `Ya completó su anexo asignado y el repositorio ya cuenta con evidencias. Quedan pendientes: ${resumenFaltantes}.`,
            siguientePaso: !tieneReunionFase4
              ? 'Esperar los anexos restantes; al concluir podrán agendar la reunión y notas de cierre de campo (Fase 4).'
              : 'Esperar la finalización de los anexos restantes para iniciar la Fase 5.',
            accionTexto: !tieneReunionFase4 ? 'Agendar Reunión Fase 4' : undefined,
            accionFn: !tieneReunionFase4 ? () => abrirModalAgenda('Fase 4', 'Reunión de Cierre de Investigación de Campo') : undefined,
          };
        }

        return {
          esMiTurno: false,
          esFinalizado: false,
          rolResponsable: 'Equipo de Respuesta Rápida (ERR Local)',
          titulo: 'En Espera: Investigación de Campo por Equipo ERR',
          mensaje: `Los profesionales asignados del ERR local se encuentran completando los anexos de campo (${resumenFaltantes}) y cargando evidencias.`,
          siguientePaso: 'Esperar a que el ERR complete los Anexos III, V, VI y VII y las evidencias de respaldo.',
        };
      }
    }

    if (estado === 'DEVUELTO_A_INSTITUCIONAL') {
      const esMiTurno = isJefe;
      return {
        esMiTurno,
        esFinalizado: false,
        rolResponsable: 'ESAVI Institucional (Equipo Coordinador)',
        titulo: esMiTurno ? 'Tu Turno: Subsanación de Observaciones de Auditoría' : 'En Espera: Subsanación por Jefatura Institucional',
        mensaje: esMiTurno
          ? `El Secretariado SRS devolvió el expediente por inconsistencias en: ${casoActual.anexoRechazado || 'Anexo'}. Puede corregirlo directamente o delegarlo al ERR local.`
          : 'El expediente fue devuelto por el Secretariado para subsanar observaciones de calidad.',
        siguientePaso: 'Revisar la observación de auditoría y delegar o corregir el anexo observado.',
      };
    }

    if (estado === 'DEVUELTO_A_ERR') {
      const rechazado = casoActual.anexoRechazado || '';
      const puedeIII = isEsaviLocal || isAssignedToIII;
      const puedeVII = isEsaviLocal || isAssignedToVII;
      const puedeV = isInmunoLocal || isAssignedToV;
      const puedeVI = isEpidemioLocal || isAssignedToVI;

      let accionTexto: string | undefined;
      let accionFn: (() => void) | undefined;

      if (!isAuditorOrObserver && isLocalOperativo) {
        if (puedeIII && rechazado.includes('Anexo III')) {
          accionTexto = 'Corregir Anexo III';
          accionFn = () => navigate(`/anexo-logistica/${id}`);
        } else if (puedeVII && rechazado.includes('Anexo VII')) {
          accionTexto = 'Corregir Anexo VII';
          accionFn = () => navigate(`/anexo-clinico/${id}`);
        } else if (puedeV && rechazado.includes('Anexo V')) {
          accionTexto = 'Corregir Anexo V';
          accionFn = () => navigate(`/anexo-puesto/${id}`);
        } else if (puedeVI && rechazado.includes('Anexo VI')) {
          accionTexto = 'Corregir Anexo VI';
          accionFn = () => navigate(`/anexo-domicilio/${id}`);
        }
      }

      const esMiTurno = Boolean(accionFn) || (!rechazado && isLocalOperativo && isUserAssignedToERR);
      return {
        esMiTurno,
        esFinalizado: false,
        rolResponsable: 'Equipo ERR Local',
        titulo: esMiTurno ? 'Tu Turno: Corrección de Anexo de Campo' : 'En Espera: Corrección por Equipo ERR Local',
        mensaje: esMiTurno
          ? `Se requiere corrección en: ${rechazado || 'Anexo'}. Ingrese al anexo indicado, aplique los ajustes requeridos y vuelva a guardarlo.`
          : `El responsable del anexo observado (${rechazado || 'Anexo'}) se encuentra aplicando las correcciones señaladas por la auditoría.`,
        siguientePaso: 'Modificar y guardar el anexo rechazado en la tarjeta de Fase 4.',
        accionTexto,
        accionFn,
      };
    }

    if (estado === 'EN_REVISION_INSTITUCIONAL') {
      const esMiTurno = isJefeAuditorAsignado;
      return {
        esMiTurno,
        esFinalizado: false,
        rolResponsable: 'Equipo Coordinador Institucional (Fase 5.1)',
        titulo: esMiTurno ? 'Tu Turno: Auditoría y Control de Calidad Institucional (Fase 5.1)' : 'En Espera: Control de Calidad Institucional',
        mensaje: esMiTurno
          ? 'Todos los anexos de campo han sido completados. Debe realizar la auditoría institucional y aprobar el expediente para su revisión por el Secretariado SRS.'
          : 'Los anexos de campo están completos. Los referentes institucionales designados en Fase 3 están realizando la auditoría de calidad.',
        siguientePaso: 'Hacer clic en "Auditoría Institucional" en la tarjeta de Fase 5.',
        accionTexto: esMiTurno ? 'Auditoría Institucional' : undefined,
        accionFn: esMiTurno ? () => setOpenAuditoria(true) : undefined,
      };
    }

    if (estado === 'EN_REVISION_SECRETARIADO') {
      const isCoordinadorSRS = isSecretariado && (!casoActual.equipoRegulatorio || casoActual.equipoRegulatorio.coordinador === userEmail);
      const esMiTurno = isCoordinadorSRS;
      return {
        esMiTurno,
        esFinalizado: false,
        rolResponsable: 'Secretariado Coordinador (SRS - Fase 5.2)',
        titulo: esMiTurno ? 'Tu Turno: Auditoría Técnica de Regulación (Fase 5.2)' : 'En Espera: Auditoría por Secretariado Coordinador SRS',
        mensaje: esMiTurno
          ? 'Como Secretariado Coordinador, debe realizar la auditoría metodológica para autorizar el paso del expediente a la sala de espera del Comité de Expertos.'
          : 'El expediente fue aprobado institucionalmente y está siendo auditado por el Secretariado Coordinador de la SRS.',
        siguientePaso: 'Hacer clic en "Auditoría Secretariado" en la tarjeta de Fase 5.',
        accionTexto: esMiTurno ? 'Auditoría Secretariado' : undefined,
        accionFn: esMiTurno ? () => setOpenAuditoria(true) : undefined,
      };
    }

    if (estado === 'APROBADO_PARA_COMITE') {
      const isCoordinadorSRS = isSecretariado && (!casoActual.equipoRegulatorio || casoActual.equipoRegulatorio.coordinador === userEmail);
      const esMiTurno = isCoordinadorSRS;

      if (!tieneEvidenciasRepositorio) {
        return {
          esMiTurno,
          esFinalizado: false,
          rolResponsable: 'Secretariado Coordinador (SRS)',
          titulo: esMiTurno ? 'Requisito Pendiente: Cargar Evidencias antes del Comité' : 'En Espera: Carga de Evidencias Documentales',
          mensaje: esMiTurno
            ? 'El repositorio del expediente tiene 0 documentos cargados. Es obligatorio adjuntar al menos un documento de respaldo en el Gestor de Evidencias antes de enviar el caso al Comité de Expertos.'
            : 'Se requiere adjuntar al menos un documento en el Gestor de Evidencias antes de convocar al Comité de Expertos.',
          siguientePaso: 'Ir a la pestaña "Gestor de Evidencias" y cargar la documentación pertinente.',
          accionTexto: (esMiTurno || isSecretariadoAnalista) ? 'Ir a Gestor de Evidencias' : undefined,
          accionFn: (esMiTurno || isSecretariadoAnalista) ? () => setTabIndex(1) : undefined,
        };
      }

      if (!tieneReunionCierre) {
        return {
          esMiTurno,
          esFinalizado: false,
          rolResponsable: 'Secretariado Coordinador (SRS)',
          titulo: esMiTurno ? 'Tu Turno: Agendar Reunión de Cierre / Comité (Paso 1 de 2)' : 'En Espera: Programación de Sesión de Comité',
          mensaje: esMiTurno
            ? 'El expediente está aprobado para deliberación. Primero debe programar la reunión del Comité (Fase 6) en la agenda del caso para habilitar el envío.'
            : 'El expediente superó la auditoría de calidad. El Secretariado Coordinador está programando la fecha de sesión para el Comité de Expertos.',
          siguientePaso: 'Hacer clic en "Agendar Reunión" para programar la sesión de Fase 6.',
          accionTexto: esMiTurno ? 'Agendar Reunión' : undefined,
          accionFn: esMiTurno ? () => abrirModalAgenda('Fase 6', 'Sesión de Deliberación Comité de Expertos') : undefined,
        };
      }

      return {
        esMiTurno,
        esFinalizado: false,
        rolResponsable: 'Secretariado Coordinador (SRS)',
        titulo: esMiTurno ? 'Tu Turno: Enviar Expediente al Comité de Expertos (Paso 2 de 2)' : 'En Espera: Envío al Comité por Secretariado',
        mensaje: esMiTurno
          ? 'La reunión de Comité ya está agendada y el expediente cuenta con evidencias en el repositorio. Puede confirmar el envío a la bandeja del Comité de Expertos.'
          : 'La sesión fue programada. El Secretariado Coordinador habilitará el caso en la bandeja del Comité de Expertos.',
        siguientePaso: 'Hacer clic en "Agendar para Comité" y confirmar el envío.',
        accionTexto: esMiTurno ? 'Agendar para Comité' : undefined,
        accionFn: esMiTurno ? () => setOpenEnvioComitéeModal(true) : undefined,
      };
    }

    if (estado === 'EN_EVALUACION_COMITE') {
      const esMiTurno = isComitée;
      return {
        esMiTurno,
        esFinalizado: false,
        rolResponsable: 'Comité Nacional de Expertos (CNED - Fase 6)',
        titulo: esMiTurno ? 'Tu Turno: Dictamen de Causalidad OMS (Fase 6)' : 'En Espera: Deliberación del Comité de Expertos',
        mensaje: esMiTurno
          ? 'Como miembro del Comité, debe revisar la totalidad de las evidencias y emitir el dictamen formal de causalidad.'
          : 'El expediente se encuentra en deliberación y evaluación de causalidad por parte del Comité Nacional de Expertos.',
        siguientePaso: 'Aplicar el algoritmo de causalidad OMS y emitir el acta final.',
        accionTexto: esMiTurno ? 'Emitir Dictamen' : undefined,
        accionFn: esMiTurno ? () => navigate(`/dictamen/${id}`) : undefined,
      };
    }

    return {
      esMiTurno: false,
      esFinalizado: false,
      rolResponsable: 'En Proceso',
      titulo: 'Expediente en Seguimiento',
      mensaje: 'El expediente se encuentra activo en el flujo normativo.',
      siguientePaso: 'Consultar las fases del expediente.',
    };
  })();

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', pb: 8 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Volver a la Bandeja
      </Button>

      {/* ================= BANNERS INTELIGENTES DE ESTADO DE FLUJO ================= */}
      {isObserver && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Modo Observador:</strong> Tiene acceso de solo lectura a este expediente debido a que se encuentra en fase de Auditoría de Secretariado o superior. Las acciones de edición están deshabilitadas.
        </Alert>
      )}

      {casoActual.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL' && isJefe && (
        <Alert
          severity="error"
          variant="filled"
          sx={{ mb: 3, alignItems: 'center' }}
          action={
            <Button color="inherit" size="small" variant="outlined" endIcon={<SendIcon />} onClick={() => devolverCaso(casoActual.id, 'DEVUELTO_A_ERR', casoActual.observacionRechazo!, casoActual.anexoRechazado!, `Jefatura delegó corrección del ${casoActual.anexoRechazado} al equipo local.`)}>
              Delegar corrección al ERR Local
            </Button>
          }
        >
          <strong>ATENCIÓN:</strong> El Secretariado de la SRS ha devuelto este expediente.
          <br /><strong>Observación:</strong> "{casoActual.observacionRechazo}" (Sección: {casoActual.anexoRechazado}).
        </Alert>
      )}

      {casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && isLocalOperativo && (
        <Alert severity="error" variant="filled" sx={{ mb: 3 }}>
          <strong>ACCIÓN REQUERIDA:</strong> El ESAVI Institucional ha devuelto este expediente para corrección.
          <br /><strong>Observación:</strong> "{casoActual.observacionRechazo}" (Sección: {casoActual.anexoRechazado}).
        </Alert>
      )}

      {(() => {
        const strRiesgo = String(casoActual.riesgo || '').toUpperCase();
        const esRiesgoAltoOCritico = strRiesgo.includes('ALTO') || strRiesgo.includes('CRITIC') || strRiesgo.includes('CRÍTICO') || strRiesgo.includes('NACIONAL');
        
        return isSecretariado && esRiesgoAltoOCritico && !casoActual.equipoRegulatorio && (
          <Alert
            severity="warning"
            variant="filled"
            sx={{ mb: 3, alignItems: 'center' }}
            action={
              <Button color="inherit" size="small" variant="outlined" onClick={() => setOpenEquipoRegulatorio(true)}>
                Conformar Equipo Regulatorio
              </Button>
            }
          >
            <strong>ATENCIÓN CASO {strRiesgo.includes('ALTO') ? 'DE RIESGO ALTO (REGIONAL)' : 'CRÍTICO (NACIONAL)'}:</strong> Debe conformar su Sub-Equipo Regulatorio Interno (Coordinador, Analista y Apoyo) para habilitar y gestionar el espacio documental regulatorio.
          </Alert>
        );
      })()}
      
      {isSecretariado && casoActual.equipoRegulatorio && (
        <Alert
          severity="success"
          sx={{ mb: 3, alignItems: 'center' }}
          action={
            (!casoActual.equipoRegulatorio.coordinador || casoActual.equipoRegulatorio.coordinador === userEmail) ? (
              <Button color="inherit" size="small" variant="outlined" onClick={() => setOpenEquipoRegulatorio(true)}>
                Ver / Editar Equipo Regulatorio
              </Button>
            ) : undefined
          }
        >
          <strong>Sub-Equipo Regulatorio SRS:</strong> Coordinador: {casoActual.equipoRegulatorio.coordinador} | Analista: {casoActual.equipoRegulatorio.analista} | Apoyo: {casoActual.equipoRegulatorio.apoyo || 'Ninguno'}
        </Alert>
      )}

      {/* ================= CABECERA DEL EXPEDIENTE ================= */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>Expediente {casoActual.id}</Typography>
            <Typography variant="subtitle1" color="text.secondary">Paciente: {casoActual.paciente} | Vacuna: {casoActual.vacuna}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Establecimiento Notificador: {casoActual.establecimiento}</Typography>
              {casoActual.establecimientoVacunacion && (
                <Chip size="small" variant="outlined" color="primary" label={`Lugar de Vacunación: ${casoActual.establecimientoVacunacion}`} />
              )}
              {casoActual.numeroNotificacionFacedra && (
                <Chip size="small" color="secondary" label={`FACEDRA: ${casoActual.numeroNotificacionFacedra}`} />
              )}
              {casoActual.esSeguimiento && (
                <Chip size="small" color="info" label="Seguimiento" />
              )}
              {Array.isArray(casoActual.medicamentosConcomitantes) && casoActual.medicamentosConcomitantes.length > 0 && (
                <Chip size="small" variant="outlined" color="secondary" label={`+${casoActual.medicamentosConcomitantes.length} Vacuna(s) Concomitante(s)`} />
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: 'right' }}>
            <Typography variant="overline" color="secondary" sx={{ fontWeight: 'bold', display: 'block' }}>ESTADO ACTUAL</Typography>
            <Typography variant="h6" sx={{ display: 'block', mb: 1 }} color={(casoActual.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL' || casoActual.estadoFlujo === 'DEVUELTO_A_ERR') ? "error.main" : "text.primary"}>
              {(() => {
                const estado = casoActual.estadoFlujo;
                if (estado === 'DEVUELTO_A_INSTITUCIONAL' || estado === 'DEVUELTO_A_ERR') return 'Devuelto por Observaciones';
                if (estado === 'NUEVO' || estado === 'NOTIFICADO') return 'Fase 1: Notificación';
                if (estado === 'EN_EVALUACION' || estado === 'PENDIENTE_OFICIALIZAR') return 'Fase 2: Evaluación';
                if (estado === 'EN_ASIGNACION' || estado === 'ASIGNADO_A_ERR') return 'Fase 3: Asignación';
                if (estado === 'EN_INVESTIGACION' || estado === 'CORREGIDO_POR_ERR') return 'Fase 4: Investigación';
                if (estado === 'EN_REVISION_INSTITUCIONAL' || estado === 'EN_REVISION_SECRETARIADO' || estado === 'APROBADO_PARA_COMITE') return 'Fase 5: Control de Calidad';
                if (estado === 'EN_EVALUACION_COMITE' || estado === 'DICTAMINADO') return 'Fase 6: Comité Externo';
                if (estado === 'CERRADO_DICTAMINADO' || estado === 'CERRADO') return 'Expediente Cerrado';
                return casoActual.fase || 'Fase Activa';
              })()}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end', mt: 2 }}>
              <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => { setIsFase1ReadOnly(true); setOpenEdicionFase1(true); }} sx={{ width: '220px' }}>
                Ver Notificación Inicial
              </Button>
              <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => setOpenApertura(true)} sx={{ width: '220px' }}>
                Ver Datos de Apertura
              </Button>
              {casoActual.dictamenData && (
                <Button variant="contained" color="secondary" size="small" startIcon={<GavelIcon />} onClick={() => setOpenDictamenModal(true)} sx={{ width: '220px', mt: 1 }}>
                  Ver Dictamen de Causalidad
                </Button>
              )}
              <Button variant="contained" color="primary" size="small" onClick={() => navigate(`/caso/${casoActual.id}/expediente`)} sx={{ width: '220px', mt: 1 }}>
                Abrir Expediente Digital
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ================= GUÍA CONTEXTUAL DE ROLES ("MI TURNO DE ACTUACIÓN") ================= */}
      <Paper
        elevation={2}
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: 2,
          borderLeft: '6px solid',
          borderColor: guiaTurno.esFinalizado ? 'info.main' : guiaTurno.esMiTurno ? 'success.main' : 'warning.main',
          bgcolor: guiaTurno.esFinalizado ? '#f4f6f8' : guiaTurno.esMiTurno ? '#edf7ed' : '#fffde7'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Chip
                label={guiaTurno.esFinalizado ? "Expediente Concluido" : guiaTurno.esMiTurno ? "Tu Turno de Actuación" : "En Espera de Otro Rol"}
                color={guiaTurno.esFinalizado ? "default" : guiaTurno.esMiTurno ? "success" : "warning"}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                Rol Responsable: {guiaTurno.rolResponsable}
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: guiaTurno.esMiTurno ? 'success.dark' : 'text.primary', mb: 0.5 }}>
              {guiaTurno.titulo}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              {guiaTurno.mensaje}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: 'block' }}>
              Próximo paso requerido: {guiaTurno.siguientePaso}
            </Typography>
          </Box>

          {guiaTurno.accionTexto && guiaTurno.accionFn && (
            <Button
              variant="contained"
              color={guiaTurno.esMiTurno ? "success" : "primary"}
              onClick={guiaTurno.accionFn}
              sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
            >
              {guiaTurno.accionTexto}
            </Button>
          )}
        </Box>
      </Paper>

      {/* ================= 1. STEPPER DINÁMICO CON ETIQUETAS DE ROL ================= */}
      <Stepper activeStep={faseActual} alternativeLabel sx={{ mb: 5 }}>
        {fasesConfig.map((item) => (
          <Step key={item.label}>
            <StepLabel
              optional={
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
                  {item.rolResponsable}
                </Typography>
              }
              error={(casoActual.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL' || casoActual.estadoFlujo === 'DEVUELTO_A_ERR') && item.label === 'Fase 5: Control Calidad'}
            >
              {item.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ================= BANNER DE OBSERVACIONES ================= */}
      {(casoActual.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL' || casoActual.estadoFlujo === 'DEVUELTO_A_ERR') && casoActual.observacionActual && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Observaciones de Auditoría:</strong> {casoActual.observacionActual}
        </Alert>
      )}

      {/* ================= TABS PRINCIPALES (GESTIÓN DEL EXPEDIENTE PRIMERO) ================= */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} aria-label="expediente tabs" variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab label="Gestión del Expediente" />
          <Tab label={`Gestor de Evidencias (${totalEvidencias})`} />
          <Tab label="Historial de Cambios" iconPosition="start" icon={<HistoryIcon fontSize="small" />} />
          <Tab label="Agenda y Reuniones" />
        </Tabs>
      </Box>

      {/* TAB 0: GESTIÓN DEL EXPEDIENTE */}
      {tabIndex === 0 && (
        <Box>
          {/* TARJETA 0: INFORMACIÓN GENERAL (Fase 1) */}
          <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SearchIcon color="primary" />
                  <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>Fase 1: Información General del Caso</Typography>
                </Box>
                <Chip label="Responsable: Notificador Local" size="small" variant="outlined" color="primary" />
              </Box>
              <Box sx={{ p: 2 }}>
                <ActionRow
                  title="Datos Originales de Notificación"
                  chipStatus="Completado"
                  btnText={isEsaviInstitucional ? "Editar Información" : undefined}
                  onClick={() => { setIsFase1ReadOnly(false); setOpenEdicionFase1(true); }}
                  btnText2="Ver Información"
                  onClick2={() => { setIsFase1ReadOnly(true); setOpenEdicionFase1(true); }}
                  color2="primary"
                />
              </Box>
            </CardContent>
          </Card>

          {/* TARJETA 1: JEFATURAS (Fase 2 y 3) */}
          <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>Fases 2 y 3: Evaluación y Asignación de Equipo</Typography>
                </Box>
                <Chip label="Responsable: Equipo Coordinador Institucional" size="small" variant="outlined" color="primary" />
              </Box>
              <Box sx={{ p: 2 }}>
                <ActionRow
                  title="Oficialización del Expediente"
                  chipStatus={(casoActual.estadoFlujo !== 'NUEVO' && tieneReunionFase2) ? 'Completado' : 'Pendiente'}
                  btnText={casoActual.estadoFlujo !== 'NUEVO' && !tieneReunionFase2 ? "Agendar Reunión (Faltante)" : "Oficializar y Agendar Reunión"}
                  onClick={() => {
                    // Update the state to EN_EVALUACION first!
                    if (casoActual.estadoFlujo === 'NUEVO') {
                      useCasesStore.getState().avanzarCaso(casoActual.id, 'EN_EVALUACION', 'Fase 2: Evaluación', 'El caso ha entrado en fase de evaluación y triaje.', 'Sin clasificar');
                    }
                    abrirModalAgenda('Fase 2', 'Reunión de Evaluación y Triaje Inicial');
                  }}
                  disabled={!isJefe || (casoActual.estadoFlujo !== 'NUEVO' && tieneReunionFase2)}
                  tooltipText={!isJefe ? "Requiere rol de Jefatura." : ((casoActual.estadoFlujo !== 'NUEVO' && tieneReunionFase2) ? "El caso ya está oficializado y agendado." : "Oficializar expediente y agendar reunión.")}
                  color="success"
                />

                {casoActual.estadoFlujo !== 'NUEVO' && (
                  <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Notas y Acuerdos de Reunión (Equipo Coordinador)</Typography>

                    {!casoActual.notasOficializacion && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Guía de Fase 2:</strong> Registre los acuerdos de la reunión inicial de triaje y verifique en la pestaña{' '}
                        <Button size="small" variant="text" onClick={() => setTabIndex(1)} sx={{ p: 0, minWidth: 'auto', fontWeight: 'bold', textDecoration: 'underline', verticalAlign: 'baseline' }}>
                          Gestor de Evidencias
                        </Button>{' '}
                        si requiere cargar documentación clínica inicial (ej. hoja FACEDRA, epicrisis o referencias).
                      </Alert>
                    )}

                    {casoActual.notasOficializacion && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fff', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                        <Typography variant="body2">{casoActual.notasOficializacion}</Typography>
                      </Paper>
                    )}

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Escriba una nueva observación o acuerdo..."
                      value={nuevaNotaOficializacion}
                      onChange={(e) => setNuevaNotaOficializacion(e.target.value)}
                      disabled={(isObserver || isComitée) || !tieneReunionFase2}
                    />
                    {!tieneReunionFase2 && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="error">Debe programar la reunión de Fase 2 en la pestaña "Agenda" antes de redactar los acuerdos.</Typography>
                        {isJefe && (
                          <Button size="small" variant="outlined" color="primary" onClick={() => abrirModalAgenda('Fase 2', 'Reunión de Evaluación y Triaje Inicial')}>
                            Agendar Reunión Fase 2
                          </Button>
                        )}
                      </Box>
                    )}
                    {(!isObserver && !isComitée) && tieneReunionFase2 && (
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ mt: 1 }}
                        disabled={!nuevaNotaOficializacion.trim()}
                        onClick={async () => {
                          const concatenado = `${casoActual.notasOficializacion ? casoActual.notasOficializacion + '\n\n' : ''}[${dayjs().format('DD/MM/YYYY HH:mm')} - ${userEmail}]:\n${nuevaNotaOficializacion}`;
                          await guardarNotasCaso(casoActual.id, 'notasOficializacion', concatenado);
                          setNuevaNotaOficializacion('');
                          alert('Nota agregada exitosamente.');
                        }}
                      >
                        Agregar Nota
                      </Button>
                    )}
                  </Box>
                )}

                <ActionRow
                  title="Matriz de Riesgo (Fase 2)"
                  chipStatus={f2Completado ? 'Completado' : 'Pendiente'}
                  btnText={f2Completado ? "Editar Matriz" : "Evaluar Riesgo"}
                  onClick={() => navigate(`/matriz-riesgo/${id}`)}
                  disabled={!isJefe || casoActual.estadoFlujo === 'NUEVO'}
                  tooltipText={casoActual.estadoFlujo === 'NUEVO' ? "Debe oficializar el expediente primero." : (f2Completado ? "Actualizar la matriz de riesgo." : "Evaluar riesgo.")}
                  btnText2={f2Completado ? "Ver Resumen" : undefined}
                  onClick2={() => setOpenApertura(true)}
                  color2="primary"
                />
                <ActionRow
                  title="Asignación Equipo ERR (Fase 3)"
                  chipStatus={f3Completado ? 'Completado' : 'Pendiente'}
                  btnText={f3Completado ? "Ver / Reasignar Equipo" : "Asignar Equipo"}
                  onClick={() => navigate('/asignar-equipo/' + id)}
                  disabled={!isJefe || ['NUEVO', 'NOTIFICADO', 'PENDIENTE_OFICIALIZAR'].includes(casoActual.estadoFlujo) || !f2Completado}
                  tooltipText={
                    !isJefe
                      ? "Acceso exclusivo para Jefaturas."
                      : ['NUEVO', 'NOTIFICADO', 'PENDIENTE_OFICIALIZAR'].includes(casoActual.estadoFlujo)
                        ? "Debe oficializar el expediente primero (Fase 2)."
                        : !f2Completado
                          ? "Debe completar la Matriz de Riesgo (Fase 2) antes de asignar al Equipo ERR."
                          : "Puede asignar o reasignar el equipo durante la investigación."
                  }
                />
              </Box>
            </CardContent>
          </Card>

          {/* PANEL DE DEPURACIÃ“N FASE 4 */}
          {/* <div style={{ background: '#333', color: '#0f0', padding: '10px', marginBottom: '10px', fontFamily: 'monospace', fontSize: '12px' }}>
            <p>--- DEBUG PANEL FASE 4 ---</p>
            <p>Rol Activo: {currentRole}</p>
            <p>Email Activo: {userEmail}</p>
            <p>Miembros ERR: {JSON.stringify(casoActual.miembrosERR)}</p>
            <p>isUserAssignedToERR: {isUserAssignedToERR ? 'TRUE' : 'FALSE'}</p>
            <p>Estado Caso: {casoActual.estadoFlujo}</p>
            <p>Logística Terminada?: {casoActual.anexoIII_completado ? 'TRUE' : 'FALSE'}</p>
          </div> */}

          {/* TARJETA 2: TRABAJO DE CAMPO (Fase 4) */}
          <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SearchIcon color="secondary" />
                  <Typography variant="subtitle1" color="secondary.main" sx={{ fontWeight: 'bold' }}>Fase 4: Investigación de Campo</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label="Responsable: Equipo ERR de Campo" size="small" variant="outlined" color="secondary" />
                  {isLocalOperativo && isUserAssignedToERR && <Chip label="Asignado como Investigador ERR" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />}
                </Box>
              </Box>

              <Box sx={{ p: 2 }}>

                {(casoActual.notasPreFase4 || ['ASIGNADO_A_ERR', 'EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo)) && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Notas y Acuerdos de Reunión (Pre-Fase 4)</Typography>

                    {casoActual.notasPreFase4 && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fff', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                        <Typography variant="body2">{casoActual.notasPreFase4}</Typography>
                      </Paper>
                    )}

                    {['ASIGNADO_A_ERR', 'EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) && (
                      <>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Escriba una nueva observación, indicación o acuerdo..."
                          value={nuevaNotaPreFase4}
                          onChange={(e) => setNuevaNotaPreFase4(e.target.value)}
                          disabled={(isObserver || isComitée) || !tieneReunionFase3 || !f2Completado}
                        />
                        {!tieneReunionFase3 && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="error">Debe programar la reunión Pre-Fase 4 (Fase 3) en la pestaña "Agenda" antes de redactar los acuerdos.</Typography>
                            {(!isObserver && !isComitée) && (
                              <Button size="small" variant="outlined" color="primary" onClick={() => abrirModalAgenda('Fase 3', 'Reunión de Inducción Pre-Fase 4')}>
                                Agendar Reunión Pre-Fase 4
                              </Button>
                            )}
                          </Box>
                        )}
                        {tieneReunionFase3 && !f2Completado && <Typography variant="caption" color="error">Debe llenar la Matriz de Riesgo antes de redactar los acuerdos.</Typography>}
                        {(!isObserver && !isComitée) && tieneReunionFase3 && (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ mt: 1 }}
                            disabled={!nuevaNotaPreFase4.trim()}
                            onClick={async () => {
                              const concatenado = `${casoActual.notasPreFase4 ? casoActual.notasPreFase4 + '\n\n' : ''}[${dayjs().format('DD/MM/YYYY HH:mm')} - ${userEmail}]:\n${nuevaNotaPreFase4}`;
                              await guardarNotasCaso(casoActual.id, 'notasPreFase4', concatenado);
                              setNuevaNotaPreFase4('');
                              alert('Nota agregada exitosamente.');
                            }}
                          >
                            Agregar Nota
                          </Button>
                        )}
                      </>
                    )}
                  </Box>
                )}

                {(() => {
                  const isViewer = isEsaviInstitucional || isSecretariado || isComitée || isUserAssignedToERR;

                  const a3Status = (casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && casoActual.anexoRechazado?.includes('Anexo III (')) ? 'Corrección' : casoActual.anexoIII_completado ? 'Completado' : 'Pendiente';
                  const a5Status = (casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && casoActual.anexoRechazado?.includes('Anexo V (')) ? 'Corrección' : casoActual.anexoV_completado ? 'Completado' : 'Pendiente';
                  const a6Status = (casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && casoActual.anexoRechazado?.includes('Anexo VI (')) ? 'Corrección' : casoActual.anexoVI_completado ? 'Completado' : 'Pendiente';
                  const a7Status = (casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && casoActual.anexoRechazado?.includes('Anexo VII (')) ? 'Corrección' : casoActual.anexoVII_completado ? 'Completado' : 'Pendiente';

                  return (
                    <>
                      <ActionRow
                        title="Evaluación Logística (Anexo III) (llena esavi local)"
                        chipStatus={a3Status}
                        btnText={a3Status === 'Completado' ? "VER ANEXO" : a3Status === 'Corrección' ? "Modificar Anexo" : "Completar Logística"}
                        variant={a3Status === 'Completado' ? "outlined" : "contained"}
                        onClick={() => {
                          if (a3Status === 'Completado') navigate(`/anexo-logistica/${id}?mode=view`);
                          else navigate('/anexo-logistica/' + id);
                        }}
                        disabled={a3Status === 'Completado' ? !isViewer : (!casoActual.notasPreFase4 || !(isEsaviLocal || isAssignedToIII) || !['ASIGNADO_A_ERR', 'EN_INVESTIGACION', 'CORREGIDO_POR_ERR', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo))}
                        tooltipText={a3Status === 'Completado' ? "Ver Anexo" : (!casoActual.notasPreFase4 ? "Debe completarse la reunión Pre-Fase 4 (Notas) primero." : isAuditorOrObserver ? "Acceso exclusivo para el Equipo ERR Local (Referente Clínico Local). Como nivel institucional/auditor, su función es de consulta y posterior auditoría en Fase 5." : (!(isEsaviLocal || isAssignedToIII) ? "Acceso exclusivo para Coordinador Local o Clínico." : "Habilitado para completar."))}
                        color={a3Status === 'Completado' ? 'primary' : a3Status === 'Corrección' ? 'error' : 'secondary'}
                      />
                      <ActionRow
                        title="Evaluación Clínica (Anexo VII) (llena esavi local)"
                        chipStatus={a7Status}
                        btnText={a7Status === 'Completado' ? "VER ANEXO" : a7Status === 'Corrección' ? "Modificar Anexo" : "Llenar Clínico"}
                        variant={a7Status === 'Completado' ? "outlined" : "contained"}
                        onClick={() => {
                          if (a7Status === 'Completado') navigate(`/anexo-clinico/${id}?mode=view`);
                          else navigate(`/anexo-clinico/${id}`);
                        }}
                        disabled={a7Status === 'Completado' ? !isViewer : (!casoActual.notasPreFase4 || !(isEsaviLocal || isAssignedToVII) || !['ASIGNADO_A_ERR', 'EN_INVESTIGACION', 'CORREGIDO_POR_ERR', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) || (a7Status !== 'Corrección' && !casoActual.anexoIII_completado))}
                        tooltipText={a7Status === 'Completado' ? "Ver Anexo" : (!casoActual.notasPreFase4 ? "Debe completarse la reunión Pre-Fase 4 primero." : ((a7Status !== 'Corrección' && !casoActual.anexoIII_completado) ? "Debe completar Logística (Anexo III) primero." : isAuditorOrObserver ? "Acceso exclusivo para el Referente Clínico Local (ERR). El nivel institucional audita en Fase 5.1." : (!(isEsaviLocal || isAssignedToVII) ? "Acceso exclusivo para Referente Clínico o ERR." : "Habilitado para completar.")))}
                        color={a7Status === 'Completado' ? 'primary' : a7Status === 'Corrección' ? 'error' : 'secondary'}
                      />
                      <ActionRow
                        title="Puesto Vacunación (Anexo V) (llena inmuno local)"
                        chipStatus={a5Status}
                        btnText={a5Status === 'Completado' ? "VER ANEXO" : a5Status === 'Corrección' ? "Modificar Anexo" : "Llenar Anexo V"}
                        variant={a5Status === 'Completado' ? "outlined" : "contained"}
                        onClick={() => {
                          if (a5Status === 'Completado') navigate(`/anexo-puesto/${id}?mode=view`);
                          else navigate(`/anexo-puesto/${id}`);
                        }}
                        disabled={a5Status === 'Completado' ? !isViewer : (!casoActual.notasPreFase4 || !(isInmunoLocal || isAssignedToV) || !['ASIGNADO_A_ERR', 'EN_INVESTIGACION', 'CORREGIDO_POR_ERR', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) || (a5Status !== 'Corrección' && !casoActual.anexoIII_completado))}
                        tooltipText={a5Status === 'Completado' ? "Ver Anexo" : (!casoActual.notasPreFase4 ? "Debe completarse la reunión Pre-Fase 4 primero." : ((a5Status !== 'Corrección' && !casoActual.anexoIII_completado) ? "Debe completar Logística (Anexo III) primero." : isAuditorOrObserver ? "Acceso exclusivo para Inmunizaciones Local (ERR). El nivel institucional audita en Fase 5.1." : (!(isInmunoLocal || isAssignedToV) ? "Acceso exclusivo para Inmunizaciones o ERR." : "Habilitado para completar.")))}
                        color={a5Status === 'Completado' ? 'primary' : a5Status === 'Corrección' ? 'error' : 'secondary'}
                      />
                      <ActionRow
                        title="Inv. Domiciliaria (Anexo VI) (llena epidemiólogo local)"
                        chipStatus={a6Status}
                        btnText={a6Status === 'Completado' ? "VER ANEXO" : a6Status === 'Corrección' ? "Modificar Anexo" : "Llenar Anexo VI"}
                        variant={a6Status === 'Completado' ? "outlined" : "contained"}
                        onClick={() => {
                          if (a6Status === 'Completado') navigate(`/anexo-domicilio/${id}?mode=view`);
                          else navigate(`/anexo-domicilio/${id}`);
                        }}
                        disabled={a6Status === 'Completado' ? !isViewer : (!casoActual.notasPreFase4 || !(isEpidemioLocal || isAssignedToVI) || !['ASIGNADO_A_ERR', 'EN_INVESTIGACION', 'CORREGIDO_POR_ERR', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) || (a6Status !== 'Corrección' && !casoActual.anexoIII_completado))}
                        tooltipText={a6Status === 'Completado' ? "Ver Anexo" : (!casoActual.notasPreFase4 ? "Debe completarse la reunión Pre-Fase 4 primero." : ((a6Status !== 'Corrección' && !casoActual.anexoIII_completado) ? "Debe completar Logística (Anexo III) primero." : isAuditorOrObserver ? "Acceso exclusivo para Epidemiología Local (ERR). El nivel institucional audita en Fase 5.1." : (!(isEpidemioLocal || isAssignedToVI) ? "Acceso exclusivo para Epidemiólogo o ERR." : "Habilitado para completar.")))}
                        color={a6Status === 'Completado' ? 'primary' : a6Status === 'Corrección' ? 'error' : 'secondary'}
                      />
                    </>
                  );
                })()}

                {/* INDICADOR GUIADO DEL REPOSITORIO DOCUMENTAL (FASE 4) */}
                <Alert
                  severity={tieneEvidenciasRepositorio ? 'success' : 'warning'}
                  sx={{ mt: 3, mb: 1 }}
                  action={
                    (!isObserver && !isSecretariadoApoyo) && (
                      <Button size="small" color="inherit" variant="outlined" onClick={() => setTabIndex(1)} sx={{ fontWeight: 'bold' }}>
                        Subir Documentos al Repositorio
                      </Button>
                    )
                  }
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Repositorio Documental de Evidencias: {totalEvidencias} {totalEvidencias === 1 ? 'archivo cargado' : 'archivos cargados'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Durante la Fase 4 el equipo debe respaldar la investigación en la pestaña <strong>Gestor de Evidencias</strong> según su área:{' '}
                    <strong>Clínica / General</strong> (ESAVI Local: epicrisis, labs, DUI), <strong>PNI</strong> (Inmuno Local: carné y cadena de frío) y{' '}
                    <strong>Epidemiológica</strong> (Epidemio Local: fichas y croquis). Sin evidencias cargadas no se permitirá el pase al Comité.
                  </Typography>
                </Alert>

                {/* NUEVO BLOQUE: NOTAS POST-CAMPO (FASE 4) */}
                {(casoActual.notasFase4 || ['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL', 'EN_REVISION_INSTITUCIONAL'].includes(casoActual.estadoFlujo)) && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Notas y Acuerdos de Cierre de Campo (Fase 4)</Typography>
                    
                    {casoActual.notasFase4 && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fff', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                        <Typography variant="body2">{casoActual.notasFase4}</Typography>
                      </Paper>
                    )}

                    {['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL', 'EN_REVISION_INSTITUCIONAL'].includes(casoActual.estadoFlujo) && (
                      <>
                        {!casoActual.notasFase4 && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <strong>Guía de Cierre de Campo:</strong> Al concluir los anexos, recuerde cargar las evidencias recolectadas en{' '}
                            <Button size="small" variant="text" onClick={() => setTabIndex(1)} sx={{ p: 0, minWidth: 'auto', fontWeight: 'bold', textDecoration: 'underline', verticalAlign: 'baseline' }}>
                              Gestor de Evidencias
                            </Button>, agendar la reunión de cierre de Fase 4 y registrar aquí los acuerdos del equipo.
                          </Alert>
                        )}
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Escriba observaciones tras la investigación del ERR..."
                          value={nuevaNotaFase4}
                          onChange={(e) => setNuevaNotaFase4(e.target.value)}
                          disabled={(isObserver || isComitée) || !tieneReunionFase4}
                        />
                        {!tieneReunionFase4 && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="error">Debe programar la reunión de Cierre de Campo (Fase 4) en la pestaña "Agenda" para ingresar las notas.</Typography>
                            {(!isObserver && !isComitée) && (
                              <Button size="small" variant="outlined" color="secondary" onClick={() => abrirModalAgenda('Fase 4', 'Reunión de Cierre de Investigación de Campo')}>
                                Agendar Reunión Fase 4
                              </Button>
                            )}
                          </Box>
                        )}
                        {(!isObserver && !isComitée) && tieneReunionFase4 && (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ mt: 1 }}
                            disabled={!nuevaNotaFase4.trim()}
                            onClick={async () => {
                              const concatenado = `${casoActual.notasFase4 ? casoActual.notasFase4 + '\n\n' : ''}[${dayjs().format('DD/MM/YYYY HH:mm')} - ${userEmail}]:\n${nuevaNotaFase4}`;
                              await guardarNotasCaso(casoActual.id, 'notasFase4', concatenado);
                              setNuevaNotaFase4('');
                              alert('Nota de Fase 4 agregada exitosamente.');
                            }}
                          >
                            Agregar Nota
                          </Button>
                        )}
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* TARJETA 2.5: CONTROL DE CALIDAD (Fase 5) */}
          <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FactCheckIcon sx={{ color: '#ed6c02' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>Fase 5: Control de Calidad y Auditoría</Typography>
                </Box>
                <Chip label="Responsable: Equipo Coordinador (5.1) & Secretariado Coordinador (5.2)" size="small" variant="outlined" color="warning" />
              </Box>
              <Box sx={{ p: 2 }}>
                <ActionRow
                  title="Auditoría Institucional (Fase 5.1) evalúa equipo coordinador"
                  chipStatus={['EN_REVISION_SECRETARIADO', 'APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO'].includes(casoActual.estadoFlujo) ? 'Completado' : 'Pendiente'}
                  btnText="Auditoría Institucional"
                  color="warning"
                  onClick={() => setOpenAuditoria(true)}
                  disabled={!(isJefeAuditorAsignado && casoActual.anexoIII_completado && casoActual.anexoV_completado && casoActual.anexoVI_completado && casoActual.anexoVII_completado && ['ASIGNADO_A_ERR', 'EN_INVESTIGACION', 'DEVUELTO_A_INSTITUCIONAL', 'EN_REVISION_INSTITUCIONAL'].includes(casoActual.estadoFlujo))}
                  tooltipText={
                    !isJefe
                      ? "Exclusivo para Equipo Coordinador (Nivel Institucional)."
                      : !isJefeAuditorAsignado
                      ? "Solo los referentes institucionales designados en la Fase 3 para este caso pueden auditar en Fase 5.1."
                      : "Requiere todos los anexos completados."
                  }
                />
                <ActionRow
                  title="Auditoría Secretariado (Fase 5.2)"
                  chipStatus={['APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO'].includes(casoActual.estadoFlujo) ? 'Completado' : 'Pendiente'}
                  btnText="Auditoría Secretariado"
                  color="warning"
                  onClick={() => setOpenAuditoria(true)}
                  disabled={!(
                    isSecretariado &&
                    casoActual.estadoFlujo === 'EN_REVISION_SECRETARIADO' &&
                    (!casoActual.equipoRegulatorio || casoActual.equipoRegulatorio.coordinador === userEmail)
                  )}
                  tooltipText={
                    !isSecretariado
                      ? "Exclusivo para Secretariado."
                      : casoActual.equipoRegulatorio && casoActual.equipoRegulatorio.coordinador !== userEmail
                      ? "Exclusivo para el Secretariado Coordinador asignado a este caso."
                      : casoActual.estadoFlujo !== 'EN_REVISION_SECRETARIADO'
                      ? "Requiere que el Equipo Coordinador Institucional haya aprobado la Fase 5.1."
                      : "Realizar auditoría regulatoria y pase a comité."
                  }
                />
                {isSecretariado && esRiesgoAlto && !tieneDocRegulatorio && (isSecretariadoAnalista || isSecretariadoCoordinador) && ['EN_REVISION_SECRETARIADO', 'APROBADO_PARA_COMITE'].includes(casoActual.estadoFlujo) && (
                  <Alert
                    severity="info"
                    sx={{ mt: 2 }}
                    action={
                      <Button size="small" color="inherit" variant="outlined" onClick={() => setTabIndex(1)} sx={{ fontWeight: 'bold' }}>
                        Ir a [REGULATORIO]
                      </Button>
                    }
                  >
                    <strong>Espacio Regulatorio SRS:</strong> Este caso de riesgo Alto/Crítico aún no cuenta con documentos regulatorios adjuntos en la pestaña <strong>[REGULATORIO]</strong> del Gestor de Evidencias.
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* TARJETA 3: SECRETARIADO Y COMITÉ (Fases 5 y 6) */}
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FactCheckIcon sx={{ color: '#2e7d32' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>Fase 6: Cierre y Dictamen Técnico</Typography>
                </Box>
                <Chip label="Responsable: Comité Nacional de Expertos (CNED)" size="small" variant="outlined" color="success" />
              </Box>
              <Box sx={{ p: 2 }}>
                <ActionRow
                  title="Acta Oficial Causalidad (Fase 6)"
                  chipStatus={['DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo) ? 'Completado' : 'Pendiente'}
                  btnText={['DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo) ? "Dictamen Emitido" : "Emitir Dictamen"}
                  color="primary"
                  onClick={() => navigate('/dictamen/' + id)}
                  disabled={!isComitée || ['DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo)}
                  tooltipText={['DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo) ? "El dictamen ya fue emitido para este expediente." : "Solo Comité."}
                />
                <ActionRow
                  title="Sala de Espera (Fase 5)"
                  chipStatus={['EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo) ? 'Completado' : 'Pendiente'}
                  btnText={!tieneReunionCierre && casoActual.estadoFlujo === 'APROBADO_PARA_COMITE' ? "Agendar Reunión" : "Agendar para Comité"}
                  color={!tieneReunionCierre && casoActual.estadoFlujo === 'APROBADO_PARA_COMITE' ? "primary" : "secondary"}
                  onClick={() => {
                    if (!tieneReunionCierre) {
                      abrirModalAgenda('Fase 6', 'Sesión de Deliberación Comité de Expertos');
                    } else {
                      setOpenEnvioComitéeModal(true);
                    }
                  }}
                  disabled={
                    !isSecretariadoCoordinador ||
                    casoActual.estadoFlujo !== 'APROBADO_PARA_COMITE' ||
                    (tieneReunionCierre && !tieneEvidenciasRepositorio)
                  }
                  tooltipText={
                    !isSecretariado
                      ? "Solo Secretariado."
                      : !isSecretariadoCoordinador
                        ? "Exclusivo para el Secretariado Coordinador asignado."
                        : casoActual.estadoFlujo !== 'APROBADO_PARA_COMITE'
                          ? "Disponible una vez aprobada la Auditoría Secretariado (Fase 5.2)."
                          : !tieneReunionCierre
                            ? ""
                            : !tieneEvidenciasRepositorio
                              ? "Bloqueado: Debe adjuntar al menos un documento de respaldo en el Gestor de Evidencias antes de enviar al Comité."
                              : ""
                  }
                />
                <ActionRow
                  title="Informe Técnico de Autoridades"
                  chipStatus={['APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo) ? 'Disponible' : 'Pendiente'}
                  btnText="ver Informe"
                  color="info"
                  onClick={() => navigate('/informe-tecnico/' + id)}
                  disabled={!['APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo)}
                  tooltipText="Disponible una vez que el Secretariado haya aprobado el pase al Comité."
                />
              </Box>

              {['APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO', 'EN_REVISION_SECRETARIADO'].includes(casoActual.estadoFlujo) && (
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#fff' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Notas y Acuerdos de Reunión (Cierre y Secretariado)</Typography>

                  {casoActual.notasCierre && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f9f9f9', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                      <Typography variant="body2">{casoActual.notasCierre}</Typography>
                    </Paper>
                  )}

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Escriba una nueva observación, indicación o acuerdo..."
                    value={nuevaNotaCierre}
                    onChange={(e) => setNuevaNotaCierre(e.target.value)}
                    disabled={!(isEsaviInstitucional || isSecretariado)}
                  />
                  {(isEsaviInstitucional || isSecretariado) && (
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ mt: 1 }}
                      disabled={!nuevaNotaCierre.trim()}
                      onClick={async () => {
                        const concatenado = `${casoActual.notasCierre ? casoActual.notasCierre + '\n\n' : ''}[${dayjs().format('DD/MM/YYYY HH:mm')} - ${userEmail}]:\n${nuevaNotaCierre}`;
                        await guardarNotasCaso(casoActual.id, 'notasCierre', concatenado);
                        setNuevaNotaCierre('');
                      }}
                    >
                      Guardar Nota
                    </Button>
                  )}
                </Box>
              )}

            </CardContent>
          </Card>
        </Box>
      )}

      {/* TAB 1: GESTOR DE EVIDENCIAS */}
      {tabIndex === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2, fontWeight: 'medium' }}>
            Recuerde subir la presentación del caso y la documentación pertinente en el Gestor de Evidencias antes de oficializar el expediente.
          </Alert>
          <GestorEvidencias caseId={id || 'ESAVI-000'} readOnly={isObserver || isSecretariadoApoyo} />
        </Box>
      )}

      {/* TAB 2: HISTORIAL DE CAMBIOS (BITÁCORA) */}
      {tabIndex === 2 && (
        <Box>
          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <Box sx={{ bgcolor: '#f4f6f8', p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>Bitácora de Auditoría del Expediente</Typography>
            </Box>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {(casoActual.historial_cambios || []).map((registro, index) => (
                <Box key={registro.id}>
                  <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <HistoryIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography component="div" variant="body1" color="text.primary" sx={{ fontWeight: 'bold' }}>
                          {registro.accion}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography component="span" variant="body2" color="text.primary" sx={{ fontWeight: 'medium' }}>
                            {registro.usuario}
                          </Typography>
                          {registro.rol ? " â€” " + registro.rol : ""}
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {registro.fecha}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < (casoActual.historial_cambios?.length || 0) - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))}
              {(!casoActual.historial_cambios || casoActual.historial_cambios.length === 0) && (
                <Alert severity="info" sx={{ m: 2 }}>No hay registros en el historial de auditoría para este expediente.</Alert>
              )}
            </List>
          </Paper>
        </Box>
      )}

      {/* TAB 3: AGENDA Y REUNIONES */}
      {tabIndex === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" color="primary">Agenda de Reuniones</Typography>
            {(!isObserver && !isComitée) && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  const faseSugerida =
                    casoActual.estadoFlujo === 'APROBADO_PARA_COMITE' ? 'Fase 6' :
                    casoActual.estadoFlujo === 'ASIGNADO_A_ERR' ? 'Fase 3' :
                    casoActual.estadoFlujo === 'EN_INVESTIGACION' ? 'Fase 4' : 'Fase 2';
                  abrirModalAgenda(faseSugerida);
                }}
              >
                + Agendar Reunión
              </Button>
            )}
          </Box>

          {casoActual.reuniones && casoActual.reuniones.length > 0 ? (
            <Grid container spacing={2}>
              {casoActual.reuniones.map((reunion) => (
                <Grid size={{ xs: 12, md: 6 }} key={reunion.id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{reunion.tema}</Typography>
                        <Chip size="small" color={reunion.estado === 'PROGRAMADA' ? 'primary' : 'success'} label={reunion.estado} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">Fase: {reunion.faseRelacionada}</Typography>
                      <Typography variant="body2" color="text.secondary">Fecha: {reunion.fecha} a las {reunion.hora}</Typography>
                      <Typography variant="body2" color="text.secondary">Modalidad: {reunion.modalidad}</Typography>
                      <Typography variant="body2" color="text.secondary">{reunion.modalidad === 'Virtual' ? 'Enlace' : 'Lugar'}: {reunion.enlaceOLugar}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">No hay reuniones programadas para este expediente.</Alert>
          )}
        </Box>
      )}

      {/* MODAL: VER / EDITAR FASE 1 */}
      {openEdicionFase1 && (
        <EdicionFase1Modal
          open={openEdicionFase1}
          onClose={() => setOpenEdicionFase1(false)}
          casoId={casoActual.id}
          readOnly={isFase1ReadOnly}
        />
      )}

      {/* MODAL: AGENDAR REUNIÃ“N */}
      <Dialog open={openAgendaModal} onClose={() => setOpenAgendaModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', mb: 2 }}>
          Agendar Nueva Reunión
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Tema de la Reunión"
            value={nuevaReunion.tema}
            onChange={(e) => setNuevaReunion({ ...nuevaReunion, tema: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            select
            fullWidth
            label="Fase Relacionada"
            value={nuevaReunion.faseRelacionada}
            onChange={(e) => setNuevaReunion({ ...nuevaReunion, faseRelacionada: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Fase 2">Fase 2: Evaluación</MenuItem>
            <MenuItem value="Fase 3">Fase 3: Asignación ERR</MenuItem>
            <MenuItem value="Fase 4">Fase 4: Investigación (Cierre)</MenuItem>
            <MenuItem value="Fase 6">Fase 6: Comité Externo</MenuItem>
          </TextField>
          <TextField
            select
            fullWidth
            label="Modalidad"
            value={nuevaReunion.modalidad}
            onChange={(e) => setNuevaReunion({ ...nuevaReunion, modalidad: e.target.value as 'Virtual' | 'Presencial' })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Virtual">Virtual</MenuItem>
            <MenuItem value="Presencial">Presencial</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label={nuevaReunion.modalidad === 'Virtual' ? "Enlace de la Reunión (URL)" : "Lugar / Sala"}
            value={nuevaReunion.enlaceOLugar}
            onChange={(e) => setNuevaReunion({ ...nuevaReunion, enlaceOLugar: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha"
                slotProps={{ inputLabel: { shrink: true } }}
                value={nuevaReunion.fecha}
                onChange={(e) => setNuevaReunion({ ...nuevaReunion, fecha: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                type="time"
                label="Hora"
                slotProps={{ inputLabel: { shrink: true } }}
                value={nuevaReunion.hora}
                onChange={(e) => setNuevaReunion({ ...nuevaReunion, hora: e.target.value })}
                required
              />
            </Grid>
          </Grid>


        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setOpenAgendaModal(false)} variant="outlined" color="inherit">Cancelar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGuardarReunion}
            disabled={!nuevaReunion.tema || !nuevaReunion.fecha || !nuevaReunion.hora}
          >
            Guardar Reunión
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODALES READ-ONLY */}
      <Dialog open={openNotif} onClose={() => setOpenNotif(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', mb: 2 }}>Notificación Inicial - ESAVI (Fase 1)</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="primary" sx={{ borderBottom: '1px solid #ccc', mb: 1, fontWeight: 'bold' }}>Datos del Paciente</Typography>
              <ReadOnlyField label="Nombre Completo" value={casoActual.paciente} />
              <ReadOnlyField label="DUI" value="04567892-1" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="primary" sx={{ borderBottom: '1px solid #ccc', mb: 1, fontWeight: 'bold' }}>Datos Evento</Typography>
              <ReadOnlyField label="Vacuna" value={casoActual.vacuna} />
              <ReadOnlyField label="Inicio Síntomas" value="01/07/2026 10:15 AM" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}><Button onClick={() => setOpenNotif(false)} variant="contained" color="primary">Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openApertura} onClose={() => setOpenApertura(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', mb: 2 }}>Datos de Apertura y Triaje (Fase 2)</DialogTitle>
        <DialogContent>
          <ReadOnlyField label="Fecha Oficialización" value={casoActual.fecha.split('T')[0]} />
          <ReadOnlyField label="Institución" value={casoActual.establecimiento} />
          {(() => {
            if (!casoActual.riesgo || casoActual.riesgo === 'Sin clasificar') {
              return <Alert severity="info" sx={{ mt: 2, fontWeight: 'bold' }}>Matriz de Riesgo Pendiente de Evaluar</Alert>;
            }

            let color: "error" | "warning" | "success" | "info" = "info";
            let respuesta = "LOCAL";

            if (casoActual.riesgo.includes('CRÍTICO')) {
              color = "error";
              respuesta = "NACIONAL";
            } else if (casoActual.riesgo.includes('ALTO')) {
              color = "warning";
              respuesta = "REGIONAL";
            } else if (casoActual.riesgo.includes('MODERADO')) {
              color = "warning";
              respuesta = "DEPARTAMENTAL";
            } else if (casoActual.riesgo.includes('BAJO')) {
              color = "success";
              respuesta = "LOCAL";
            }

            return (
              <Alert severity={color} sx={{ mt: 2, fontWeight: 'bold' }}>
                Riesgo Calculado: {casoActual.riesgo} - Respuesta {respuesta}.
              </Alert>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f4f6f8' }}>
          <Button onClick={() => setOpenApertura(false)} variant="contained">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ================= MODAL DE DICTAMEN DE CAUSALIDAD (Solo-Lectura) ================= */}
      <Dialog open={openDictamenModal} onClose={() => setOpenDictamenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon /> Acta de Causalidad Final (Comitéé Externo)
        </DialogTitle>
        <DialogContent>
          {casoActual?.dictamenData ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">Clasificación Final de Causalidad (OMS)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {casoActual.dictamenData.clasificacionFinal}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">Justificación Clínica y Epidemiológica</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', mt: 1 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {casoActual.dictamenData.justificacionCausalidad}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">Recomendaciones y Acciones a tomar</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9', mt: 1 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {casoActual.dictamenData.recomendaciones}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Typography>El dictamen no está disponible para este caso.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f4f6f8' }}>
          <Button onClick={() => setOpenDictamenModal(false)} variant="contained" color="secondary">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: AUDITORÍA (Fase 5) */}
      <Dialog open={openAuditoria} onClose={() => setOpenAuditoria(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', mb: 0 }}>Auditoría de Control de Calidad</DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4, bgcolor: '#f5f5f5' }}>
          <ControlCalidad casoId={casoActual.id} onClose={() => setOpenAuditoria(false)} />
        </DialogContent>
      </Dialog>

      {/* MODAL: AGENDAR COMITÃ‰ (Fase 5 -> 6) */}
      <Dialog open={openEnvioComitéeModal} onClose={() => setOpenEnvioComitéeModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', mb: 0 }}>Agendar Sesión de Comité</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            El expediente <strong>{casoActual.id}</strong> será enviado a la bandeja del Comité Externo de Vacunación Segura para su dictamen final.
          </Typography>

          {!tieneEvidenciasRepositorio && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>Documentación Obligatoria Faltante:</strong> El Gestor de Evidencias tiene 0 archivos cargados. Debe subir al menos un respaldo documental antes de enviar este expediente al Comité.
            </Alert>
          )}

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Reuniones Programadas para el Comité (Fase 6)</Typography>
          {casoActual.reuniones && casoActual.reuniones.filter(r => r.faseRelacionada === 'Fase 6' || r.faseRelacionada === 'Fase 5').length > 0 ? (
            <Grid container spacing={2}>
              {casoActual.reuniones.filter(r => r.faseRelacionada === 'Fase 6' || r.faseRelacionada === 'Fase 5').map(reunion => (
                <Grid size={{ xs: 12 }} key={reunion.id}>
                  <Card variant="outlined" sx={{ bgcolor: '#f9f9f9' }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{reunion.tema}</Typography>
                        <Chip size="small" color="primary" label={reunion.estado} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">Fecha: {reunion.fecha} a las {reunion.hora}</Typography>
                      <Typography variant="body2" color="text.secondary">Modalidad: {reunion.modalidad}</Typography>
                      <Typography variant="body2" color="text.secondary">{reunion.modalidad === 'Virtual' ? 'Enlace' : 'Lugar'}: {reunion.enlaceOLugar}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="warning">No hay reuniones de Fase 6 asociadas a este expediente. Por favor, programa una en la pestaña Agenda.</Alert>
          )}

        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setOpenEnvioComitéeModal(false)} variant="outlined">Cancelar</Button>
          <Button
            onClick={() => {
              avanzarCaso(casoActual.id, 'EN_EVALUACION_COMITE', 'Fase 6: Evaluación de Comité', 'Caso agendado y enviado al Comité Externo.');
              setOpenEnvioComitéeModal(false);
              navigate('/');
            }}
            variant="contained"
            color="secondary"
            disabled={!tieneReunionCierre || !tieneEvidenciasRepositorio}
          >
            Confirmar y Enviar al Comité
          </Button>
        </DialogActions>
      </Dialog>

      <ModalEquipoRegulatorio open={openEquipoRegulatorio} onClose={() => setOpenEquipoRegulatorio(false)} casoActual={casoActual} />
    </Box>
  );
}

