import { useState } from 'react';
import { Box, Paper, Typography, Stepper, Step, StepLabel, Button, Divider, Grid, Alert, Card, CardContent, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, List, ListItem, ListItemAvatar, Avatar, ListItemText, TextField } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GavelIcon from '@mui/icons-material/Gavel';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import GestorEvidencias from '../cases/GestorEvidencias';

const fases = [
  'Fase 1: Notificación',
  'Fase 2: Evaluación',
  'Fase 3: Asignación',
  'Fase 4: Investigación',
  'Fase 5: Control Calidad',
  'Fase 6: Dictamen'
];

// --- MOCK DE HISTORIAL DE CAMBIOS ---
const mockHistorial = [
  { id: 1, fecha: "15/07/2026 09:15 AM", usuario: "Dra. Carmen Pineda", rol: "Epidemiólogo Local", accion: "Completó y guardó el Anexo VI - Investigación Domiciliaria." },
  { id: 2, fecha: "14/07/2026 14:30 PM", usuario: "Lic. Tomás Díaz", rol: "Inmunizaciones Local", accion: "Completó y guardó el Anexo V - Guía del Puesto de Vacunación." },
  { id: 3, fecha: "14/07/2026 10:00 AM", usuario: "Dr. Roberto Méndez", rol: "Referente ESAVI Local", accion: "Completó y guardó el Anexo VII - Evaluación Clínica." },
  { id: 4, fecha: "13/07/2026 16:45 PM", usuario: "Lic. Tomás Díaz", rol: "Inmunizaciones Local", accion: "Completó y guardó el Anexo III - Checklist de Logística de Campo." },
  { id: 5, fecha: "12/07/2026 11:20 AM", usuario: "Dr. Alfredo Solis", rol: "Referente ESAVI Institucional", accion: "Realizó la asignación del Equipo de Respuesta Rápida (Fase 3)." },
];

