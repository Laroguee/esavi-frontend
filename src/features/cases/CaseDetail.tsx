import { useState } from 'react';
import { Box, Paper, Typography, Stepper, Step, StepLabel, Button, Divider, Grid, Alert, Card, CardContent, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GavelIcon from '@mui/icons-material/Gavel';
import SearchIcon from '@mui/icons-material/Search';

const fases = [
  'Fase 1: Notificación',
  'Fase 2: Evaluación',
  'Fase 3: Asignación',
  'Fase 4: Investigación',
  'Fase 5: Control Calidad',
  'Fase 6: Dictamen'
];

export default function CaseDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { currentRole, logisticaCompletada } = useAuthStore(); 

  // --- ESTADOS PARA MODALES (Read-Only) ---
  const [openNotif, setOpenNotif] = useState(false);
  const [openApertura, setOpenApertura] = useState(false);

  // --- MOCK DE ESTADOS PARA LA UI Y ASIGNACIÓN ---
  const isAperturado = true;
  const isClinicoLlenado = true; // Simulamos que el médico ya llenó su parte
  const isFase4Completa = isClinicoLlenado && logisticaCompletada; 
  const faseActual = isFase4Completa ? 4 : 3; 

  // SIMULACIÓN DE ASIGNACIÓN: ¿Está el usuario local logueado asignado al ERR de este caso?
  const isUserAssignedToERR = true; // Cambia a false para probar el bloqueo

  // --- EVALUACIÓN DE ROLES ---
  const isJefe = ['ESAVI_INSTITUCIONAL', 'EPIDEMIO_INSTITUCIONAL', 'INMUNO_INSTITUCIONAL'].includes(currentRole);
  const isLocalOperativo = ['ESAVI_LOCAL', 'INMUNO_LOCAL', 'EPIDEMIO_LOCAL'].includes(currentRole);
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

      <Typography variant="h5" color="primary" fontWeight="bold" sx={{ mb: 3 }}>
        Gestión del Expediente
      </Typography>

      {/* ================= TARJETA 1: JEFATURAS (Fase 2 y 3) ================= */}
      <Card  elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e0e0e0' }}>
            <AssignmentIcon color="primary" />
            <Typography variant="subtitle1" fontWeight="bold" color="primary">Evaluación y Asignación (Fases 2 y 3)</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <ActionRow 
              title="Matriz de Valoración de Riesgo (Fase 2)" chipStatus={isAperturado ? 'Completado' : 'Pendiente'} btnText="Evaluar Riesgo" 
              onClick={() => navigate('/matriz-riesgo')} disabled={!isJefe} tooltipText="Acceso exclusivo para Jefaturas Institucionales."
            />
            <ActionRow 
              title="Asignación Equipo de Respuesta Rápida (Fase 3)" chipStatus={isAperturado ? 'Completado' : 'Pendiente'} btnText="Asignar Equipo" 
              onClick={() => navigate('/asignar-equipo/' + id)} disabled={!isJefe} tooltipText="Acceso exclusivo para Jefaturas Institucionales."
            />
          </Box>
        </CardContent>
      </Card>

      {/* ================= TARJETA 2: TRABAJO DE CAMPO (Fase 4) ================= */}
      <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon color="secondary" />
              <Typography variant="subtitle1" fontWeight="bold" color="secondary.main">Investigación de Campo (Fase 4)</Typography>
            </Box>
            {/* ETIQUETA DINÁMICA DE ASIGNACIÓN AL ERR */}
            {isLocalOperativo && isUserAssignedToERR && (
              <Chip label="Asignado como Investigador ERR" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />
            )}
          </Box>
          
          <Box sx={{ p: 2 }}>
            {/* ALERTA DE ASIGNACIÓN */}
            {isLocalOperativo && !isUserAssignedToERR && (
              <Alert severity="error" sx={{ mb: 2, fontWeight: 'bold' }}>
                No está asignado como parte del Equipo de Respuesta Rápida para este caso.
              </Alert>
            )}

            {/* ALERTA DE LOGÍSTICA */}
            {isLocalOperativo && isUserAssignedToERR && !logisticaCompletada && (isInmunoLocal || isEpidemioLocal) && (
              <Alert severity="warning" sx={{ mb: 2, fontWeight: 'bold' }}>
                Debe completar la Logística de Campo (Anexo III) antes de proceder a la investigación en terreno.
              </Alert>
            )}

            <ActionRow 
              title="Checklist de Logística y Seguridad (Anexo III)" chipStatus={logisticaCompletada ? 'Completado' : 'Pendiente'} btnText="Completar Logística" 
              onClick={() => navigate('/anexo-logistica/' + id)} disabled={!(isInmunoLocal || isEpidemioLocal) || !isUserAssignedToERR}
              tooltipText={!isUserAssignedToERR ? "No está asignado a este caso." : "Acceso exclusivo para Equipo de Campo (Inmunizaciones o Epidemiología)."}
            />
            
            <ActionRow 
              title="Evaluación Clínica de ESAVI (Anexo VII)" chipStatus={isClinicoLlenado ? 'Completado' : 'Pendiente'} btnText="Llenar Anexo Clínico" 
              onClick={() => navigate('/anexo-clinico')} disabled={!isEsaviLocal || !isUserAssignedToERR}
              tooltipText={!isUserAssignedToERR ? "No está asignado a este caso." : "Acceso exclusivo para el Médico Clínico (Referente ESAVI Local)."}
            />

            <ActionRow 
              title="Guía del Puesto de Vacunación (Anexo V)" chipStatus={logisticaCompletada ? 'Pendiente' : 'Bloqueado'} btnText="Llenar Anexo V" 
              onClick={() => navigate('/anexo-puesto')} disabled={!isInmunoLocal || !logisticaCompletada || !isUserAssignedToERR}
              tooltipText={!isInmunoLocal ? "Acceso exclusivo para Personal de Inmunizaciones." : !isUserAssignedToERR ? "No está asignado a este caso." : "Debe completar primero el Checklist de Logística (Anexo III)."}
            />

            <ActionRow 
              title="Investigación Domiciliaria (Anexo VI)" chipStatus={logisticaCompletada ? 'Pendiente' : 'Bloqueado'} btnText="Llenar Anexo VI" 
              onClick={() => navigate('/anexo-domicilio')} disabled={!isEpidemioLocal || !logisticaCompletada || !isUserAssignedToERR}
              tooltipText={!isEpidemioLocal ? "Acceso exclusivo para el Epidemiólogo de Campo." : !isUserAssignedToERR ? "No está asignado a este caso." : "Debe completar primero el Checklist de Logística (Anexo III)."}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ================= TARJETA 3: SECRETARIADO Y COMITÉ (Fases 5 y 6) ================= */}
      <Card  elevation={2} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ bgcolor: '#f4f6f8', p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e0e0e0' }}>
            <FactCheckIcon sx={{ color: '#2e7d32' }} />
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#2e7d32' }}>Cierre y Dictamen Técnico (Fases 5 y 6)</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <ActionRow 
              title="Control de Calidad de Anexos (Fase 5)" chipStatus={isFase4Completa ? 'Pendiente' : 'Bloqueado'} btnText="Revisar y Aprobar" color="success"
              onClick={() => navigate('/dictamen/' + id)} disabled={!isSecretariado} tooltipText="Acceso exclusivo para el Secretariado Técnico (SRS)."
            />
            <ActionRow 
              title="Acta Oficial de Causalidad (Fase 6)" chipStatus={isFase4Completa ? 'Pendiente' : 'Bloqueado'} btnText="Emitir Dictamen" color="primary"
              onClick={() => navigate('/dictamen/' + id)} disabled={!isComite} tooltipText="Acceso exclusivo para el Comité Externo de Expertos."
            />
          </Box>
        </CardContent>
      </Card>

    {/* ================= MODALES (DIALOGS) DE SOLO LECTURA ================= */}
      
      {/* 1. Modal Notificación Inicial */}
      <Dialog open={openNotif} onClose={() => setOpenNotif(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', mb: 2 }}>
          Notificación Inicial - ESAVI (Fase 1)
        </DialogTitle> {/* <---- CORRECCIÓN AQUÍ */}
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" sx={{ borderBottom: '1px solid #ccc', mb: 1 }}>Datos del Paciente</Typography>
              <ReadOnlyField label="Nombre Completo" value="Juan Pérez López" />
              <ReadOnlyField label="Edad / Sexo" value="34 años / Masculino" />
              <ReadOnlyField label="DUI" value="04567892-1" />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" sx={{ borderBottom: '1px solid #ccc', mb: 1 }}>Datos de la Vacuna y Evento</Typography>
              <ReadOnlyField label="Vacuna y Lote" value="COVID-19 Pfizer (Lote: A123)" />
              <ReadOnlyField label="Fecha y Hora de Vacunación" value="01/07/2026 10:00 AM" />
              <ReadOnlyField label="Inicio de Síntomas" value="01/07/2026 10:15 AM" />
              <ReadOnlyField label="Descripción del Evento" value="Paciente presenta rash generalizado y dificultad para respirar 15 minutos posterior a la administración. Trasladado a emergencia." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setOpenNotif(false)} variant="contained" color="primary">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* 2. Modal Datos de Apertura */}
      <Dialog open={openApertura} onClose={() => setOpenApertura(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', mb: 2 }}>
          Datos de Apertura y Triaje (Fase 2)
        </DialogTitle> {/* <---- CORRECCIÓN AQUÍ */}
        <DialogContent>
          <Grid container spacing={2}>
             <Grid item xs={12}>
              <ReadOnlyField label="Fecha de Oficialización" value="02/07/2026" />
              <ReadOnlyField label="Institución que asume" value="MINSAL - Unidad de Salud Barrios" />
              <ReadOnlyField label="Reunión Equipo Coordinador" value="Virtual - 02/07/2026 14:00 hrs" />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>Resultado de Matriz de Riesgo</Typography>
              <Alert severity="warning" sx={{ fontWeight: 'bold' }}>
                Riesgo Calculado: ALTO (7 puntos) - Respuesta REGIONAL.
              </Alert>
             </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setOpenApertura(false)} variant="contained" color="secondary">Cerrar</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
} 