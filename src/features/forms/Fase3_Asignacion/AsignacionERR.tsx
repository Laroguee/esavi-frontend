import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider } from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useParams } from 'react-router-dom';

// --- MOCK DATA: Personal disponible por área ---
const personalFarma = ['Dr. Mario Gómez', 'Dra. Elena Ramos', 'Dr. Roberto Cruz'];
const personalInmuno = ['Lic. Karla Fuentes', 'Lic. Tomás Díaz', 'Enf. Patricia Silva'];
const personalEpi = ['Dr. Armando Solis', 'Dra. Beatriz Vega', 'Dr. César Pineda'];

export default function AsignacionERR() {
  const { id } = useParams(); // Rescatamos el ID del caso de la URL
  const navigate = useNavigate();

  const { control, handleSubmit } = useForm({
    defaultValues: {
      farmacovigilancia: '',
      inmunizaciones: '',
      epidemiologia: '',
      instrucciones: ''
    }
  });

  const onSubmit = (data: any) => {
    console.log("Asignación de Equipo ERR:", data);
    alert(`Equipo de Respuesta Rápida asignado exitosamente al caso ${id}. Se enviarán notificaciones al personal.`);
    
    // Regresa al expediente central
    navigate('/caso/' + id);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 800, margin: 'auto', pb: 8, pt: 2 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Fase 3: Asignación de ERR
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/caso/' + id)}>
          Cancelar
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 4, borderColor: '#e0e0e0', borderTop: '4px solid', borderTopColor: 'primary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
          <GroupAddIcon /> Selección de Personal Investigador
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Designe al personal que conformará el Equipo de Respuesta Rápida (ERR) local para el caso <strong>{id}</strong>.
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Farmacovigilancia (Clínico)</Typography>
            <Controller name="farmacovigilancia" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth size="small" label="Seleccione Referente Clínico" required>
                {personalFarma.map((nombre) => (
                  <MenuItem key={nombre} value={nombre}>{nombre}</MenuItem>
                ))}
              </TextField>
            )}/>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Inmunizaciones (Puesto de Vacunación)</Typography>
            <Controller name="inmunizaciones" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth size="small" label="Seleccione Referente de Inmunizaciones" required>
                {personalInmuno.map((nombre) => (
                  <MenuItem key={nombre} value={nombre}>{nombre}</MenuItem>
                ))}
              </TextField>
            )}/>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Epidemiología (Trabajo de Campo)</Typography>
            <Controller name="epidemiologia" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth size="small" label="Seleccione Referente Epidemiológico" required>
                {personalEpi.map((nombre) => (
                  <MenuItem key={nombre} value={nombre}>{nombre}</MenuItem>
                ))}
              </TextField>
            )}/>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Instrucciones especiales para el equipo</Typography>
            <Controller name="instrucciones" control={control} render={({ field }) => (
              <TextField 
                {...field} 
                fullWidth 
                multiline 
                rows={3} 
                size="small" 
                placeholder="Ej. Priorizar visita comunitaria debido a rumores en la zona..." 
              />
            )}/>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button variant="contained" color="secondary" type="submit" size="large" startIcon={<SaveIcon />}>
          Confirmar Asignación
        </Button>
      </Box>

    </Box>
  );
}