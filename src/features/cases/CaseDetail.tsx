import { Box, Paper, Typography, Stepper, Step, StepLabel, Button, Divider, Grid } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const fases = [
  'Fase 1: Notificación',
  'Fase 2: Evaluación Riesgo',
  'Fase 3: Asignación ERR',
  'Fase 4: Investigación',
  'Fase 5: Control Calidad',
  'Fase 6: Comité Causalidad'
];

export default function CaseDetail() {
  const { id } = useParams(); // Obtenemos el ID del caso desde la URL
  const navigate = useNavigate();
  const { currentRole } = useAuthStore(); // Leemos qué rol tiene el usuario ahorita

  // Simulemos que este caso está atascado en la Fase 4 (Investigación)
  const faseActual = 3; // En programación empezamos a contar desde 0 (0,1,2,3 = Fase 4)

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto' }}>
      
      {/* Botón de regresar */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Volver a la Bandeja
      </Button>

      {/* CABECERA DEL EXPEDIENTE */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderLeft: '6px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              Expediente ESAVI: {id}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Paciente: Juan Pérez | Vacuna: COVID-19 Pfizer (Lote: A123)
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Establecimiento: Unidad de Salud Barrios (MINSAL)
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Typography variant="overline" color="secondary" fontWeight="bold">
              ESTADO ACTUAL
            </Typography>
            <Typography variant="h6">En Trabajo de Campo</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* LÍNEA DE TIEMPO (TRAZABILIDAD) */}
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

      {/* ÁREA DE ACCIÓN (Cambia según el Rol) */}
      <Paper elevation={3} sx={{ p: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Acciones Disponibles para: {currentRole.replace('_', ' ')}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Lógica de negocio: Si soy ERR, muestro los Anexos */}
        {currentRole === 'ERR_CAMPO' ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="secondary" onClick={() => navigate('/anexo-clinico')}>Llenar Anexo Clínico</Button>
            <Button variant="contained" color="secondary">Llenar Anexo Vacuna</Button>
            <Button variant="contained" color="secondary">Llenar Anexo Campo</Button>
          </Box>
        ) : currentRole === 'EQUIPO_COORDINADOR' ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={() => navigate('/matriz-riesgo')}>
              Evaluar Riesgo (Fase 2)
            </Button>
          </Box>
        ) : currentRole === 'SECRETARIADO' ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="success">Aprobar Información</Button>
            <Button variant="outlined" color="error">Devolver</Button>
          </Box>
        ) : (
          <Typography color="text.secondary">
            No tienes acciones pendientes en esta fase. El caso está asignado al Equipo de Respuesta Rápida (ERR).
          </Typography>
        )}
      </Paper>

    </Box>
  );
}