import { useState } from 'react';
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
import GestorEvidencias from '../cases/GestorEvidencias';
import ControlCalidad from '../forms/Fase5_ControlCalidad/ControlCalidad';

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
  const { casos, devolverCaso, agendarReunionStore, avanzarCaso } = useCasesStore();
  const casoActual = casos.find(c => c.id === id);

  // --- ESTADOS PARA MODALES (Read-Only) ---
  const [openNotif, setOpenNotif] = useState(false);
  const [openApertura, setOpenApertura] = useState(false);

  // --- ESTADOS PARA CHECKLISTS NORMATIVOS ---
  const [chkAnexoI, setChkAnexoI] = useState(false);
  const [chkAnexoII, setChkAnexoII] = useState(false);

  // --- ESTADO PARA PESTAÑAS (TABS) ---
  const [tabIndex, setTabIndex] = useState(0);

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

    // Navegar directamente a la matriz de riesgo pasando la fecha y opcionalmente el archivo
    if (casoActual?.estadoFlujo === 'NUEVO' || casoActual?.estadoFlujo === 'EN_EVALUACION') {
      navigate(`/matriz-riesgo/${casoActual!.id}`, { state: { fechaReunion: nuevaReunion.fecha } });
    }
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
  const tieneReunionCierre = casoActual.reuniones?.some(r => r.faseRelacionada === 'Fase 6');

  // --- COMPONENTE INTERNO: FILA DE ACCIÓN INTELIGENTE ---
  function ActionRow({ title, chipStatus, btnText, onClick, disabled, tooltipText, color = "secondary", variant = "contained" }: any) {
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
        <Tooltip title={disabled ? tooltipText : ''} placement="left" arrow disableHoverListener={!disabled}>
          <span>
            <Button variant={variant} color={color} size="small" onClick={onClick} disabled={disabled} sx={{ pointerEvents: disabled ? 'none' : 'auto' }}>
              {btnText}
            </Button>
          </span>
        </Tooltip>
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
          <br/><strong>Observación:</strong> "{casoActual.observacionRechazo}" (Sección: {casoActual.anexoRechazado}).
        </Alert>
      )}

      {casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && isLocalOperativo && (
        <Alert severity="error" variant="filled" sx={{ mb: 3 }}>
          <strong>ACCIÓN REQUERIDA:</strong> El ESAVI Institucional ha devuelto este expediente para corrección. 
          <br/><strong>Observación:</strong> "{casoActual.observacionRechazo}" (Sección: {casoActual.anexoRechazado}).
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
              {(casoActual.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL' || casoActual.estadoFlujo === 'DEVUELTO_A_ERR') ? "Devuelto por Observaciones" : casoActual.fase}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end', mt: 2 }}>
              <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => setOpenNotif(true)} sx={{ width: '220px' }}>
                Ver Notificación Inicial
              </Button>
              <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => setOpenApertura(true)} sx={{ width: '220px' }}>
                Ver Datos de Apertura
              </Button>
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
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} aria-label="expediente tabs">
          <Tab label="Gestión del Expediente" />
          <Tab label="Gestor de Evidencias" />
          <Tab label="Historial de Cambios" iconPosition="start" icon={<HistoryIcon fontSize="small" />} />
          <Tab label="Agenda y Reuniones" />
        </Tabs>
      </Box>

      {/* TAB 0: GESTIÓN DEL EXPEDIENTE */}
      {tabIndex === 0 && (
        <Box>
          {/* TARJETA 1: JEFATURAS (Fase 2 y 3) */}
          <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e0e0e0' }}>
                <AssignmentIcon color="primary" />
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>Evaluación y Asignación (Fases 2 y 3)</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {['NUEVO', 'NOTIFICADO', 'EN_EVALUACION'].includes(casoActual.estadoFlujo) && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'warning.dark' }}>Requisitos de Apertura (Pasos 1 y 2 del POE):</Typography>
                    <FormControlLabel control={<Checkbox size="small" checked={chkAnexoI} onChange={(e) => setChkAnexoI(e.target.checked)} />} label={<Typography variant="body2">Carpeta digital organizada (Anexo I)</Typography>} />
                    <FormControlLabel control={<Checkbox size="small" checked={chkAnexoII} onChange={(e) => setChkAnexoII(e.target.checked)} />} label={<Typography variant="body2">Plantilla de presentación completada (Anexo II)</Typography>} />
                  </Box>
                )}
                <ActionRow 
                  title="Oficialización del Expediente" 
                  chipStatus={casoActual.estadoFlujo === 'NUEVO' ? 'Pendiente' : 'Completado'} 
                  btnText="Oficializar y Agendar Reunión" 
                  onClick={() => {
                    // Update the state to EN_EVALUACION first!
                    useCasesStore.getState().avanzarCaso(casoActual.id, 'EN_EVALUACION', 'Fase 2: Evaluación', 'El caso ha entrado en fase de evaluación y triaje.', 'Sin clasificar');
                    setOpenAgendaModal(true);
                  }} 
                  disabled={!isJefe || casoActual.estadoFlujo !== 'NUEVO' || !chkAnexoI || !chkAnexoII} 
                  tooltipText={!isJefe ? "Requiere rol de Jefatura." : (casoActual.estadoFlujo !== 'NUEVO' ? "El caso ya está oficializado." : "Debe completar Requisitos de Apertura primero.")} 
                  color="success"
                />
                <ActionRow title="Matriz de Riesgo (Fase 2)" chipStatus={f2Completado ? 'Completado' : 'Pendiente'} btnText="Evaluar Riesgo" onClick={() => navigate(`/matriz-riesgo/${id}`)} disabled={!isJefe || casoActual.estadoFlujo !== 'EN_EVALUACION'} tooltipText="Debe oficializar el expediente (Agendar Reunión) antes de evaluar riesgo." />
                <ActionRow title="Asignación Equipo ERR (Fase 3)" chipStatus={f3Completado ? 'Completado' : 'Pendiente'} btnText="Asignar Equipo" onClick={() => navigate('/asignar-equipo/' + id)} disabled={!isJefe || casoActual.estadoFlujo !== 'ASIGNADO_A_ERR'} tooltipText="Acceso exclusivo para Jefaturas y en Fase 3." />
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
                {(() => {
                  const isViewer = isEsaviInstitucional || isSecretariado || isComite || isUserAssignedToERR;
                  
                  const a3Status = (casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && casoActual.anexoRechazado?.includes('Anexo III (')) ? 'Corrección' : casoActual.anexoIII_completado ? 'Completado' : 'Pendiente';
                  const a5Status = (casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && casoActual.anexoRechazado?.includes('Anexo V (')) ? 'Corrección' : casoActual.anexoV_completado ? 'Completado' : 'Pendiente';
                  const a6Status = (casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && casoActual.anexoRechazado?.includes('Anexo VI (')) ? 'Corrección' : casoActual.anexoVI_completado ? 'Completado' : 'Pendiente';
                  const a7Status = (casoActual.estadoFlujo === 'DEVUELTO_A_ERR' && casoActual.anexoRechazado?.includes('Anexo VII (')) ? 'Corrección' : casoActual.anexoVII_completado ? 'Completado' : 'Pendiente';

                  return (
                    <>
                      <ActionRow 
                        title="Evaluación Logística (Anexo III)" 
                        chipStatus={a3Status} 
                        btnText={a3Status === 'Completado' ? "VER ANEXO" : a3Status === 'Corrección' ? "Modificar Anexo" : "Completar Logística"} 
                        variant={a3Status === 'Completado' ? "outlined" : "contained"}
                        onClick={() => {
                          if (a3Status === 'Completado') navigate(`/anexo-logistica/${id}?mode=view`);
                          else navigate('/anexo-logistica/' + id);
                        }} 
                        disabled={a3Status === 'Completado' ? !isViewer : (!(isEsaviLocal || (isUserAssignedToERR && currentRole?.includes('ESAVI'))) || !['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo))}
                        tooltipText={a3Status === 'Completado' ? "Ver Anexo" : (!(isEsaviLocal || (isUserAssignedToERR && currentRole?.includes('ESAVI'))) ? "Acceso exclusivo para Coordinador Local." : "Solo Fase 4.")} 
                        color={a3Status === 'Completado' ? 'primary' : a3Status === 'Corrección' ? 'error' : 'secondary'}
                      />
                      <ActionRow 
                        title="Evaluación Clínica (Anexo VII)" 
                        chipStatus={a7Status} 
                        btnText={a7Status === 'Completado' ? "VER ANEXO" : a7Status === 'Corrección' ? "Modificar Anexo" : "Llenar Clínico"} 
                        variant={a7Status === 'Completado' ? "outlined" : "contained"}
                        onClick={() => {
                          if (a7Status === 'Completado') navigate(`/anexo-clinico/${id}?mode=view`);
                          else navigate(`/anexo-clinico/${id}`);
                        }} 
                        disabled={a7Status === 'Completado' ? !isViewer : (!(isEsaviLocal || (isUserAssignedToERR && currentRole?.includes('ESAVI'))) || !['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) || !casoActual.anexoIII_completado)} 
                        tooltipText={a7Status === 'Completado' ? "Ver Anexo" : (!casoActual.anexoIII_completado ? "Debe completar Logística (Anexo III) primero." : (!(isEsaviLocal || (isUserAssignedToERR && currentRole?.includes('ESAVI'))) ? "Acceso exclusivo para Referente Clínico (Farmacovigilancia)." : ""))} 
                        color={a7Status === 'Completado' ? 'primary' : a7Status === 'Corrección' ? 'error' : 'secondary'}
                      />
                      <ActionRow 
                        title="Puesto Vacunación (Anexo V)" 
                        chipStatus={a5Status} 
                        btnText={a5Status === 'Completado' ? "VER ANEXO" : a5Status === 'Corrección' ? "Modificar Anexo" : "Llenar Anexo V"} 
                        variant={a5Status === 'Completado' ? "outlined" : "contained"}
                        onClick={() => {
                          if (a5Status === 'Completado') navigate(`/anexo-puesto/${id}?mode=view`);
                          else navigate(`/anexo-puesto/${id}`);
                        }} 
                        disabled={a5Status === 'Completado' ? !isViewer : (!(isInmunoLocal || (isUserAssignedToERR && currentRole?.includes('INMUNO'))) || !['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) || !casoActual.anexoIII_completado)} 
                        tooltipText={a5Status === 'Completado' ? "Ver Anexo" : (!casoActual.anexoIII_completado ? "Debe completar Logística (Anexo III) primero." : (!(isInmunoLocal || (isUserAssignedToERR && currentRole?.includes('INMUNO'))) ? "Acceso exclusivo para Inmunizaciones." : ""))} 
                        color={a5Status === 'Completado' ? 'primary' : a5Status === 'Corrección' ? 'error' : 'secondary'}
                      />
                      <ActionRow 
                        title="Inv. Domiciliaria (Anexo VI)" 
                        chipStatus={a6Status} 
                        btnText={a6Status === 'Completado' ? "VER ANEXO" : a6Status === 'Corrección' ? "Modificar Anexo" : "Llenar Anexo VI"} 
                        variant={a6Status === 'Completado' ? "outlined" : "contained"}
                        onClick={() => {
                          if (a6Status === 'Completado') navigate(`/anexo-domicilio/${id}?mode=view`);
                          else navigate(`/anexo-domicilio/${id}`);
                        }} 
                        disabled={a6Status === 'Completado' ? !isViewer : (!(isEpidemioLocal || (isUserAssignedToERR && currentRole?.includes('EPIDEMIO'))) || !['EN_INVESTIGACION', 'DEVUELTO_A_ERR', 'DEVUELTO_A_INSTITUCIONAL'].includes(casoActual.estadoFlujo) || !casoActual.anexoIII_completado)}  
                        tooltipText={a6Status === 'Completado' ? "Ver Anexo" : (!casoActual.anexoIII_completado ? "Debe completar Logística (Anexo III) primero." : (!(isEpidemioLocal || (isUserAssignedToERR && currentRole?.includes('EPIDEMIO'))) ? "Acceso exclusivo para Epidemiólogo." : ""))}
                        color={a6Status === 'Completado' ? 'primary' : a6Status === 'Corrección' ? 'error' : 'secondary'}
                      />
                    </>
                  );
                })()}
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
                  title="Auditoría de Anexos" 
                  chipStatus={faseActual >= 4 ? 'Completado' : 'Pendiente'} 
                  btnText="Realizar Auditoría de Anexos" 
                  color="warning" 
                  onClick={() => setOpenAuditoria(true)} 
                  disabled={!(
                    (isEsaviInstitucional && casoActual.anexoIII_completado && casoActual.anexoV_completado && casoActual.anexoVI_completado && casoActual.anexoVII_completado && (casoActual.estadoFlujo === 'EN_REVISION_INSTITUCIONAL' || casoActual.estadoFlujo === 'EN_INVESTIGACION' || casoActual.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL' || casoActual.estadoFlujo === 'EN_REVISION_SECRETARIADO')) || 
                    (isSecretariado && casoActual.estadoFlujo === 'EN_REVISION_SECRETARIADO')
                  )} 
                  tooltipText="Requiere que todos los anexos estén completados para habilitarse." 
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
                  chipStatus={['DICTAMINADO', 'CERRADO_DICTAMINADO'].includes(casoActual.estadoFlujo) ? 'Completado' : 'Pendiente'} 
                  btnText="Emitir Dictamen" 
                  color="primary" 
                  onClick={() => navigate('/dictamen/' + id)} 
                  disabled={!isComite} 
                  tooltipText="Solo Comité." 
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
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* TAB 1: GESTOR DE EVIDENCIAS */}
      {tabIndex === 1 && (
        <Box>
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
                      secondaryTypographyProps={{ component: 'div' }}
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
          <ReadOnlyField label="Fecha Oficialización" value="02/07/2026" />
          <ReadOnlyField label="Institución" value={casoActual.establecimiento} />
          <Alert severity="warning" sx={{ mt: 2, fontWeight: 'bold' }}>Riesgo Calculado: ALTO (7 puntos) - Respuesta REGIONAL.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}><Button onClick={() => setOpenApertura(false)} variant="contained" color="secondary">Cerrar</Button></DialogActions>
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