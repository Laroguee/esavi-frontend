import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Chip } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useParams } from 'react-router-dom';
import { useCasesStore } from '../../store/useCasesStore';

interface FormDataCausalidad {
  clasificacionFinal: string;
  justificacionCausalidad: string;
  recomendaciones: string;
  firmado: boolean;
}

export default function DictamenCausalidad() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { avanzarCaso, casos } = useCasesStore();
  
  const casoActual = casos.find(c => c.id === id);

  const { control, handleSubmit } = useForm<FormDataCausalidad>({
    defaultValues: {
      clasificacionFinal: '',
      justificacionCausalidad: '',
      recomendaciones: '',
      firmado: false
    }
  });

  const onSubmit = (data: FormDataCausalidad) => {
    console.log("Acta de Causalidad:", data);
    
    if (id) {
      avanzarCaso(id, 'CERRADO_DICTAMINADO', 'Cerrado', 'Dictamen de causalidad emitido por el comité.');
    }
    
    alert("Dictamen Final Guardado. El caso ESAVI ha sido CERRADO OFICIALMENTE.");
    navigate('/bandeja-comite');
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1000, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Fase 6: Comité Nacional de Vacunación Segura
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Volver</Button>
      </Box>

      {/* ÁREA DE LECTURA */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, bgcolor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>Expediente {id}</Typography>
          <Chip label="APROBADO POR SECRETARIADO" color="success" icon={<CheckCircleIcon />} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Revise los informes de la investigación de campo antes de emitir su dictamen.
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button fullWidth variant="outlined" startIcon={<FileDownloadIcon />}>Ver Anexo VII (Clínico)</Button>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button fullWidth variant="outlined" startIcon={<FileDownloadIcon />}>Ver Anexo V (Puesto Vacuna)</Button>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button fullWidth variant="outlined" startIcon={<FileDownloadIcon />}>Ver Anexo VI (Domiciliario)</Button>
          </Grid>
          <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
            <Button fullWidth variant="outlined" color="secondary" startIcon={<FileDownloadIcon />}>
              Descargar Evidencias (Fotos y Laboratorios)
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ÁREA DE DICTAMEN */}
      <Paper elevation={3} sx={{ p: 4, borderTop: '5px solid', borderColor: 'primary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GavelIcon /> Acta de Causalidad Final
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Clasificación Final de Causalidad (OMS)</Typography>
            <Controller name="clasificacionFinal" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth variant="filled" sx={{ bgcolor: '#e8eaf6' }}>
                <MenuItem value="A1">A1. Reacción relacionada con el producto de la vacuna</MenuItem>
                <MenuItem value="A2">A2. Reacción relacionada con un defecto de calidad de la vacuna</MenuItem>
                <MenuItem value="A3">A3. Reacción relacionada con un error de inmunización</MenuItem>
                <MenuItem value="A4">A4. Reacción relacionada con ansiedad por la inmunización</MenuItem>
                <MenuItem value="B1">B1. Relación temporal congruente pero sin evidencia de causalidad</MenuItem>
                <MenuItem value="C">C. Causalidad Inconsistente (Condición coincidente)</MenuItem>
                <MenuItem value="D">D. Inclasificable (Falta información)</MenuItem>
              </TextField>
            )}/>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Justificación Clínica y Epidemiológica del Dictamen</Typography>
            <Controller name="justificacionCausalidad" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={5} placeholder="Redacte aquí la conclusión final del comité..." />
            )}/>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Recomendaciones y Acciones a tomar</Typography>
            <Controller name="recomendaciones" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={3} placeholder="Ej: Capacitar al personal en cadena de frío..." />
            )}/>
          </Grid>
        </Grid>

        <Box sx={{ mt: 5, p: 3, bgcolor: '#fff3e0', borderRadius: 2, textAlign: 'center' }}>
           <Typography variant="body2" color="warning.dark" sx={{ fontWeight: 'bold', mb: 2 }}>
             * DECLARACIÓN DE CONFIDENCIALIDAD Y CONFLICTO DE INTERÉS
           </Typography>
           <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
             Al hacer clic en el botón de cierre, el Comité certifica haber revisado la evidencia sin conflictos de interés y dictamina la causalidad oficial del evento. Este caso no podrá ser modificado posteriormente.
           </Typography>
           <Button type="submit" variant="contained" color="primary" startIcon={<GavelIcon />} size="large">
              DICTAMINAR Y CERRAR CASO
           </Button>
        </Box>
      </Paper>

    </Box>
  );
}