export default function CaseDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { currentRole, logisticaCompletada } = useAuthStore(); 

  // --- ESTADOS PARA MODALES (Read-Only) ---
  const [openNotif, setOpenNotif] = useState(false);
  const [openApertura, setOpenApertura] = useState(false);

  // --- NUEVOS ESTADOS PARA MODAL DE RECHAZO ---
  const [openRechazoModal, setOpenRechazoModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // --- ESTADO PARA PESTAÑAS (TABS) ---
  const [tabIndex, setTabIndex] = useState(0);

  // --- MOCK DE ESTADOS PARA LA UI Y ASIGNACIÓN ---
  const isAperturado = true;
  const isClinicoLlenado = true; // Simulamos que el médico ya llenó su parte
  const isFase4Completa = isClinicoLlenado && logisticaCompletada; 
  
  // SIMULACIÓN DE ASIGNACIÓN: ¿Está el usuario local logueado asignado al ERR de este caso?
  const isUserAssignedToERR = true; // Cambia a false para probar el bloqueo

  // =====================================================================
  // MISIÓN 1: LÓGICA DINÁMICA DEL STEPPER
  // =====================================================================
  const casoDB = {
    estadoGeneral: "EN_INVESTIGACION" // Mock: "NOTIFICADO", "APERTURADO", "EN_INVESTIGACION", "EN_COMITE", "DICTAMINADO", "CERRADO"
  };

  const getActiveStepIndex = (estado: string): number => {
    const mapeoFases: Record<string, number> = {
      "NOTIFICADO": 0,
      "APERTURADO": 1,
      "EN_INVESTIGACION": 2,
      "EN_COMITE": 3,
      "DICTAMINADO": 4,
      "CERRADO": 4
    };
    return mapeoFases[estado] ?? 0;
  };

  const faseActual = getActiveStepIndex(casoDB.estadoGeneral);
  // =====================================================================

  // --- EVALUACIÓN DE ROLES ---
  const isJefe = ['ESAVI_INSTITUCIONAL', 'EPIDEMIO_INSTITUCIONAL', 'INMUNO_INSTITUCIONAL'].includes(currentRole as string);
  const isLocalOperativo = ['ESAVI_LOCAL', 'INMUNO_LOCAL', 'EPIDEMIO_LOCAL'].includes(currentRole as string);
  const isEsaviLocal = currentRole === 'ESAVI_LOCAL';
  const isInmunoLocal = currentRole === 'INMUNO_LOCAL';
  const isEpidemioLocal = currentRole === 'EPIDEMIO_LOCAL';
  const isSecretariado = currentRole === 'SECRETARIADO';
  const isComite = currentRole === 'COMITE_EXTERNO';

  // --- COMPONENTE INTERNO: FILA DE ACCIÓN INTELIGENTE ---
  const ActionRow = ({ title, chipStatus, btnText, onClick, disabled, tooltipText, color = "secondary" }: any) => {
    const getChip = () => {
      if (chipStatus === 'Completado') return <Chip label="Completado" color="success" size="small" />;
      if (chipStatus === 'Pendiente') return <Chip label="Pendiente" color="primary" size="small" variant="outlined" />;
      return <Chip label="Bloqueado" color="default" size="small" />;
    };

    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" fontWeight="medium">{title}</Typography>
          {getChip()}
        </Box>
        <Tooltip title={disabled ? tooltipText : ''} placement="left" arrow disableHoverListener={!disabled}>
          <span>
            <Button variant="contained" color={color} size="small" onClick={onClick} disabled={disabled} sx={{ pointerEvents: disabled ? 'none' : 'auto' }}>
              {btnText}
            </Button>
          </span>
        </Tooltip>
      </Box>
    );
  };

  // --- COMPONENTE INTERNO: FILA DE DATOS SOLO LECTURA ---
  const ReadOnlyField = ({ label, value }: { label: string, value: string }) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight="medium">{value}</Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', pb: 8 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Volver a la Bandeja
      </Button>

      {/* ================= CABECERA DEL EXPEDIENTE ================= */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Typography variant="h5" color="primary" fontWeight="bold">Expediente {id}</Typography>
            <Typography variant="subtitle1" color="text.secondary">Paciente: Juan Pérez | Vacuna: COVID-19 Pfizer</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Establecimiento: Unidad de Salud Barrios (MINSAL)</Typography>
          </Grid>
          
          <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
            <Typography variant="overline" color="secondary" fontWeight="bold" display="block">ESTADO ACTUAL</Typography>
            <Typography variant="h6" display="block" gutterBottom color={isFase4Completa ? "success.main" : "text.primary"}>
              {isFase4Completa ? "En Control de Calidad (Fase 5)" : "En Trabajo de Campo (Fase 4)"}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end', mt: 2 }}>
              <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => setOpenNotif(true)} sx={{ width: '220px' }}>
                Ver Notificación Inicial
              </Button>
              <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => setOpenApertura(true)} sx={{ width: '220px' }}>
                Ver Datos de Apertura
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ================= 1. STEPPER DINÁMICO ================= */}
      <Stepper activeStep={faseActual} alternativeLabel sx={{ mb: 5 }}>
        {fases.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ================= TABS PRINCIPALES ================= */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} aria-label="expediente tabs">
          <Tab label="Gestión del Expediente" />
          <Tab label="Gestor de Evidencias" />
          <Tab label="Historial de Cambios" iconPosition="start" icon={<HistoryIcon fontSize="small" />} />
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
                <Typography variant="subtitle1" fontWeight="bold" color="primary">Evaluación y Asignación (Fases 2 y 3)</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <ActionRow title="Matriz de Riesgo (Fase 2)" chipStatus={isAperturado ? 'Completado' : 'Pendiente'} btnText="Evaluar Riesgo" onClick={() => navigate('/matriz-riesgo')} disabled={!isJefe} tooltipText="Acceso exclusivo para Jefaturas." />
                <ActionRow title="Asignación Equipo ERR (Fase 3)" chipStatus={isAperturado ? 'Completado' : 'Pendiente'} btnText="Asignar Equipo" onClick={() => navigate('/asignar-equipo/' + id)} disabled={!isJefe} tooltipText="Acceso exclusivo para Jefaturas." />
              </Box>
            </CardContent>
          </Card>

          {/* TARJETA 2: TRABAJO DE CAMPO (Fase 4) */}
          <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SearchIcon color="secondary" />
                  <Typography variant="subtitle1" fontWeight="bold" color="secondary.main">Investigación de Campo (Fase 4)</Typography>
                </Box>
                {/* ETIQUETA DINÁMICA DE ASIGNACIÓN AL ERR */}
                {isLocalOperativo && isUserAssignedToERR && <Chip label="Asignado como Investigador ERR" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />}
              </Box>
              
              <Box sx={{ p: 2 }}>
                {!logisticaCompletada && isUserAssignedToERR && (isInmunoLocal || isEpidemioLocal) && (
                  <Alert severity="warning" sx={{ mb: 2, fontWeight: 'bold' }}>Debe completar la Logística de Campo (Anexo III) antes de proceder a la investigación en terreno.</Alert>
                )}

                <ActionRow title="Checklist Logística (Anexo III)" chipStatus={logisticaCompletada ? 'Completado' : 'Pendiente'} btnText="Completar Logística" onClick={() => navigate('/anexo-logistica/' + id)} disabled={!(isInmunoLocal || isEpidemioLocal) || !isUserAssignedToERR} tooltipText={!isUserAssignedToERR ? "No está asignado a este caso." : "Solo Equipo de Campo."} />
                <ActionRow title="Evaluación Clínica (Anexo VII)" chipStatus={isClinicoLlenado ? 'Completado' : 'Pendiente'} btnText="Llenar Clínico" onClick={() => navigate('/anexo-clinico')} disabled={!isEsaviLocal || !isUserAssignedToERR} tooltipText={!isUserAssignedToERR ? "No asignado." : "Solo Médico Clínico."} />
                <ActionRow title="Puesto Vacunación (Anexo V)" chipStatus={logisticaCompletada ? 'Pendiente' : 'Bloqueado'} btnText="Llenar Anexo V" onClick={() => navigate('/anexo-puesto')} disabled={!isInmunoLocal || !logisticaCompletada || !isUserAssignedToERR} tooltipText={!isInmunoLocal ? "Solo Inmunizaciones." : "Debe completar Logística (Anexo III)."} />
                <ActionRow title="Inv. Domiciliaria (Anexo VI)" chipStatus={logisticaCompletada ? 'Pendiente' : 'Bloqueado'} btnText="Llenar Anexo VI" onClick={() => navigate('/anexo-domicilio')} disabled={!isEpidemioLocal || !logisticaCompletada || !isUserAssignedToERR} tooltipText={!isEpidemioLocal ? "Solo Epidemiólogo." : "Debe completar Logística (Anexo III)."} />
              </Box>
            </CardContent>
          </Card>

          {/* TARJETA 3: SECRETARIADO Y COMITÉ (Fases 5 y 6) */}
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e0e0e0' }}>
                <FactCheckIcon sx={{ color: '#2e7d32' }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#2e7d32' }}>Cierre y Dictamen Técnico (Fases 5 y 6)</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <ActionRow title="Control Calidad Anexos (Fase 5)" chipStatus={faseActual >= 5 ? 'Completado' : 'Pendiente'} btnText="Revisar y Aprobar" color="success" onClick={() => navigate('/dictamen/' + id)} disabled={!isSecretariado} tooltipText="Solo Secretariado." />
                <ActionRow title="Acta Oficial Causalidad (Fase 6)" chipStatus={faseActual >= 6 ? 'Completado' : 'Pendiente'} btnText="Emitir Dictamen" color="primary" onClick={() => navigate('/dictamen/' + id)} disabled={!isComite} tooltipText="Solo Comité." />
                
                {/* BOTONES DE DEVOLUCIÓN (NUEVA LÓGICA DE MODAL) */}
                {isSecretariado && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>¿Falta Información? Devolver a:</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {/* CAMBIO AQUÍ: Se abre el modal al hacer clic */}
                      <Button variant="outlined" color="error" size="small" onClick={() => setOpenRechazoModal(true)}>
                        Devolver a Ref. ESAVI Local (Clínico)
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => setOpenRechazoModal(true)}>
                        Devolver a Inmunizaciones
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => setOpenRechazoModal(true)}>
                        Devolver a Epidemiólogo (Campo)
                      </Button>
                    </Box>
                  </Box>
                )}

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
              <Typography variant="subtitle1" fontWeight="bold" color="primary">Bitácora de Auditoría del Expediente</Typography>
            </Box>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {mockHistorial.map((registro, index) => (
                <Box key={registro.id}>
                  <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <HistoryIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="bold" color="text.primary">
                          {registro.accion}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography component="span" variant="body2" color="text.primary" fontWeight="medium">
                            {registro.usuario}
                          </Typography>
                          {" — " + registro.rol}
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {registro.fecha}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < mockHistorial.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))}
            </List>
          </Paper>
        </Box>
      )}

      {/* MODALES READ-ONLY */}
      <Dialog open={openNotif} onClose={() => setOpenNotif(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', mb: 2 }}>Notificación Inicial - ESAVI (Fase 1)</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" sx={{ borderBottom: '1px solid #ccc', mb: 1 }}>Datos del Paciente</Typography>
              <ReadOnlyField label="Nombre Completo" value="Juan Pérez López" />
              <ReadOnlyField label="DUI" value="04567892-1" />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" sx={{ borderBottom: '1px solid #ccc', mb: 1 }}>Datos Evento</Typography>
              <ReadOnlyField label="Vacuna" value="COVID-19 Pfizer" />
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
          <ReadOnlyField label="Institución" value="MINSAL - U.S. Barrios" />
          <Alert severity="warning" sx={{ mt: 2, fontWeight: 'bold' }}>Riesgo Calculado: ALTO (7 puntos) - Respuesta REGIONAL.</Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}><Button onClick={() => setOpenApertura(false)} variant="contained" color="secondary">Cerrar</Button></DialogActions>
      </Dialog>

      {/* =====================================================================
          NUEVO MODAL: DEVOLUCIÓN DE EXPEDIENTE (FASE 5)
      ===================================================================== */}
      <Dialog open={openRechazoModal} onClose={() => setOpenRechazoModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', mb: 2 }}>
          Motivo de Devolución del Expediente
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            El caso regresará al investigador local y su estado cambiará a "EN INVESTIGACIÓN" hasta que se subsanen las observaciones.
          </Alert>
          <TextField 
            fullWidth 
            multiline 
            rows={4} 
            label="Observaciones de Devolución" 
            placeholder="Especifique qué información falta o debe ser corregida..."
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setOpenRechazoModal(false)} variant="outlined" color="inherit">Cancelar</Button>
          <Button 
            variant="contained" 
            color="error" 
            disabled={motivoRechazo.trim() === ''}
            onClick={() => {
              alert(`Expediente devuelto por el siguiente motivo: ${motivoRechazo}`);
              setMotivoRechazo('');
              setOpenRechazoModal(false);
            }}
          >
            Confirmar Devolución
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}