import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';

export default function NotificacionInicial() {
  const navigate = useNavigate();

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      // SECCIÓN A
      fechaNotificacion: '', nombreNotificador: '', cargoNotificador: '',
      establecimientoNotificador: '', telefonoNotificador: '',
      
      // SECCIÓN B
      pacienteNombres: '', pacienteApellidos: '', pacienteSexo: '',
      pacienteFechaNacimiento: '', pacienteEdad: '', pacienteDUI: '',
      pacienteDireccion: '', pacienteResponsable: '',

      // SECCIÓN C
      vacunaNombre: '', vacunaFecha: '', vacunaHora: '', vacunaDosis: '',
      vacunaLote: '', vacunaFabricante: '', vacunaCaducidad: '', vacunaSitio: '',

      // SECCIÓN D
      eventoFechaInicio: '', eventoHoraInicio: '', eventoDescripcion: '',
      eventoGravedad: '', eventoCriterioGravedad: '', eventoDesenlace: ''
    }
  });

  // Observamos el valor de Gravedad para mostrar u ocultar los Criterios
  const gravedadActual = watch('eventoGravedad');

  const onSubmit = (data: any) => {
    console.log("Notificación Inicial Registrada:", data);
    alert("Notificación registrada exitosamente. Pasará a la bandeja de pendientes para su oficialización.");
    
    // Regresa al inicio (Dashboard)
    navigate('/');
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1000, margin: 'auto', pb: 8, pt: 2 }}>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Formulario de Notificación Inicial ESAVI
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Registro primario de Eventos Supuestamente Atribuibles a la Vacunación o Inmunización.
        </Typography>
      </Box>

      {/* SECCIÓN A: Datos del Notificador */}
      <Paper variant="outlined" sx={{ mb: 4, p: 3, borderColor: '#e0e0e0', borderTop: '4px solid', borderTopColor: 'primary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
          A. Datos del Notificador (Establecimiento)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Controller name="fechaNotificacion" control={control} render={({ field }) => (
              <TextField {...field} fullWidth type="date" label="Fecha de notificación" size="small" InputLabelProps={{ shrink: true }} required />
            )}/>
          </Grid>
          <Grid item xs={12} md={8}>
            <Controller name="establecimientoNotificador" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Establecimiento de Salud (SIBASI)" size="small" required />
            )}/>
          </Grid>
          <Grid item xs={12} md={5}>
            <Controller name="nombreNotificador" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Nombre del notificador" size="small" required />
            )}/>
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="cargoNotificador" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Cargo" size="small" />
            )}/>
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller name="telefonoNotificador" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Teléfono de contacto" size="small" />
            )}/>
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN B: Datos del Paciente */}
      <Paper variant="outlined" sx={{ mb: 4, p: 3, borderColor: '#e0e0e0' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
          B. Datos del Paciente
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Controller name="pacienteNombres" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Nombres" size="small" required />
            )}/>
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="pacienteApellidos" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Apellidos" size="small" required />
            )}/>
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller name="pacienteSexo" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth label="Sexo" size="small" required>
                <MenuItem value="Femenino">Femenino</MenuItem>
                <MenuItem value="Masculino">Masculino</MenuItem>
                <MenuItem value="Otro">Otro</MenuItem>
              </TextField>
            )}/>
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller name="pacienteFechaNacimiento" control={control} render={({ field }) => (
              <TextField {...field} fullWidth type="date" label="Fecha de Nacimiento" size="small" InputLabelProps={{ shrink: true }} />
            )}/>
          </Grid>
          <Grid item xs={12} md={2}>
            <Controller name="pacienteEdad" control={control} render={({ field }) => (
              <TextField {...field} fullWidth type="number" label="Edad" size="small" required />
            )}/>
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="pacienteDUI" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Documento de Identidad (DUI / Pas)" size="small" />
            )}/>
          </Grid>
          <Grid item xs={12}>
            <Controller name="pacienteDireccion" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Dirección de residencia completa" size="small" />
            )}/>
          </Grid>
          <Grid item xs={12}>
            <Controller name="pacienteResponsable" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Nombre del responsable o cuidador (si es menor de edad)" size="small" />
            )}/>
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN C: Datos de la Vacuna */}
      <Paper variant="outlined" sx={{ mb: 4, p: 3, borderColor: '#e0e0e0' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
          C. Datos de la Vacuna Implicada
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Controller name="vacunaNombre" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth label="Nombre de la vacuna" size="small" required>
                {['BCG', 'Hepatitis B', 'Rotavirus', 'Pentavalente', 'Neumococo', 'Polio', 'DPT', 'SRP', 'VPH', 'COVID-19', 'Influenza', 'Otra'].map(vac => (
                  <MenuItem key={vac} value={vac}>{vac}</MenuItem>
                ))}
              </TextField>
            )}/>
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller name="vacunaFecha" control={control} render={({ field }) => (
              <TextField {...field} fullWidth type="date" label="Fecha de vacunación" size="small" InputLabelProps={{ shrink: true }} required />
            )}/>
          </Grid>
          <Grid item xs={12} md={3}>
            <Controller name="vacunaHora" control={control} render={({ field }) => (
              <TextField {...field} fullWidth type="time" label="Hora de vacunación" size="small" InputLabelProps={{ shrink: true }} />
            )}/>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Controller name="vacunaDosis" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth label="Número de Dosis" size="small">
                <MenuItem value="1ra">1ra Dosis</MenuItem>
                <MenuItem value="2da">2da Dosis</MenuItem>
                <MenuItem value="3ra">3ra Dosis</MenuItem>
                <MenuItem value="Refuerzo">Refuerzo</MenuItem>
                <MenuItem value="Unica">Única</MenuItem>
              </TextField>
            )}/>
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="vacunaLote" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Número de Lote" size="small" required />
            )}/>
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="vacunaFabricante" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Nombre del Fabricante" size="small" />
            )}/>
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller name="vacunaCaducidad" control={control} render={({ field }) => (
              <TextField {...field} fullWidth type="date" label="Fecha de caducidad del vial" size="small" InputLabelProps={{ shrink: true }} />
            )}/>
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="vacunaSitio" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth label="Sitio de aplicación" size="small">
                <MenuItem value="Brazo derecho">Brazo derecho</MenuItem>
                <MenuItem value="Brazo izquierdo">Brazo izquierdo</MenuItem>
                <MenuItem value="Muslo derecho">Muslo derecho</MenuItem>
                <MenuItem value="Muslo izquierdo">Muslo izquierdo</MenuItem>
                <MenuItem value="Boca">Boca</MenuItem>
              </TextField>
            )}/>
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN D: Detalles del Evento */}
      <Paper variant="outlined" sx={{ mb: 4, p: 3, borderColor: '#e0e0e0', borderLeft: '5px solid', borderLeftColor: 'secondary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
          D. Detalles del Evento (ESAVI)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Controller name="eventoFechaInicio" control={control} render={({ field }) => (
              <TextField {...field} fullWidth type="date" label="Fecha de inicio de síntomas" size="small" InputLabelProps={{ shrink: true }} required />
            )}/>
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="eventoHoraInicio" control={control} render={({ field }) => (
              <TextField {...field} fullWidth type="time" label="Hora de inicio de síntomas" size="small" InputLabelProps={{ shrink: true }} />
            )}/>
          </Grid>
          
          <Grid item xs={12}>
            <Controller name="eventoDescripcion" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={4} label="Descripción clínica del evento" placeholder="Describa los signos, síntomas y la evolución..." size="small" required />
            )}/>
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller name="eventoGravedad" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth label="Gravedad del Evento" size="small" required>
                <MenuItem value="No Grave">No Grave</MenuItem>
                <MenuItem value="Grave">Grave</MenuItem>
              </TextField>
            )}/>
          </Grid>

          {gravedadActual === 'Grave' && (
            <Grid item xs={12} md={4}>
              <Controller name="eventoCriterioGravedad" control={control} render={({ field }) => (
                <TextField {...field} select fullWidth label="Criterio de Gravedad" size="small" sx={{ bgcolor: '#fff3e0' }}>
                  <MenuItem value="Muerte">Muerte</MenuItem>
                  <MenuItem value="Peligro inminente de vida">Peligro inminente de vida</MenuItem>
                  <MenuItem value="Hospitalizacion">Hospitalización</MenuItem>
                  <MenuItem value="Discapacidad">Discapacidad</MenuItem>
                  <MenuItem value="Anomalia congenita">Anomalía congénita</MenuItem>
                  <MenuItem value="Aborto">Aborto</MenuItem>
                </TextField>
              )}/>
            </Grid>
          )}

          <Grid item xs={12} md={4}>
            <Controller name="eventoDesenlace" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth label="Desenlace actual" size="small">
                <MenuItem value="Recuperado">Recuperado</MenuItem>
                <MenuItem value="En recuperacion">En recuperación</MenuItem>
                <MenuItem value="No recuperado">No recuperado</MenuItem>
                <MenuItem value="Fallecido">Fallecido</MenuItem>
                <MenuItem value="Desconocido">Desconocido</MenuItem>
              </TextField>
            )}/>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" color="primary" size="large">
          Limpiar Formulario
        </Button>
        <Button type="submit" variant="contained" color="secondary" size="large" startIcon={<SendIcon />}>
          Registrar Notificación Inicial
        </Button>
      </Box>

    </Box>
  );
}