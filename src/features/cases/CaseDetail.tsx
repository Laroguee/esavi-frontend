import { Box, Paper, Typography, Stepper, Step, StepLabel, Button, Divider, Grid } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';

const fases = [
  'Fase 1: Notificación',
  'Fase 2: Evaluación Riesgo',
  'Fase 3: Asignación ERR',
  'Fase 4: Investigación',
  'Fase 5: Control Calidad',
  'Fase 6: Comité Causalidad'
];

export default function CaseDetail() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { currentRole } = useAuthStore(); 

  const faseActual = 3; // Simulación: Estamos en la Fase 4 (Investigación)

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', pb: 8 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Volver a la Bandeja
      </Button>

      {/* CABECERA DEL EXPEDIENTE */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              Expediente {id}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Paciente: Juan Pérez | Vacuna: COVID-19 Pfizer (Lote: A123)
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Establecimiento: Unidad de Salud Barrios (MINSAL)
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
            <Typography variant="overline" color="secondary" fontWeight="bold" display="block">
              ESTADO ACTUAL
            </Typography>
            <Typography variant="h6" display="block" gutterBottom>
              En Trabajo de Campo (Fase 4)
            </Typography>
            
            {/* BOTONES DE CONSULTA DE DOCUMENTOS PREVIOS */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end', mt: 2 }}>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<VisibilityIcon />}
                onClick={() => console.log('Navegando a ver-notificacion')}
                sx={{ width: '220px' }}
              >
                Ver Notificación Inicial
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<VisibilityIcon />}
                onClick={() => console.log('Navegando a ver-apertura')}
                sx={{ width: '220px' }}
              >
                Ver Datos de Apertura
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* LÍNEA DE TIEMPO */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 4 }}>Trazabilidad del Caso</Typography>
        <Stepper activeStep={faseActual} alternativeLabel>
          {fases.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

     {/* ÁREA DE ACCIÓN (Muestra botones según el Rol Exacto) */}
      <Paper elevation={3} sx={{ p: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Acciones Disponibles para: {currentRole.replace(/_/g, ' ')}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {currentRole === 'ESAVI_LOCAL' ? (
          <Button variant="contained" color="secondary" onClick={() => navigate('/anexo-clinico')}>
            Llenar Anexo VII (Clínico)
          </Button>
        ) : currentRole === 'INMUNO_LOCAL' ? (
          <Button variant="contained" color="secondary" onClick={() => navigate('/anexo-puesto')}>
            Llenar Anexo V (Puesto Vacuna)
          </Button>
        ) : currentRole === 'EPIDEMIO_LOCAL' ? (
          <Button variant="contained" color="secondary" onClick={() => navigate('/anexo-domicilio')}>
            Llenar Anexo VI (Domiciliario)
          </Button>
        ) : currentRole === 'ESAVI_INSTITUCIONAL' || currentRole === 'EPIDEMIO_INSTITUCIONAL' || currentRole === 'INMUNO_INSTITUCIONAL' ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={() => navigate('/matriz-riesgo')}>
              Evaluar Riesgo (Fase 2)
            </Button>
            <Button variant="outlined" color="primary">
              Asignar Equipo ERR (Fase 3)
            </Button>
          </Box>
        ) : currentRole === 'SECRETARIADO' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Button variant="contained" color="success" size="large">
                Todo Correcto - Aprobar a Comité (Fase 6)
              </Button>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="error">¿Falta Información? Devolver a:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" color="error" size="small">Devolver a Ref. ESAVI Local (Clínico)</Button>
              <Button variant="outlined" color="error" size="small">Devolver a Inmunizaciones</Button>
              <Button variant="outlined" color="error" size="small">Devolver a Epidemiólogo (Campo)</Button>
            </Box>
          </Box>
        ) : (
          <Typography color="text.secondary">
            No tienes acciones pendientes en esta fase.
          </Typography>
        )}
      </Paper>

    </Box>
  );
}