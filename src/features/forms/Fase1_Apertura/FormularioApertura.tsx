import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';

export default function FormularioApertura() {
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
    console.log("Datos:", data);
    alert(`Expediente ${data.idUnico} creado exitosamente.`);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 1000, margin: 'auto' }}>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: 'bold' }}>
          Fase 1: Apertura y Organización del Expediente
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
                <TextField {...field} fullWidth type="date" label="Fecha de Notificación" InputLabelProps={{ shrink: true }} required />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller name="institucion" control={control} render={({ field }) => (
                <TextField {...field} select fullWidth label="Institución" InputLabelProps={{ shrink: true }} required>
                  <MenuItem value="MINSAL">MINSAL</MenuItem>
                  <MenuItem value="ISSS">ISSS</MenuItem>
                  <MenuItem value="SANIDAD_MILITAR">Sanidad Militar</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller name="establecimiento" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Nombre del Establecimiento" InputLabelProps={{ shrink: true }} required />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4, borderTop: '4px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" color="primary" sx={{ mb: 3, fontWeight: 'bold' }}>
          Convocatoria al Equipo Coordinador
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
        <Button variant="outlined" color="primary">Guardar Borrador</Button>
        <Button type="submit" variant="contained" color="secondary" startIcon={<SendIcon />}>Crear y Convocar</Button>
      </Box>

    </Box>
  );
}