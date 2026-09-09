import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Chip, CircularProgress } from '@mui/material';
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
  const { casos, avanzarCaso } = useCasesStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<FormDataCausalidad>({
    defaultValues: {
      clasificacionFinal: '',
      justificacionCausalidad: '',
      recomendaciones: '',
      firmado: false
    }
  });

  const onSubmit = async (data: FormDataCausalidad) => {
    setIsSubmitting(true);
    try {
      console.log("Acta de Causalidad:", data);
      
      if (id) {
        await avanzarCaso(id, 'CERRADO_DICTAMINADO', 'Cerrado', 'Dictamen de causalidad emitido por el comité.', undefined, data);
      }
      
      alert("Dictamen Final Guardado. El caso ESAVI ha sido CERRADO OFICIALMENTE.");
      navigate('/bandeja-comite');
    } catch (error) {
      console.error("Error cerrando el caso:", error);
      alert("Hubo un error al guardar el dictamen. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id) {
    const casosCerrados = casos.filter(c => 
      c.estadoFlujo === 'CERRADO_DICTAMINADO' || 
      c.estadoFlujo === 'DICTAMINADO' || 
      c.estadoFlujo === 'CERRADO'
    );

    return (
      <Box sx={{ maxWidth: 1000, margin: 'auto', pb: 8 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
          Historial de Dictámenes Emitidos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Lista de casos ESAVI que ya han sido dictaminados y cerrados oficialmente por el Comité Nacional de Vacunación Segura.
        </Typography>

        <Paper elevation={2} sx={{ p: 4, mb: 4, bgcolor: '#f8f9fa' }}>
           {casosCerrados.length === 0 ? (
             <Typography color="text.secondary">No hay casos cerrados por el comité actualmente.</Typography>
           ) : (
             <Grid container spacing={2}>
               {casosCerrados.map(caso => (
                 <Grid size={{ xs: 12, md: 6 }} key={caso.id}>
                    <Paper elevation={1} sx={{ p: 3, borderLeft: '5px solid', borderColor: 'primary.main' }}>
                       <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>{caso.id}</Typography>
                       <Typography variant="body2" sx={{ mt: 1 }}><strong>Paciente:</strong> {caso.paciente}</Typography>
                       <Typography variant="body2"><strong>Vacuna:</strong> {caso.vacuna}</Typography>
                       <Typography variant="body2">
                         <strong>Institución Gestora:</strong> {caso.id_creador?.includes('isss') ? 'ISSS' : (caso.id_creador?.includes('minsal') ? 'MINSAL' : (caso.establecimiento.toUpperCase().includes('ISSS') ? 'ISSS' : 'MINSAL'))}
                       </Typography>
                       <Typography variant="body2"><strong>Establecimiento Notificador:</strong> {caso.establecimiento}</Typography>
                       <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                         Fecha de Notificación: {caso.fecha}
                       </Typography>
                       
                       {/* Opcional: El botón por ahora puede llevar al detalle general del caso ya que no se persisten los datos del formulario */}
                       <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => navigate(`/caso/${caso.id}`)}>
                         Ver Expediente del Caso
                       </Button>
                    </Paper>
                 </Grid>
               ))}
             </Grid>
           )}
        </Paper>
      </Box>
    );
  }

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
            <Button fullWidth variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => navigate(`/anexo-clinico/${id}?mode=view`)}>Ver Anexo VII (Clínico)</Button>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button fullWidth variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => navigate(`/anexo-puesto/${id}?mode=view`)}>Ver Anexo V (Puesto Vacuna)</Button>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button fullWidth variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => navigate(`/anexo-domicilio/${id}?mode=view`)}>Ver Anexo VI (Domiciliario)</Button>
          </Grid>
          <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
            <Button fullWidth variant="outlined" color="secondary" startIcon={<FileDownloadIcon />} onClick={() => navigate(`/caso/${id}/expediente`)}>
              Ir al Gestor de Evidencias (Fotos y Laboratorios)
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
           <Button type="submit" variant="contained" color="primary" startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <GavelIcon />} size="large" disabled={isSubmitting}>
              {isSubmitting ? 'GUARDANDO DICTAMEN...' : 'DICTAMINAR Y CERRAR CASO'}
           </Button>
        </Box>
      </Paper>

    </Box>
  );
}