import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
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

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 1000, margin: 'auto', pb: 8, pt: 2 }}>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Oficializar Notificación ESAVI
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fase 1: Apertura y Organización del Expediente Institucional.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 4, mb: 4, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: 'bold' }}>
          Identificación Oficial del Expediente
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller name="idUnico" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="ID Único Generado por el Sistema" disabled variant="filled" InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller name="fechaNotificacion" control={control} render={({ field }) => (
                <TextField {...field} fullWidth type="date" label="Fecha de Oficialización" InputLabelProps={{ shrink: true }} required />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller name="institucion" control={control} render={({ field }) => (
                <TextField {...field} select fullWidth label="Institución Receptora" InputLabelProps={{ shrink: true }} required>
                  <MenuItem value="MINSAL">MINSAL</MenuItem>
                  <MenuItem value="ISSS">ISSS</MenuItem>
                  <MenuItem value="SANIDAD_MILITAR">Sanidad Militar</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller name="establecimiento" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Nombre del Establecimiento que asume el caso" InputLabelProps={{ shrink: true }} required />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 4, mb: 4, borderTop: '4px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: 'bold' }}>
          Convocatoria Inicial al Equipo Coordinador
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller name="tipoReunion" control={control} render={({ field }) => (
                <TextField {...field} select fullWidth label="Tipo de Reunión" InputLabelProps={{ shrink: true }} required>
                  <MenuItem value="Virtual">Virtual (Teams/Zoom)</MenuItem>
                  <MenuItem value="Presencial">Presencial</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller name="fechaReunion" control={control} render={({ field }) => (
                 <TextField {...field} fullWidth type="datetime-local" label="Fecha y Hora Propuesta" InputLabelProps={{ shrink: true }} required />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" color="primary" size="large" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" color="secondary" size="large" startIcon={<SendIcon />}>
          Oficializar Expediente
        </Button>
      </Box>

    </Box>
  );
}