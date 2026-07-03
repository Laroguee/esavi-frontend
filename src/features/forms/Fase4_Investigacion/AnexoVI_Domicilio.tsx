import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useNavigate } from 'react-router-dom';

export default function AnexoVI_Domicilio() {
  const navigate = useNavigate();

  const { control, handleSubmit } = useForm({
    defaultValues: {
      // Encabezado Automático
      idUnico: 'ESAVI-MINSAL-2025-001', horaInicio: '', horaFin: '', fechaVisita: '',
      
      // FASE I: Observación Comunidad
      obs_acceso: '', nota_acceso: '',
      obs_ambiental: '', nota_ambiental: '',
      obs_infra: '', nota_infra: '',
      obs_socioEco: '', nota_socioEco: '',
      obs_recursosSalud: '', nota_recursosSalud: '',
      obs_costumbres: '', nota_costumbres: '',
      obs_comercio: '', nota_comercio: '',
      obs_drogas: '', nota_drogas: '',
      obs_percepcionVacuna: '', nota_percepcionVacuna: '',
      obs_rumores: '', nota_rumores: '',
      obs_seguridad: '', nota_seguridad: '',

      // FASE II: Entrevista y Domicilio
      entrevista_evolucion: '', entrevista_antecedentes: '', entrevista_vacunacion: '',
      entrevista_laboral: '', entrevista_extraLaboral: '', entrevista_exposicion: '', entrevista_casosAdicionales: '',
      
      // Checklist Domicilio
      dom_vivienda: '', dom_higiene: '', dom_familiar: '', dom_ambiental: '',
      dom_acceso: '', dom_evidencia: '', dom_almacenMedicina: '', dom_percepcionFamilia: ''
    }
  });

  const onSubmit = (data: any) => {
    console.log("Anexo VI Guardado:", data);
    alert("Guía Domiciliaria (Anexo VI) guardada exitosamente.");
    navigate(-1);
  };

  // Componente reutilizable para las tablas de riesgo
  const RowRiesgo = ({ nameSelect, nameText, titulo, ayuda }: any) => (
    <Grid container spacing={3} sx={{ mb: 3, pb: 2, borderBottom: '1px solid #eee' }}>
      <Grid item xs={12} md={4}>
        <Typography variant="subtitle2" fontWeight="bold">{titulo}</Typography>
        <Typography variant="caption" color="text.secondary">{ayuda}</Typography>
      </Grid>
      <Grid item xs={12} md={3}>
        <Controller name={nameSelect} control={control} render={({ field }) => (
          <TextField {...field} select fullWidth label="Estado" size="small" InputLabelProps={{ shrink: true }}>
            <MenuItem value="Sin Riesgo">Sin Riesgo</MenuItem>
            <MenuItem value="Riesgo Detectado">⚠️ RIESGO DETECTADO</MenuItem>
          </TextField>
        )}/>
      </Grid>
      <Grid item xs={12} md={5}>
        <Controller name={nameText} control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Notas / Hallazgos" size="small" InputLabelProps={{ shrink: true }} />
        )}/>
      </Grid>
    </Grid>
  );

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1000, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo VI: Investigación Domiciliaria y Comunitaria
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
      </Box>

      {/* ENCABEZADO DE AUDITORÍA */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Controller name="idUnico" control={control} render={({ field }) => <TextField {...field} fullWidth label="ID ESAVI" disabled variant="filled" InputLabelProps={{ shrink: true }} />} />
          </Grid>
          <Grid item xs={12} md={4}>
             <Controller name="fechaVisita" control={control} render={({ field }) => <TextField {...field} fullWidth type="date" label="Fecha de la visita" InputLabelProps={{ shrink: true }} focused />} />
          </Grid>
          <Grid item xs={12} md={2}>
             <Controller name="horaInicio" control={control} render={({ field }) => <TextField {...field} fullWidth type="time" label="Hora Inicio" InputLabelProps={{ shrink: true }} focused />} />
          </Grid>
          <Grid item xs={12} md={2}>
             <Controller name="horaFin" control={control} render={({ field }) => <TextField {...field} fullWidth type="time" label="Hora Fin" InputLabelProps={{ shrink: true }} focused />} />
          </Grid>
        </Grid>
      </Paper>

      {/* FASE I: OBSERVACIÓN COMUNITARIA */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Fase I. Observación de la Comunidad</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Identifique factores ambientales, sociales o de acceso que puedan estar relacionados con el evento.
        </Typography>

        <RowRiesgo nameSelect="obs_acceso" nameText="nota_acceso" titulo="Accesibilidad geográfica" ayuda="Distancia al centro de salud, caminos." />
        <RowRiesgo nameSelect="obs_ambiental" nameText="nota_ambiental" titulo="Condiciones ambientales" ayuda="Inundaciones, basura, vectores." />
        <RowRiesgo nameSelect="obs_infra" nameText="nota_infra" titulo="Infraestructura y servicios" ayuda="Agua potable, electricidad, saneamiento." />
        <RowRiesgo nameSelect="obs_socioEco" nameText="nota_socioEco" titulo="Condiciones socioeconómicas" ayuda="Tipología de viviendas, hacinamiento." />
        <RowRiesgo nameSelect="obs_comercio" nameText="nota_comercio" titulo="Comercio y actividad económica" ayuda="Comercio inseguro, agricultura familiar." />
        <RowRiesgo nameSelect="obs_percepcionVacuna" nameText="nota_percepcionVacuna" titulo="Percepción sobre la vacunación" ayuda="Rumores, creencias de la comunidad." />
      </Paper>

      {/* FASE II: ENTREVISTA */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderLeft: '5px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom>Fase II. Entrevista a Persona Afectada o Familia</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Agrupe las respuestas por categoría. (Separe las ideas usando un salto de línea).
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">A. Sobre el evento y su evolución</Typography>
            <Controller name="entrevista_evolucion" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={3} placeholder="Describa qué hacía antes, cuándo inició el malestar y la evolución..." />
            )}/>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">B. Antecedentes Personales</Typography>
            <Controller name="entrevista_antecedentes" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={3} placeholder="Enfermedades previas, medicamentos actuales, uso de medicina natural..." />
            )}/>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">C. Ocupación y Exposiciones</Typography>
            <Controller name="entrevista_laboral" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={3} placeholder="Trabajo actual, exposición a químicos, metales, humo, leña..." />
            )}/>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">D. Contexto familiar y casos adicionales</Typography>
            <Controller name="entrevista_casosAdicionales" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={2} placeholder="¿Alguien más está enfermo? ¿Hubo eventos masivos recientes?..." />
            )}/>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* OBSERVACIÓN DIRECTA EN DOMICILIO */}
        <Typography variant="h6" color="primary" gutterBottom>Observación directa en el domicilio</Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Controller name="dom_vivienda" control={control} render={({ field }) => <TextField {...field} fullWidth label="Condiciones de la vivienda" size="small" InputLabelProps={{ shrink: true }} />} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="dom_higiene" control={control} render={({ field }) => <TextField {...field} fullWidth label="Condiciones de higiene" size="small" InputLabelProps={{ shrink: true }} />} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="dom_almacenMedicina" control={control} render={({ field }) => <TextField {...field} fullWidth label="Almacenamiento de medicinas/hierbas" size="small" InputLabelProps={{ shrink: true }} />} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="dom_percepcionFamilia" control={control} render={({ field }) => <TextField {...field} fullWidth label="Percepción de la familia sobre vacunación" size="small" InputLabelProps={{ shrink: true }} />} />
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN FOTOS */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: '#f4f6f8' }}>
        <CameraAltIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h6" gutterBottom>Evidencia Fotográfica y Documental</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Fotografíe el carnet de vacunación, recetas médicas o entorno ambiental.
        </Typography>
        <Button variant="contained" component="label" color="secondary" size="large">
          TOMAR FOTO / SUBIR ARCHIVO
          <input type="file" hidden multiple accept="image/*,.pdf" capture="environment" />
        </Button>
      </Paper>

      <Box sx={{ textAlign: 'right' }}>
        <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} size="large">
          Finalizar y Guardar Anexo VI
        </Button>
      </Box>

    </Box>
  );
}