import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Alert, Checkbox, FormControlLabel } from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useParams } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';
import { ESTABLECIMIENTOS_MOCK, MOCK_USERS } from '../../../store/useAuthStore';

export default function AsignacionERR() {
  const { id } = useParams(); // Rescatamos el ID del caso de la URL
  const navigate = useNavigate();
  const avanzarCaso = useCasesStore(state => state.avanzarCaso);
  const asignarMiembrosERR = useCasesStore(state => state.asignarMiembrosERR);
  const casoActual = useCasesStore(state => state.casos.find(c => c.id === id));

  const [chkReporte, setChkReporte] = useState(false);
  const esRiesgoAlto = casoActual?.riesgo === 'Alto' || casoActual?.riesgo === 'Crítico';

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      inst_farmacovigilancia: '',
      farmacovigilancia: '',
      inst_inmunizaciones: '',
      inmunizaciones: '',
      inst_epidemiologia: '',
      epidemiologia: '',
      instrucciones: ''
    }
  });

  const valores = watch();

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
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="inst_farmacovigilancia" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    select fullWidth size="small" label="Seleccione Institución"
                    onChange={(e) => {
                      field.onChange(e);
                      setValue('farmacovigilancia', '');
                    }}
                  >
                    {ESTABLECIMIENTOS_MOCK.map((inst) => (
                      <MenuItem key={inst} value={inst}>{inst}</MenuItem>
                    ))}
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="farmacovigilancia" control={control} render={({ field }) => {
                  const options = MOCK_USERS.filter(u => u.role.includes('ESAVI') && u.establecimiento === valores.inst_farmacovigilancia);
                  return (
                    <TextField {...field} select fullWidth size="small" label="Seleccione Referente Clínico" required disabled={!valores.inst_farmacovigilancia}>
                      {options.length > 0 ? options.map((persona) => (
                        <MenuItem key={persona.email} value={persona.email}>{persona.name}</MenuItem>
                      )) : (
                        <MenuItem disabled value=""><em>(No hay personal registrado)</em></MenuItem>
                      )}
                    </TextField>
                  );
                }}/>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Inmunizaciones (Puesto de Vacunación)</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="inst_inmunizaciones" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    select fullWidth size="small" label="Seleccione Institución"
                    onChange={(e) => {
                      field.onChange(e);
                      setValue('inmunizaciones', '');
                    }}
                  >
                    {ESTABLECIMIENTOS_MOCK.map((inst) => (
                      <MenuItem key={inst} value={inst}>{inst}</MenuItem>
                    ))}
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="inmunizaciones" control={control} render={({ field }) => {
                  const options = MOCK_USERS.filter(u => u.role.includes('INMUNO') && u.establecimiento === valores.inst_inmunizaciones);
                  return (
                    <TextField {...field} select fullWidth size="small" label="Seleccione Referente de Inmunizaciones" required disabled={!valores.inst_inmunizaciones}>
                      {options.length > 0 ? options.map((persona) => (
                        <MenuItem key={persona.email} value={persona.email}>{persona.name}</MenuItem>
                      )) : (
                        <MenuItem disabled value=""><em>(No hay personal registrado)</em></MenuItem>
                      )}
                    </TextField>
                  );
                }}/>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Epidemiología (Trabajo de Campo)</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="inst_epidemiologia" control={control} render={({ field }) => (
                  <TextField 
                    {...field} 
                    select fullWidth size="small" label="Seleccione Institución"
                    onChange={(e) => {
                      field.onChange(e);
                      setValue('epidemiologia', '');
                    }}
                  >
                    {ESTABLECIMIENTOS_MOCK.map((inst) => (
                      <MenuItem key={inst} value={inst}>{inst}</MenuItem>
                    ))}
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="epidemiologia" control={control} render={({ field }) => {
                  const options = MOCK_USERS.filter(u => u.role.includes('EPIDEMIO') && u.establecimiento === valores.inst_epidemiologia);
                  return (
                    <TextField {...field} select fullWidth size="small" label="Seleccione Referente Epidemiológico" required disabled={!valores.inst_epidemiologia}>
                      {options.length > 0 ? options.map((persona) => (
                        <MenuItem key={persona.email} value={persona.email}>{persona.name}</MenuItem>
                      )) : (
                        <MenuItem disabled value=""><em>(No hay personal registrado)</em></MenuItem>
                      )}
                    </TextField>
                  );
                }}/>
              </Grid>
            </Grid>
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