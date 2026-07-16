import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider } from '@mui/material';

import { useNavigate } from 'react-router-dom';

export default function NotificacionInicial() {
  const navigate = useNavigate();

  const { control, handleSubmit, watch, reset } = useForm({
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

  const gravedadActual = watch('eventoGravedad');

  const onSubmit = (data: any) => {
    console.log("Notificación Inicial Registrada:", data);
    alert("Notificación registrada exitosamente. Pasará a la bandeja de pendientes para su oficialización.");
    navigate('/');
  };

  // Función para arreglar el traslape de fechas
  const getDateTimeSx = (hasValue: boolean) => ({
    '& input::-webkit-datetime-edit': {
      color: hasValue ? 'text.primary' : 'transparent',
    },
    '& input:focus::-webkit-datetime-edit': {
      color: 'text.primary',
    },
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1050, margin: 'auto', pb: 8, pt: 4 }}>
      
      {/* CABECERA */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: '800', mb: 1 }}>
          Formulario de Notificación Inicial ESAVI
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Registro primario de Eventos Supuestamente Atribuibles a la Vacunación o Inmunización.
        </Typography>
      </Box>

      {/* SECCIÓN A: Datos del Notificador */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            A. Datos del Notificador (Establecimiento)
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Fila 1: Suma 12 */}
            <Grid item xs={12} md={4}>
              <Controller name="fechaNotificacion" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de notificación" required 
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                />
              )}/>
            </Grid>
            <Grid item xs={12} md={8}>
              <Controller name="establecimientoNotificador" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Establecimiento de Salud (SIBASI)" required />
              )}/>
            </Grid>
            {/* Fila 2: Suma 12 */}
            <Grid item xs={12} md={5}>
              <Controller name="nombreNotificador" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Nombre del notificador" required />
              )}/>
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name="cargoNotificador" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Cargo" />
              )}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <Controller name="telefonoNotificador" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Teléfono de contacto" />
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* SECCIÓN B: Datos del Paciente */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            B. Datos del Paciente
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Fila 1: Suma 12 */}
            <Grid item xs={12} md={6}>
              <Controller name="pacienteNombres" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Nombres" required />
              )}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller name="pacienteApellidos" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Apellidos" required />
              )}/>
            </Grid>
            {/* Fila 2: Suma 12 */}
            <Grid item xs={12} md={4}>
              <Controller name="pacienteSexo" control={control} render={({ field }) => (
                <TextField {...field} select fullWidth label="Sexo" required sx={{ minWidth: 160 }}>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              )}/>
            </Grid>
            <Grid item xs={12} md={5}>
              <Controller name="pacienteFechaNacimiento" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de Nacimiento"
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                />
              )}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <Controller name="pacienteEdad" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="number" label="Edad" required />
              )}/>
            </Grid>
            {/* Fila 3: Suma 12 */}
            <Grid item xs={12} md={4}>
              <Controller name="pacienteDUI" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Identidad (DUI/Pas)" />
              )}/>
            </Grid>
            <Grid item xs={12} md={8}>
              <Controller name="pacienteResponsable" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Nombre del responsable (si es menor)" />
              )}/>
            </Grid>
            {/* Fila 4: Suma 12 */}
            <Grid item xs={12} md={12}>
              <Controller name="pacienteDireccion" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Dirección de residencia completa" />
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* SECCIÓN C: Datos de la Vacuna */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            C. Datos de la Vacuna Implicada
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Fila 1: Suma 12 */}
            <Grid item xs={12} md={6}>
              <Controller name="vacunaNombre" control={control} render={({ field }) => (
                <TextField {...field} select fullWidth label="Nombre de la vacuna" required sx={{ minWidth: 160 }}>
                  {['BCG', 'Hepatitis B', 'Rotavirus', 'Pentavalente', 'Neumococo', 'Polio', 'DPT', 'SRP', 'VPH', 'COVID-19', 'Influenza', 'Otra'].map(vac => (
                    <MenuItem key={vac} value={vac}>{vac}</MenuItem>
                  ))}
                </TextField>
              )}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <Controller name="vacunaFecha" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de vacunación" required 
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                />
              )}/>
            </Grid>
            <Grid item xs={12} md={3}>
              <Controller name="vacunaHora" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="time" label="Hora de vacunación"
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                />
              )}/>
            </Grid>
            {/* Fila 2: Suma 12 */}
            <Grid item xs={12} md={4}>
              <Controller name="vacunaDosis" control={control} render={({ field }) => (
                <TextField {...field} select fullWidth label="Número de Dosis" sx={{ minWidth: 160 }}>
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
                <TextField {...field} fullWidth label="Número de Lote" required />
              )}/>
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name="vacunaFabricante" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Nombre del Fabricante" />
              )}/>
            </Grid>
            {/* Fila 3: Suma 12 */}
            <Grid item xs={12} md={4}>
              <Controller name="vacunaCaducidad" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de caducidad"
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                />
              )}/>
            </Grid>
            <Grid item xs={12} md={8}>
              <Controller name="vacunaSitio" control={control} render={({ field }) => (
                <TextField {...field} select fullWidth label="Sitio anatómico de aplicación" sx={{ minWidth: 160 }}>
                  <MenuItem value="Brazo derecho">Brazo derecho (Deltoides)</MenuItem>
                  <MenuItem value="Brazo izquierdo">Brazo izquierdo (Deltoides)</MenuItem>
                  <MenuItem value="Muslo derecho">Muslo derecho (Vasto externo)</MenuItem>
                  <MenuItem value="Muslo izquierdo">Muslo izquierdo (Vasto externo)</MenuItem>
                  <MenuItem value="Boca">Oral (Boca)</MenuItem>
                </TextField>
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* SECCIÓN D: Detalles del Evento */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'secondary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            D. Detalles del Evento (Sintomatología)
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Fila 1: Suma 12 */}
            <Grid item xs={12} md={4}>
              <Controller name="eventoFechaInicio" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="date" label="Fecha inicio de síntomas" required 
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                />
              )}/>
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name="eventoHoraInicio" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="time" label="Hora inicio de síntomas"
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                />
              )}/>
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name="eventoGravedad" control={control} render={({ field }) => (
                <TextField {...field} select fullWidth label="Gravedad del Evento" required sx={{ minWidth: 160 }}>
                  <MenuItem value="No Grave">No Grave</MenuItem>
                  <MenuItem value="Grave">Grave</MenuItem>
                </TextField>
              )}/>
            </Grid>

            {/* Fila 2: Suma 12 */}
            <Grid item xs={12}>
              <Controller name="eventoDescripcion" control={control} render={({ field }) => (
                <TextField {...field} fullWidth multiline rows={4} label="Descripción clínica del evento" placeholder="Describa a detalle los signos, síntomas y la evolución del paciente..." required />
              )}/>
            </Grid>

            {/* Fila 3: Suma 12 (Condicional) */}
            <Grid container item spacing={3} xs={12}>
              {gravedadActual === 'Grave' && (
                <Grid item xs={12} md={6}>
                  <Controller name="eventoCriterioGravedad" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth label="Criterio de Gravedad" sx={{ minWidth: 160, bgcolor: '#fff3e0' }}>
                      <MenuItem value="Muerte">Muerte</MenuItem>
                      <MenuItem value="Peligro inminente de vida">Peligro inminente de vida</MenuItem>
                      <MenuItem value="Hospitalizacion">Hospitalización</MenuItem>
                      <MenuItem value="Discapacidad">Discapacidad severa</MenuItem>
                      <MenuItem value="Anomalia congenita">Anomalía congénita</MenuItem>
                    </TextField>
                  )}/>
                </Grid>
              )}
              <Grid item xs={12} md={gravedadActual === 'Grave' ? 6 : 4}>
                <Controller name="eventoDesenlace" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="Desenlace actual" sx={{ minWidth: 160 }}>
                    <MenuItem value="Recuperado">Recuperado</MenuItem>
                    <MenuItem value="En recuperacion">En recuperación</MenuItem>
                    <MenuItem value="No recuperado">No recuperado</MenuItem>
                    <MenuItem value="Fallecido">Fallecido</MenuItem>
                    <MenuItem value="Desconocido">Desconocido</MenuItem>
                  </TextField>
                )}/>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* BOTONES */}
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          color="inherit" 
          size="large" 
          
          onClick={() => reset()}
        >
          Limpiar Campos
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          size="large" 
          
          sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
        >
          Registrar Notificación Inicial
        </Button>
      </Box>

    </Box>
  );
}