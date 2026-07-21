import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// =======================================================
// ESQUEMA ESTRICTO DE ZOD
// =======================================================
const aperturaSchema = z.object({
  idUnico: z.string().min(1, "Campo obligatorio"),
  fechaNotificacion: z.string().min(1, "La fecha de oficialización es obligatoria"),
  institucion: z.string().min(1, "Campo obligatorio"),
  establecimiento: z.string().min(5, "El nombre del establecimiento debe tener al menos 5 caracteres"),
  tipoReunion: z.string().min(1, "Campo obligatorio"),
  fechaReunion: z.string().min(1, "Campo obligatorio").refine((val) => {
    // Validamos que la fecha ingresada no sea menor a la fecha/hora actual
    if (!val) return false;
    const fechaIngresada = new Date(val).getTime();
    const ahora = new Date().getTime();
    // Damos un margen de tolerancia de 1 minuto por si llenan la hora exacta actual
    return fechaIngresada >= (ahora - 60000); 
  }, {
    message: "La fecha y hora de la reunión no puede ser en el pasado"
  }),
});

// Inferimos los tipos TypeScript a partir del esquema
type AperturaFormValues = z.infer<typeof aperturaSchema>;

export default function FormularioApertura() {
  const navigate = useNavigate();

  // Inyectamos el resolver de Zod a React-Hook-Form
  const { control, handleSubmit, watch, setValue } = useForm<AperturaFormValues>({
    resolver: zodResolver(aperturaSchema),
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

  const onSubmit = (data: AperturaFormValues) => {
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
              <Controller name="idUnico" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  label="ID Único Generado por el Sistema" 
                  disabled 
                  variant="filled" 
                  InputLabelProps={{ shrink: true }} 
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}/>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller name="fechaNotificacion" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  type="date" 
                  label="Fecha de Oficialización" 
                  required 
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}/>
            </Grid>

            {/* Fila 2: Suma 12 */}
            <Grid item xs={12} md={4}>
              <Controller name="institucion" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  select 
                  fullWidth 
                  label="Institución Receptora" 
                  required
                  sx={{ minWidth: 160 }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  <MenuItem value="MINSAL">MINSAL</MenuItem>
                  <MenuItem value="ISSS">ISSS</MenuItem>
                  <MenuItem value="SANIDAD_MILITAR">Sanidad Militar</MenuItem>
                </TextField>
              )}/>
            </Grid>
            <Grid item xs={12} md={8}>
              <Controller name="establecimiento" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  label="Nombre del Establecimiento que asume el caso" 
                  required 
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
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
              <Controller name="tipoReunion" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  select 
                  fullWidth 
                  label="Tipo de Reunión" 
                  required
                  sx={{ minWidth: 160 }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  <MenuItem value="Virtual">Virtual (Teams/Zoom)</MenuItem>
                  <MenuItem value="Presencial">Presencial</MenuItem>
                </TextField>
              )}/>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller name="fechaReunion" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  type="datetime-local" 
                  label="Fecha y Hora Propuesta" 
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={getDateTimeSx(!!field.value)}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
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