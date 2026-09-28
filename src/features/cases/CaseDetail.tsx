import { useState } from 'react';
import dayjs from 'dayjs';
import { Box, Paper, Typography, Grid, Stepper, Step, StepLabel, Button, Divider, Alert, Card, CardContent, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, List, ListItem, ListItemAvatar, Avatar, ListItemText, TextField, MenuItem, Checkbox, FormControlLabel } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useCasesStore } from '../../store/useCasesStore';
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

const fases = [
  'Fase 1: Notificación',
  'Fase 2: Evaluación',
  'Fase 3: Asignación',
  'Fase 4: Investigación',
  'Fase 5: Control Calidad',
  'Fase 6: Dictamen'
];

// El historial se lee ahora directamente desde el Store

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, userEmail } = useAuthStore();

  // --- CONEXIÓN AL STORE CENTRAL ---
  const { casos, devolverCaso, agendarReunionStore, avanzarCaso, guardarNotasCaso } = useCasesStore();
  const casoActual = casos.find(c => c.id === id);

  // --- ESTADOS PARA MODALES (Read-Only) ---
  const [openNotif, setOpenNotif] = useState(false);
  const [openEdicionFase1, setOpenEdicionFase1] = useState(false);
  const [isFase1ReadOnly, setIsFase1ReadOnly] = useState(false);
  const [openApertura, setOpenApertura] = useState(false);
  const [openDictamenModal, setOpenDictamenModal] = useState(false);

  // --- ESTADOS PARA CHECKLISTS NORMATIVOS ---
  const [chkAnexoI, setChkAnexoI] = useState(false);
  const [chkAnexoII, setChkAnexoII] = useState(false);

  // --- ESTADO PARA PESTAÑAS (TABS) ---
  const [tabIndex, setTabIndex] = useState(0);

  // --- ESTADOS PARA NOTAS NUEVAS ---
  const [nuevaNotaOficializacion, setNuevaNotaOficializacion] = useState('');
  const [nuevaNotaPreFase4, setNuevaNotaPreFase4] = useState('');
  const [nuevaNotaFase4, setNuevaNotaFase4] = useState('');
  const [nuevaNotaCierre, setNuevaNotaCierre] = useState('');

  const [openAgendaModal, setOpenAgendaModal] = useState(false);
  const [openEnvioComiteModal, setOpenEnvioComiteModal] = useState(false);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNuevaReunion(prev => ({
          ...prev,
          archivoBase64: result.includes('base64,') ? result.split('base64,')[1] : result,
          nombreArchivo: file.name,
          mimeType: file.type
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuardarReunion = () => {
    if (!nuevaReunion.tema || !nuevaReunion.fecha || !nuevaReunion.hora) return;
    agendarReunionStore(casoActual!.id, {
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
  // LÓGICA DINÁMICA DEL STEPPER BASADO EN EL STORE
  // =====================================================================
  const getActiveStepIndex = (estado: string): number => {
    if (estado === 'NUEVO' || estado === 'NOTIFICADO') return 0;
    if (estado === 'EN_EVALUACION') return 1;
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

  // --- LÓGICA DE COMPLETITUD ---
  const f2Completado = !['NUEVO', 'NOTIFICADO', 'EN_EVALUACION'].includes(casoActual.estadoFlujo);
  const f3Completado = !['NUEVO', 'NOTIFICADO', 'EN_EVALUACION', 'ASIGNADO_A_ERR'].includes(casoActual.estadoFlujo);

  // Flexibilidad: Comprobar si el correo del usuario actual está en la lista de asignados
  const isUserAssignedToERR = casoActual.miembrosERR.includes(userEmail || '');

  // --- REGLAS RBAC INTEGRADAS ---
  const isJefe = ['ESAVI_INSTITUCIONAL', 'EPIDEMIO_INSTITUCIONAL', 'INMUNO_INSTITUCIONAL'].includes(currentRole as string);
  const isLocalOperativo = ['ESAVI_LOCAL', 'INMUNO_LOCAL', 'EPIDEMIO_LOCAL'].includes(currentRole as string);
  const isEsaviLocal = currentRole === 'ESAVI_LOCAL';
  const isInmunoLocal = currentRole === 'INMUNO_LOCAL';
  const isEpidemioLocal = currentRole === 'EPIDEMIO_LOCAL';
  const isEsaviInstitucional = currentRole === 'ESAVI_INSTITUCIONAL';
  const isSecretariado = currentRole === 'SECRETARIADO';
  const isComite = currentRole === 'COMITE_EXTERNO';
  const tieneReunionFase2 = casoActual.reuniones?.some(r => r.faseRelacionada === 'Fase 2');
  const tieneReunionFase3 = casoActual.reuniones?.some(r => r.faseRelacionada === 'Fase 3' || r.tema?.toLowerCase().includes('pre-fase 4'));
  const tieneReunionFase4 = casoActual.reuniones?.some(r => r.faseRelacionada === 'Fase 4' || r.tema?.toLowerCase().includes('campo'));
  const tieneReunionCierre = casoActual.reuniones?.some(r => r.faseRelacionada === 'Fase 6' || r.faseRelacionada === 'Fase 5');

  // --- COMPONENTE INTERNO: FILA DE ACCIÓN INTELIGENTE ---
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

  // --- COMPONENTE INTERNO: FILA DE DATOS SOLO LECTURA ---
  function ReadOnlyField({ label, value }: { label: string, value: string }) {
    return (
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{value}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', pb: 8 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Volver a la Bandeja
      </Button>

      {/* ================= BANNERS INTELIGENTES DE ESTADO DE FLUJO ================= */}
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

      {/* ================= CABECERA DEL EXPEDIENTE ================= */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>Expediente {casoActual.id}</Typography>
            <Typography variant="subtitle1" color="text.secondary">Paciente: {casoActual.paciente} | Vacuna: {casoActual.vacuna}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Establecimiento: {casoActual.establecimiento}</Typography>
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
              <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => setOpenNotif(true)} sx={{ width: '220px' }}>
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

      {/* ================= 1. STEPPER DINÁMICO ================= */}
      <Stepper activeStep={faseActual} alternativeLabel sx={{ mb: 5 }}>
        {fases.map((label) => (
          <Step key={label}>
            <StepLabel error={(casoActual.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL' || casoActual.estadoFlujo === 'DEVUELTO_A_ERR') && label === 'Fase 5: Control Calidad'}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ================= BANNER DE OBSERVACIONES ================= */}
      {(casoActual.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL' || casoActual.estadoFlujo === 'DEVUELTO_A_ERR') && casoActual.observacionActual && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Observaciones de Auditoría:</strong> {casoActual.observacionActual}
        </Alert>
      )}

      {/* ================= TABS PRINCIPALES ================= */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} aria-label="expediente tabs" variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab label="Gestor de Evidencias" />
          <Tab label="Gestión del Expediente" />
          <Tab label="Historial de Cambios" iconPosition="start" icon={<HistoryIcon fontSize="small" />} />
          <Tab label="Agenda y Reuniones" />
        </Tabs>
      </Box>

      {/* TAB 1: GESTIÓN DEL EXPEDIENTE */}
      {tabIndex === 1 && (
        <Box>
          {/* TARJETA 0: INFORMACIÓN GENERAL (Fase 1) */}
          <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e0e0e0' }}>
                <SearchIcon color="primary" />
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>Información General del Caso (Fase 1) - llenado por esavi institucional</Typography>
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
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e0e0e0' }}>
                <AssignmentIcon color="primary" />
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>Evaluación y Asignación (Fases 2 y 3): esavi institucional, epidemio institucional e inmuno institucional (equipo coordinador)</Typography>
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
                    setOpenAgendaModal(true);
                  }}
                  disabled={!isJefe || (casoActual.estadoFlujo !== 'NUEVO' && tieneReunionFase2)}
                  tooltipText={!isJefe ? "Requiere rol de Jefatura." : ((casoActual.estadoFlujo !== 'NUEVO' && tieneReunionFase2) ? "El caso ya está oficializado y agendado." : "Oficializar expediente y agendar reunión.")}
                  color="success"
                />

                {casoActual.estadoFlujo !== 'NUEVO' && (
                  <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Notas y Acuerdos de Reunión (Equipo Coordinador)</Typography>

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
                      disabled={!isEsaviInstitucional || !tieneReunionFase2 || !f2Completado}
                    />
                    {!tieneReunionFase2 && <Typography variant="caption" color="error">Debe programar la reunión de Fase 2 en la pestaña "Agenda" antes de redactar los acuerdos.</Typography>}
                    {tieneReunionFase2 && !f2Completado && <Typography variant="caption" color="error">Debe llenar la Matriz de Riesgo antes de redactar los acuerdos.</Typography>}
                    {isEsaviInstitucional && tieneReunionFase2 && (
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
                  disabled={!isJefe || (!['ASIGNADO_A_ERR', 'EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo))}
                  tooltipText={isJefe ? "Puede reasignar el equipo en cualquier momento durante la investigación." : "Acceso exclusivo para Jefaturas."}
                />
              </Box>
            </CardContent>
          </Card>

          {/* PANEL DE DEPURACIÓN FASE 4 */}
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
                  <Typography variant="subtitle1" color="secondary.main" sx={{ fontWeight: 'bold' }}>Investigación de Campo (Fase 4)</Typography>
                </Box>
                {/* ETIQUETA DINÁMICA DE ASIGNACIÓN AL ERR */}
                {isLocalOperativo && isUserAssignedToERR && <Chip label="Asignado como Investigador ERR" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />}
              </Box>

              <Box sx={{ p: 2 }}>

                {(casoActual.notasPreFase4 || ['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo)) && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Notas y Acuerdos de Reunión (Pre-Fase 4)</Typography>

                    {casoActual.notasPreFase4 && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fff', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                        <Typography variant="body2">{casoActual.notasPreFase4}</Typography>
                      </Paper>
                    )}

                    {['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) && (
                      <>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Escriba una nueva observación, indicación o acuerdo..."
                          value={nuevaNotaPreFase4}
                          onChange={(e) => setNuevaNotaPreFase4(e.target.value)}
                          disabled={!isEsaviInstitucional || !tieneReunionFase3 || !f2Completado}
                        />
                        {!tieneReunionFase3 && <Typography variant="caption" color="error">Debe programar la reunión Pre-Fase 4 (Fase 3) en la pestaña "Agenda" antes de redactar los acuerdos.</Typography>}
                        {tieneReunionFase3 && !f2Completado && <Typography variant="caption" color="error">Debe llenar la Matriz de Riesgo antes de redactar los acuerdos.</Typography>}
                        {isEsaviInstitucional && tieneReunionFase3 && (
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
                  const isViewer = isEsaviInstitucional || isSecretariado || isComite || isUserAssignedToERR;

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
                        disabled={a3Status === 'Completado' ? !isViewer : (!casoActual.notasPreFase4 || !(isEsaviLocal || (isUserAssignedToERR && currentRole?.includes('ESAVI'))) || !['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo))}
                        tooltipText={a3Status === 'Completado' ? "Ver Anexo" : (!casoActual.notasPreFase4 ? "Debe completarse la reunión Pre-Fase 4 (Notas) primero." : (!(isEsaviLocal || (isUserAssignedToERR && currentRole?.includes('ESAVI'))) ? "Acceso exclusivo para Coordinador Local." : "Habilitado para completar."))}
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
                        disabled={a7Status === 'Completado' ? !isViewer : (!casoActual.notasPreFase4 || !(isEsaviLocal || (isUserAssignedToERR && currentRole?.includes('ESAVI'))) || !['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) || (a7Status !== 'Corrección' && !casoActual.anexoIII_completado))}
                        tooltipText={a7Status === 'Completado' ? "Ver Anexo" : (!casoActual.notasPreFase4 ? "Debe completarse la reunión Pre-Fase 4 primero." : ((a7Status !== 'Corrección' && !casoActual.anexoIII_completado) ? "Debe completar Logística (Anexo III) primero." : (!(isEsaviLocal || (isUserAssignedToERR && currentRole?.includes('ESAVI'))) ? "Acceso exclusivo para Referente Clínico." : "Habilitado para completar.")))}
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
                        disabled={a5Status === 'Completado' ? !isViewer : (!casoActual.notasPreFase4 || !(isInmunoLocal || (isUserAssignedToERR && currentRole?.includes('INMUNO'))) || !['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) || (a5Status !== 'Corrección' && !casoActual.anexoIII_completado))}
                        tooltipText={a5Status === 'Completado' ? "Ver Anexo" : (!casoActual.notasPreFase4 ? "Debe completarse la reunión Pre-Fase 4 primero." : ((a5Status !== 'Corrección' && !casoActual.anexoIII_completado) ? "Debe completar Logística (Anexo III) primero." : (!(isInmunoLocal || (isUserAssignedToERR && currentRole?.includes('INMUNO'))) ? "Acceso exclusivo para Inmunizaciones." : "Habilitado para completar.")))}
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
                        disabled={a6Status === 'Completado' ? !isViewer : (!casoActual.notasPreFase4 || !(isEpidemioLocal || (isUserAssignedToERR && currentRole?.includes('EPIDEMIO'))) || !['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) || (a6Status !== 'Corrección' && !casoActual.anexoIII_completado))}
                        tooltipText={a6Status === 'Completado' ? "Ver Anexo" : (!casoActual.notasPreFase4 ? "Debe completarse la reunión Pre-Fase 4 primero." : ((a6Status !== 'Corrección' && !casoActual.anexoIII_completado) ? "Debe completar Logística (Anexo III) primero." : (!(isEpidemioLocal || (isUserAssignedToERR && currentRole?.includes('EPIDEMIO'))) ? "Acceso exclusivo para Epidemiólogo." : "Habilitado para completar.")))}
                        color={a6Status === 'Completado' ? 'primary' : a6Status === 'Corrección' ? 'error' : 'secondary'}
                      />
                    </>
                  );
                })()}

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
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Escriba observaciones tras la investigación del ERR..."
                          value={nuevaNotaFase4}
                          onChange={(e) => setNuevaNotaFase4(e.target.value)}
                          disabled={!isEsaviInstitucional || !tieneReunionFase4}
                        />
                        {!tieneReunionFase4 && <Typography variant="caption" color="error">Debe programar la reunión de Cierre de Campo (Fase 4) en la pestaña "Agenda" para ingresar las notas.</Typography>}
                        {isEsaviInstitucional && tieneReunionFase4 && (
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
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e0e0e0' }}>
                <FactCheckIcon sx={{ color: '#ed6c02' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>Control de Calidad (Fase 5)</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <ActionRow
                  title="Auditoría Institucional (Fase 5.1) evalúa equipo coordinador"
                  chipStatus={['EN_REVISION_SECRETARIADO', 'APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO'].includes(casoActual.estadoFlujo) ? 'Completado' : 'Pendiente'}
                  btnText="Auditoría Institucional"
                  color="warning"
                  onClick={() => setOpenAuditoria(true)}
                  disabled={!((isJefe || currentRole === 'INMUNO_INSTITUCIONAL' || currentRole === 'EPIDEMIO_INSTITUCIONAL') && casoActual.anexoIII_completado && casoActual.anexoV_completado && casoActual.anexoVI_completado && casoActual.anexoVII_completado && ['EN_INVESTIGACION', 'DEVUELTO_A_INSTITUCIONAL', 'EN_REVISION_INSTITUCIONAL'].includes(casoActual.estadoFlujo))}
                  tooltipText={!(isJefe || currentRole === 'INMUNO_INSTITUCIONAL' || currentRole === 'EPIDEMIO_INSTITUCIONAL') ? "Exclusivo para Equipo Coordinador (Nivel Institucional)." : "Requiere todos los anexos completados."}
                />
                <ActionRow
                  title="Auditoría Secretariado (Fase 5.2)"
                  chipStatus={['APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO'].includes(casoActual.estadoFlujo) ? 'Completado' : 'Pendiente'}
                  btnText="Auditoría Secretariado"
                  color="warning"
                  onClick={() => setOpenAuditoria(true)}
                  disabled={!(isSecretariado && casoActual.estadoFlujo === 'EN_REVISION_SECRETARIADO')}
                  tooltipText={!isSecretariado ? "Exclusivo para Secretariado." : "Requiere que ESAVI Institucional haya aprobado."}
                />
              </Box>
            </CardContent>
          </Card>

          {/* TARJETA 3: SECRETARIADO Y COMITÉ (Fases 5 y 6) */}
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e0e0e0' }}>
                <FactCheckIcon sx={{ color: '#2e7d32' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>Cierre y Dictamen Técnico (Fases 5 y 6)</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <ActionRow
                  title="Acta Oficial Causalidad (Fase 6)"
                  chipStatus={['DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo) ? 'Completado' : 'Pendiente'}
                  btnText={['DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo) ? "Dictamen Emitido" : "Emitir Dictamen"}
                  color="primary"
                  onClick={() => navigate('/dictamen/' + id)}
                  disabled={!isComite || ['DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo)}
                  tooltipText={['DICTAMINADO', 'CERRADO_DICTAMINADO', 'CERRADO'].includes(casoActual.estadoFlujo) ? "El dictamen ya fue emitido para este expediente." : "Solo Comité."}
                />
                <ActionRow
                  title="Sala de Espera (Fase 5)"
                  chipStatus={['APROBADO_PARA_COMITE', 'EN_EVALUACION_COMITE', 'DICTAMINADO', 'CERRADO_DICTAMINADO'].includes(casoActual.estadoFlujo) ? 'Completado' : 'Pendiente'}
                  btnText="Agendar para Comité"
                  color="secondary"
                  onClick={() => setOpenEnvioComiteModal(true)}
                  disabled={!isSecretariado || casoActual.estadoFlujo !== 'APROBADO_PARA_COMITE' || !tieneReunionCierre}
                  tooltipText={
                    !isSecretariado
                      ? "Solo Secretariado."
                      : !tieneReunionCierre
                        ? "Bloqueado: ESAVI Institucional debe programar la Reunión de Cierre en la pestaña de Agenda primero."
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

      {/* TAB 0: GESTOR DE EVIDENCIAS */}
      {tabIndex === 0 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2, fontWeight: 'medium' }}>
            Recuerde subir la presentación del caso y la documentación pertinente en el Gestor de Evidencias antes de oficializar el expediente.
          </Alert>
          <GestorEvidencias caseId={id || 'ESAVI-000'} />
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
                          {registro.rol ? " — " + registro.rol : ""}
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
            {(isJefe || isSecretariado) && (
              <Button variant="contained" color="primary" onClick={() => setOpenAgendaModal(true)}>
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

      {/* MODAL: AGENDAR REUNIÓN */}
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

          {/* Subida de Archivo Base64 para Google Drive / Presentación */}
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="outlined" component="label">
              Adjuntar Presentación (Opcional)
              <input type="file" hidden accept=".pdf,.ppt,.pptx" onChange={handleFileUpload} />
            </Button>
            {nuevaReunion.nombreArchivo && (
              <Typography variant="body2" color="text.secondary">
                {nuevaReunion.nombreArchivo}
              </Typography>
            )}
          </Box>
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
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" sx={{ borderBottom: '1px solid #ccc', mb: 1, fontWeight: 'bold' }}>Datos del Paciente</Typography>
              <ReadOnlyField label="Nombre Completo" value={casoActual.paciente} />
              <ReadOnlyField label="DUI" value="04567892-1" />
            </Grid>
            <Grid item xs={12} md={6}>
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
          <GavelIcon /> Acta de Causalidad Final (Comité Externo)
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

      {/* MODAL: AGENDAR COMITÉ (Fase 5 -> 6) */}
      <Dialog open={openEnvioComiteModal} onClose={() => setOpenEnvioComiteModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', mb: 0 }}>Agendar Sesión de Comité</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            El expediente <strong>{casoActual.id}</strong> será enviado a la bandeja del Comité Externo de Vacunación Segura para su dictamen final.
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Reuniones Programadas para el Comité (Fase 6)</Typography>
          {casoActual.reuniones && casoActual.reuniones.filter(r => r.faseRelacionada === 'Fase 6').length > 0 ? (
            <Grid container spacing={2}>
              {casoActual.reuniones.filter(r => r.faseRelacionada === 'Fase 6').map(reunion => (
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
          <Button onClick={() => setOpenEnvioComiteModal(false)} variant="outlined">Cancelar</Button>
          <Button
            onClick={() => {
              avanzarCaso(casoActual.id, 'EN_EVALUACION_COMITE', 'Fase 6: Evaluación de Comité', 'Caso agendado y enviado al Comité Externo.');
              setOpenEnvioComiteModal(false);
              navigate('/');
            }}
            variant="contained"
            color="secondary"
          >
            Confirmar y Enviar al Comité
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}