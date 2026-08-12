import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Alert, Checkbox, FormControlLabel } from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useParams } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';

// --- MOCK DATA: Personal disponible por área ---
const personalFarma = [
  { nombre: 'Médico Clínico', email: 'medico.ss@minsal.gob.sv' }
];
const personalInmuno = [
  { nombre: 'Personal de Enfermería', email: 'inmuno.puesto@minsal.gob.sv' }
];
const personalEpi = [
  { nombre: 'Epidemiólogo Local', email: 'epidemio.local@minsal.gob.sv' }
];

export default function AsignacionERR() {
  const { id } = useParams(); // Rescatamos el ID del caso de la URL
  const navigate = useNavigate();
  const avanzarCaso = useCasesStore(state => state.avanzarCaso);
  const asignarMiembrosERR = useCasesStore(state => state.asignarMiembrosERR);
  const casoActual = useCasesStore(state => state.casos.find(c => c.id === id));

  const [chkReporte, setChkReporte] = useState(false);
  const esRiesgoAlto = casoActual?.riesgo === 'Alto' || casoActual?.riesgo === 'Crítico';

  const { control, handleSubmit } = useForm({
    defaultValues: {
      farmacovigilancia: '',
      inmunizaciones: '',
      epidemiologia: '',
      instrucciones: ''
    }
  });

  const onSubmit = (data: any) => {
    if (id) {
      // Guardar el equipo asignado en el estado global (como arreglo de correos)
      const miembrosSeleccionados = [data.farmacovigilancia, data.inmunizaciones, data.epidemiologia].filter(Boolean);
      asignarMiembrosERR(id, miembrosSeleccionados);

      const msg = 'Equipo de Respuesta Rápida asignado. Comienza la investigación de campo.';
      avanzarCaso(id, 'EN_INVESTIGACION', 'Fase 4: Investigación', msg);
      navigate('/caso/' + id);
    }
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
                {personalFarma.map((persona) => (
                  <MenuItem key={persona.email} value={persona.email}>{persona.nombre}</MenuItem>
                ))}
              </TextField>
            )}/>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Inmunizaciones (Puesto de Vacunación)</Typography>
            <Controller name="inmunizaciones" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth size="small" label="Seleccione Referente de Inmunizaciones" required>
                {personalInmuno.map((persona) => (
                  <MenuItem key={persona.email} value={persona.email}>{persona.nombre}</MenuItem>
                ))}
              </TextField>
            )}/>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Epidemiología (Trabajo de Campo)</Typography>
            <Controller name="epidemiologia" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth size="small" label="Seleccione Referente Epidemiológico" required>
                {personalEpi.map((persona) => (
                  <MenuItem key={persona.email} value={persona.email}>{persona.nombre}</MenuItem>
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

      {esRiesgoAlto && (
        <Alert severity="warning" sx={{ mt: 3, p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
            ATENCIÓN: Nivel de Riesgo {casoActual?.riesgo.toUpperCase()} (Paso 4 del POE)
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Para niveles Alto o Crítico es obligatorio elaborar y notificar un Reporte de Situación antes de movilizar al equipo. Por favor súbalo al Gestor de Evidencias.
          </Typography>
          <FormControlLabel 
            control={<Checkbox checked={chkReporte} onChange={(e) => setChkReporte(e.target.checked)} color="warning" />} 
            label={<Typography variant="body2" fontWeight="bold">Reporte de Situación elaborado e informado a la SRS</Typography>} 
          />
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button variant="contained" color="secondary" type="submit" size="large" startIcon={<SaveIcon />} disabled={esRiesgoAlto && !chkReporte}>
          Confirmar Asignación
        </Button>
      </Box>

    </Box>
  );
}