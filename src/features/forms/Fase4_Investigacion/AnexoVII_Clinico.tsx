import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, FormControlLabel, Switch, Collapse, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate } from 'react-router-dom';

export default function AnexoVII_Clinico() {
  const navigate = useNavigate();
  // Estado para mostrar u ocultar las preguntas de embarazo
  const [esMujerFertil, setEsMujerFertil] = useState(false);

  // Simulamos que el sistema PRE-LLENA estos datos automáticamente desde la BD
  const { control, handleSubmit } = useForm({
    defaultValues: {
      idUnico: 'EPI-2025-001', // Bloqueado
      lugarVacunacion: 'Intramural – Puesto fijo', // Bloqueado
      estadoPaciente: '',
      diagnosticoFinal: '',
      resumenClinico: '',
      embarazada: 'No',
      semanasGestacion: '',
    }
  });

  const onSubmit = (data: any) => {
    console.log("Anexo Clínico Guardado:", data);
    alert("Evaluación Clínica Guardada Exitosamente.");
    navigate(-1);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1000, margin: 'auto', pb: 5 }}>
      
      <Typography variant="h5" color="primary" sx={{ mb: 3, fontWeight: 'bold' }}>
        Anexo VII: Evaluación Clínica del ESAVI
      </Typography>

      {/* SECCIÓN A: INFORMACIÓN BÁSICA (PRE-LLENADA Y BLOQUEADA) */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderLeft: '5px solid', borderColor: 'info.main' }}>
        <Typography variant="h6" gutterBottom>Sección A. Información Básica (Autocompletada)</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller name="idUnico" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="ID del ESAVI" disabled variant="filled" />
            )}/>
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="lugarVacunacion" control={control} render={({ field }) => (
              <TextField {...field} fullWidth label="Lugar de Vacunación" disabled variant="filled" />
            )}/>
          </Grid>
          {/* Tabla de Equipo Simulada */}
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              * El sistema ha detectado que eres el Investigador Clínico asignado: Dr. Juan Pérez (juan@minsal.gob.sv).
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN B: ESTADO DEL PACIENTE */}
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Sección B. Estado Actual y Antecedentes</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller name="estadoPaciente" control={control} render={({ field }) => (
              <TextField {...field} select fullWidth label="Estado de la persona en el momento de la investigación">
                <MenuItem value="En recuperación">En recuperación / resolviendo</MenuItem>
                <MenuItem value="Recuperado">Recuperado / resuelto</MenuItem>
                <MenuItem value="Recuperado con secuelas">Recuperado con secuelas</MenuItem>
                <MenuItem value="Fallecido">Fallecido</MenuItem>
              </TextField>
            )}/>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* LÓGICA CONDICIONAL: PREGUNTAS DE MUJERES */}
        <FormControlLabel 
          control={<Switch checked={esMujerFertil} onChange={(e) => setEsMujerFertil(e.target.checked)} color="secondary" />} 
          label={<Typography fontWeight="bold" color="secondary.main">Activar preguntas para mujeres (12 a 50 años / sospecha embarazo)</Typography>} 
        />
        
        <Collapse in={esMujerFertil}>
          <Box sx={{ p: 3, mt: 2, bgcolor: '#fff8e1', borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller name="embarazada" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth label="¿Estaba embarazada al vacunarse?">
                    <MenuItem value="Sí">Sí</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="No Sabe">No Sabe</MenuItem>
                  </TextField>
                )}/>
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller name="semanasGestacion" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth type="number" label="Semanas de gestación (1-42)" />
                )}/>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* SECCIÓN C: EVIDENCIA CLÍNICA Y LABORATORIOS */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderLeft: '5px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" gutterBottom>Sección C. Resumen Clínico y Paraclínico</Typography>
        
        <Controller name="resumenClinico" control={control} render={({ field }) => (
          <TextField {...field} fullWidth multiline rows={4} label="Resumen de datos clínicos y laboratorios" placeholder="Redacte aquí los hallazgos principales..." sx={{ mb: 3 }} />
        )}/>

        <Controller name="diagnosticoFinal" control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Diagnóstico final o presuntivo" sx={{ mb: 3 }} />
        )}/>

        <Box sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#fafafa' }}>
          <Typography variant="body1" gutterBottom>Adjuntar Evidencia (Exámenes, Epicrisis, Fotos)</Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Permite tomar fotos directas desde el celular o subir PDFs (Máx 10MB)
          </Typography>
          <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
            Subir Archivo / Tomar Foto
            <input type="file" hidden accept="image/*,.pdf" capture="environment" />
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />}>
          Guardar Evaluación Clínica
        </Button>
      </Box>

    </Box>
  );
}