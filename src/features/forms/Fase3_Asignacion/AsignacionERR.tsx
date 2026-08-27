import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Alert, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useParams } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';
import { useAuthStore, type MockUser } from '../../../store/useAuthStore';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { listarUsuarios } from '../../../services/adminService';
import { guardarEnSheets, registrarLog, crearNotificacion } from '../../../services/googleSheetsService';

export default function AsignacionERR() {
  const { id } = useParams(); // Rescatamos el ID del caso de la URL
  const navigate = useNavigate();
  const userEmail = useAuthStore(state => state.userEmail);
  const { establecimientos } = useCatalogStore();
  const avanzarCaso = useCasesStore(state => state.avanzarCaso);
  const asignarMiembrosERR = useCasesStore(state => state.asignarMiembrosERR);
  const agendarReunionStore = useCasesStore(state => state.agendarReunionStore);
  const casoActual = useCasesStore(state => state.casos.find(c => c.id === id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuariosBD, setUsuariosBD] = useState<MockUser[]>([]);

  useEffect(() => {
    listarUsuarios().then(res => {
      if(res.success) setUsuariosBD(res.data);
    });
  }, []);

  const [chkReporte, setChkReporte] = useState(false);
  const [checklistLogistica, setChecklistLogistica] = useState({
    c1: false, c2: false, c3: false, c4: false, c5: false, c6: false, c7: false
  });
  const isChecklistCompleto = Object.values(checklistLogistica).every(Boolean);
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

  const onSubmit = async (data: any) => {
    if (id) {
      setIsSubmitting(true);
      
      const payloadAsignacion = {
        tabla: 'ASIGNACIONES_ERR',
        datos: {
          id_asignacion: `ERR-${Date.now()}`,
          id_caso: id,
          id_clinico: data.farmacovigilancia || '',
          id_inmuno: data.inmunizaciones || '',
          id_epidemio: data.epidemiologia || '',
          instrucciones_especiales: data.instrucciones || ''
        }
      };

      if (import.meta.env.VITE_USE_API === 'true') {
        try {
          await guardarEnSheets('ASIGNACIONES_ERR', payloadAsignacion.datos);
          await registrarLog(id, userEmail || 'desconocido', 'Se asignó el Equipo de Respuesta Rápida (ERR).');
        } catch (error) {
          console.error("Error al guardar la asignación en Sheets", error);
          alert("Error de conexión con la base de datos.");
          setIsSubmitting(false);
          return;
        }
      }

      // Guardar el equipo asignado en el estado global (como arreglo de correos)
      const miembrosSeleccionados = [data.farmacovigilancia, data.inmunizaciones, data.epidemiologia].filter(Boolean);
      asignarMiembrosERR(id, miembrosSeleccionados);

      // Agendar la reunión de lineamientos automáticamente (POE)
      await agendarReunionStore(id, {
        faseRelacionada: 'Fase 3: Asignación ERR',
        fecha: new Date().toISOString().split('T')[0],
        hora: '14:00', // Valor por defecto
        tema: 'Reunión de Lineamientos previos al Trabajo de Campo',
        modalidad: 'Presencial',
        estado: 'REALIZADA',
        enlaceOLugar: 'Sede Institucional',
        convocados: miembrosSeleccionados
      });

      // Notificar a los miembros asignados
      if (import.meta.env.VITE_USE_API === 'true') {
        miembrosSeleccionados.forEach(async (miembroEmail) => {
          await crearNotificacion({
            id_caso: id,
            email_destino: miembroEmail,
            texto: `Ha sido asignado al Equipo de Respuesta Rápida (ERR) para la investigación del Caso ${id}.`
          });
        });
      }

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
                    {establecimientos.filter(e => e.activo === true || String(e.activo).toLowerCase() === 'true').map((inst) => (
                      <MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>
                    ))}
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="farmacovigilancia" control={control} render={({ field }) => {
                  const options = usuariosBD.filter(u => String(u.role).includes('ESAVI') && u.establecimiento === valores.inst_farmacovigilancia);
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
                    {establecimientos.filter(e => e.activo === true || String(e.activo).toLowerCase() === 'true').map((inst) => (
                      <MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>
                    ))}
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="inmunizaciones" control={control} render={({ field }) => {
                  const options = usuariosBD.filter(u => String(u.role).includes('INMUNO') && u.establecimiento === valores.inst_inmunizaciones);
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
                    {establecimientos.filter(e => e.activo === true || String(e.activo).toLowerCase() === 'true').map((inst) => (
                      <MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>
                    ))}
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller name="epidemiologia" control={control} render={({ field }) => {
                  const options = usuariosBD.filter(u => String(u.role).includes('EPIDEMIO') && u.establecimiento === valores.inst_epidemiologia);
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
            label={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>Reporte de Situación elaborado e informado a la SRS</Typography>} 
          />
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 4, mt: 3, borderColor: '#e0e0e0', borderTop: '4px solid', borderTopColor: 'secondary.main' }}>
        <Typography variant="h6" color="secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
          Anexo III: Checklist de Logística de Campo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Según el POE, es obligatorio validar los siguientes 7 puntos antes de movilizar al equipo de campo.
        </Typography>
        
        <FormGroup sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel control={<Checkbox checked={checklistLogistica.c1} onChange={(e) => setChecklistLogistica(p => ({...p, c1: e.target.checked}))} />} label="1. Identificada la zona geográfica, condiciones y riesgos de seguridad." />
          <FormControlLabel control={<Checkbox checked={checklistLogistica.c2} onChange={(e) => setChecklistLogistica(p => ({...p, c2: e.target.checked}))} />} label="2. Establecido cronograma de actividades." />
          <FormControlLabel control={<Checkbox checked={checklistLogistica.c3} onChange={(e) => setChecklistLogistica(p => ({...p, c3: e.target.checked}))} />} label="3. Equipo adecuadamente identificado." />
          <FormControlLabel control={<Checkbox checked={checklistLogistica.c4} onChange={(e) => setChecklistLogistica(p => ({...p, c4: e.target.checked}))} />} label="4. Mecanismos de comunicación establecidos." />
          <FormControlLabel control={<Checkbox checked={checklistLogistica.c5} onChange={(e) => setChecklistLogistica(p => ({...p, c5: e.target.checked}))} />} label="5. Coordinados los medios de transporte para el equipo." />
          <FormControlLabel control={<Checkbox checked={checklistLogistica.c6} onChange={(e) => setChecklistLogistica(p => ({...p, c6: e.target.checked}))} />} label="6. Disposición de equipos electrónicos/papel necesarios." />
          <FormControlLabel control={<Checkbox checked={checklistLogistica.c7} onChange={(e) => setChecklistLogistica(p => ({...p, c7: e.target.checked}))} />} label="7. Previsión de material para tomas de muestras (si aplica) confirmada." />
        </FormGroup>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button 
          variant="contained" 
          color="secondary" 
          type="submit" 
          size="large" 
          startIcon={<SaveIcon />} 
          disabled={(esRiesgoAlto && !chkReporte) || isSubmitting || !isChecklistCompleto}
        >
          {isSubmitting ? 'Guardando...' : 'Confirmar Asignación'}
        </Button>
      </Box>

    </Box>
  );
}