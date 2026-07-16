import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';

export default function FormularioApertura() {
  const navigate = useNavigate();

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      idUnico: '',
      fechaNotificacion: '',
      institucion: 'MINSAL',
      establecimiento: '',
      tipoReunion: 'Virtual',
      fechaReunion: '',
    }
  });

  const institucionSeleccionada = watch('institucion');

  useEffect(() => {
    const anioActual = new Date().getFullYear();
    const correlativoFalso = '0001'; 
    const nuevoID = `ESAVI-${institucionSeleccionada}-${anioActual}-${correlativoFalso}`;
    setValue('idUnico', nuevoID); 
  }, [institucionSeleccionada, setValue]);

  const onSubmit = (data: any) => {
    console.log("Datos Apertura:", data);
    alert(`Expediente Oficial ${data.idUnico} creado exitosamente.`);
    
    // Redirección al expediente del caso usando el ID dinámico generado
    navigate('/caso/' + data.idUnico);
  };

  // Función auxiliar pura para arreglar el traslape de fechas y horas
  const getDateTimeSx = (hasValue: boolean) => ({
    '& input::-webkit-datetime-edit': {
      color: hasValue ? 'text.primary' : 'transparent',
    },
    '& input:focus::-webkit-datetime-edit': {
      color: 'text.primary',
    },
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 1000, margin: 'auto', pb: 8, pt: 4 }}>
      
      {/* CABECERA */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: '800', mb: 1 }}>
          Oficializar Notificación ESAVI
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fase 1: Apertura y Organización del Expediente Institucional.
        </Typography>
      </Box>

      {/* SECCIÓN 1: Identificación Oficial */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Identificación Oficial del Expediente
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Fila 1: Suma 12 */}
            <Grid item xs={12} md={6}>
              <Controller name="idUnico" control={control} render={({ field }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  label="ID Único Generado por el Sistema" 
                  disabled 
                  variant="filled" 
                  InputLabelProps={{ shrink: true }} 
                />
              )}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller name="fechaNotificacion" control={control} render={({ field }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  type="date" 
                  label="Fecha de Oficialización" 
                  required 
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                />
              )}/>
            </Grid>

            {/* Fila 2: Suma 12 */}
            <Grid item xs={12} md={4}>
              <Controller name="institucion" control={control} render={({ field }) => (
                <TextField 
                  {...field} 
                  select 
                  fullWidth 
                  label="Institución Receptora" 
                  required
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="MINSAL">MINSAL</MenuItem>
                  <MenuItem value="ISSS">ISSS</MenuItem>
                  <MenuItem value="SANIDAD_MILITAR">Sanidad Militar</MenuItem>
                </TextField>
              )}/>
            </Grid>
            <Grid item xs={12} md={8}>
              <Controller name="establecimiento" control={control} render={({ field }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  label="Nombre del Establecimiento que asume el caso" 
                  required 
                />
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* SECCIÓN 2: Convocatoria */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'secondary.main', color: 'white', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Convocatoria Inicial al Equipo Coordinador
          </Typography>
        </Box>
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Fila 1: Suma 12 */}
            <Grid item xs={12} md={6}>
              <Controller name="tipoReunion" control={control} render={({ field }) => (
                <TextField 
                  {...field} 
                  select 
                  fullWidth 
                  label="Tipo de Reunión" 
                  required
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="Virtual">Virtual (Teams/Zoom)</MenuItem>
                  <MenuItem value="Presencial">Presencial</MenuItem>
                </TextField>
              )}/>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller name="fechaReunion" control={control} render={({ field }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  type="datetime-local" 
                  label="Fecha y Hora Propuesta" 
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                />
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* BOTONES DE ACCIÓN */}
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          color="inherit" 
          size="large" 
          onClick={() => navigate(-1)}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="secondary" 
          size="large" 
          startIcon={<SendIcon />}
          sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
        >
          Oficializar Expediente
        </Button>
      </Box>

    </Box>
  );
}