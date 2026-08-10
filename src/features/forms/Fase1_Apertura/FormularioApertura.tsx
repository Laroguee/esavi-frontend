import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCasesStore } from '../../../store/useCasesStore';

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
    if (!val) return false;
    const fechaIngresada = new Date(val).getTime();
    const ahora = new Date().getTime();
    return fechaIngresada >= (ahora - 60000); 
  }, {
    message: "La fecha y hora de la reunión no puede ser en el pasado"
  }),
});

type AperturaFormValues = z.infer<typeof aperturaSchema>;

export default function FormularioApertura() {
  const navigate = useNavigate();
  const [anexoFile, setAnexoFile] = useState<File | null>(null);

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

  const { agendarReunion } = useCasesStore();

  const onSubmit = (data: AperturaFormValues) => {
    console.log("Datos Apertura:", data);
    if (anexoFile) {
      console.log("Archivo adjunto preparado para envío:", anexoFile.name);
    }

    const [fechaStr, horaStr] = data.fechaReunion.split('T');

    agendarReunion(data.idUnico, {
      id: Date.now().toString(),
      tema: "Convocatoria Inicial al Equipo Coordinador",
      faseRelacionada: "Fase 2",
      fecha: fechaStr || '',
      hora: horaStr || '',
      convocados: [],
      estado: 'PROGRAMADA',
      modalidad: data.tipoReunion as 'Virtual' | 'Presencial',
      enlaceOLugar: 'Pendiente de asignar'
    });

    alert(`Expediente Oficial ${data.idUnico} creado exitosamente.`);
    navigate('/caso/' + data.idUnico);
  };

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
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="idUnico" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  label="ID Único Generado por el Sistema" 
                  disabled 
                  variant="filled" 
                  slotProps={{ inputLabel: { shrink: true } }} 
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="fechaNotificacion" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  type="date" 
                  label="Fecha de Oficialización" 
                  required 
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={getDateTimeSx(!!field.value)}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}/>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
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
            <Grid size={{ xs: 12, md: 8 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
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

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller name="fechaReunion" control={control} render={({ field, fieldState }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  type="datetime-local" 
                  label="Fecha y Hora Propuesta" 
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={getDateTimeSx(!!field.value)}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}/>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* SECCIÓN 3: Documentación Base */}
      <Paper elevation={2} sx={{ mb: 4, borderRadius: 2, border: '1px dashed', borderColor: 'info.main', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'info.light', py: 1.5, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
            Documentación Base
          </Typography>
        </Box>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Adjunte la presentación llena del Anexo II como respaldo primario del expediente.
          </Typography>
          <Button 
            component="label" 
            variant="contained" 
            color="info" 
            startIcon={<UploadFileIcon />}
            size="large"
            sx={{ px: 4 }}
          >
            Adjuntar Anexo II Escaneado
            <input 
              type="file" 
              hidden 
              accept=".pdf,image/*" 
              onChange={(e) => setAnexoFile(e.target.files?.[0] || null)} 
            />
          </Button>
          
          {anexoFile && (
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold', color: 'success.main' }}>
              ✓ Archivo seleccionado: {anexoFile.name}
            </Typography>
          )}
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