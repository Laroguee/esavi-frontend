import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useNavigate } from 'react-router-dom';

export default function AnexoV_PuestoVacuna() {
  const navigate = useNavigate();

  const { control, handleSubmit } = useForm({
    defaultValues: {
      idUnico: 'ESAVI-MINSAL-2025-001', nombrePuesto: '', fechaVisita: '', responsablePuesto: '',
      chk_identificacion: '', obs_identificacion: '',
      chk_documentacion: '', obs_documentacion: '',
      chk_lote: '', obs_lote: '',
      chk_aspecto: '', obs_aspecto: '',
      chk_jeringas: '', obs_jeringas: '',
      chk_tecnica: '', obs_tecnica: '',
      chk_cadenaFrio: '', obs_cadenaFrio: '',
      chk_areaFisica: '', obs_areaFisica: '',
      chk_desviaciones: '', obs_desviaciones: '',
      chk_simultaneas: '', obs_simultaneas: '',
      chk_anafilaxia: '', obs_anafilaxia: '',
      entrevista_manejo: '', entrevista_preparacion: '', entrevista_documentacion: ''
    }
  });

  const onSubmit = (data: any) => {
    console.log("Anexo V Guardado:", data);
    alert("Guía del Puesto de Vacunación (Anexo V) guardada exitosamente.");
    navigate(-1);
  };

  // Componente de fila corregido: Más espacio para el selector (md=3 en lugar de md=2)
  const CheckRow = ({ nameChk, nameObs, titulo, ayuda }: any) => (
    <Grid container spacing={3} sx={{ mb: 3, pb: 2, borderBottom: '1px solid #eee', alignItems: 'center' }}>
      <Grid item xs={12} md={4}>
        <Typography variant="subtitle2" fontWeight="bold">{titulo}</Typography>
        <Typography variant="caption" color="text.secondary">{ayuda}</Typography>
      </Grid>
      <Grid item xs={12} md={3}>
        <Controller name={nameChk} control={control} render={({ field }) => (
          <TextField {...field} select fullWidth label="Cumple" InputLabelProps={{ shrink: true }}>
            <MenuItem value="SI">SÍ</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO APLICA">N/A</MenuItem>
          </TextField>
        )}/>
      </Grid>
      <Grid item xs={12} md={5}>
        <Controller name={nameObs} control={control} render={({ field }) => (
          <TextField {...field} fullWidth label="Observaciones / Hallazgos" InputLabelProps={{ shrink: true }} />
        )}/>
      </Grid>
    </Grid>
  );

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1000, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo V: Guía de Puesto de Vacunación
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
      </Box>

      {/* ENCABEZADO CORREGIDO */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Controller name="idUnico" control={control} render={({ field }) => <TextField {...field} fullWidth label="ID ESAVI" disabled variant="filled" InputLabelProps={{ shrink: true }} />} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Controller name="nombrePuesto" control={control} render={({ field }) => <TextField {...field} fullWidth label="Nombre del Puesto / Establecimiento visitado" InputLabelProps={{ shrink: true }} />} />
          </Grid>
          
          <Grid item xs={12} md={4}>
            {/* CORRECCIÓN DE TRASLAPE: Forzamos el type="date" a que siempre flote el label */}
            <Controller name="fechaVisita" control={control} render={({ field }) => <TextField {...field} fullWidth type="date" label="Fecha de la visita" InputLabelProps={{ shrink: true }} focused />} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Controller name="responsablePuesto" control={control} render={({ field }) => <TextField {...field} fullWidth label="Nombre del Responsable del Puesto" InputLabelProps={{ shrink: true }} />} />
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN 1: CHECKLIST */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>Sección 1. Checklist de Observación Física</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Realice una revisión visual y técnica. Marque si "Cumple" y anote los hallazgos en caso de desviaciones.
        </Typography>

        <CheckRow nameChk="chk_identificacion" nameObs="obs_identificacion" titulo="Identificación del Puesto" ayuda="Tipo de puesto, condiciones básicas." />
        <CheckRow nameChk="chk_documentacion" nameObs="obs_documentacion" titulo="Documentación de vacunas" ayuda="Nombre comercial, fabricante, distribuidor." />
        <CheckRow nameChk="chk_lote" nameObs="obs_lote" titulo="Lote y Fechas" ayuda="Fabricación y vencimiento de vacuna y diluyente." />
        <CheckRow nameChk="chk_aspecto" nameObs="obs_aspecto" titulo="Aspecto del producto" ayuda="Observación macroscópica antes/después de reconstitución." />
        <CheckRow nameChk="chk_jeringas" nameObs="obs_jeringas" titulo="Dispositivos de admin." ayuda="Tipo, calidad y condiciones de uso de jeringas." />
        <CheckRow nameChk="chk_tecnica" nameObs="obs_tecnica" titulo="Técnica de vacunación" ayuda="Manipulación, administración y eliminación de residuos." />
        <CheckRow nameChk="chk_cadenaFrio" nameObs="obs_cadenaFrio" titulo="Cadena de frío" ayuda="Revisión de temperatura, registros y equipos de refrigeración." />
        <CheckRow nameChk="chk_areaFisica" nameObs="obs_areaFisica" titulo="Área física" ayuda="Limpieza, iluminación y ventilación del área de preparación." />
        <CheckRow nameChk="chk_desviaciones" nameObs="obs_desviaciones" titulo="Problemas recientes" ayuda="Dificultades de suministro o desviaciones de calidad reportadas." />
        <CheckRow nameChk="chk_simultaneas" nameObs="obs_simultaneas" titulo="Vacunaciones simultáneas" ayuda="¿Se aplicaron otras vacunas con el mismo lote ese día?" />
        <CheckRow nameChk="chk_anafilaxia" nameObs="obs_anafilaxia" titulo="Protocolo de anafilaxia" ayuda="Visibilidad del protocolo y revisión del Kit de emergencias." />
      </Paper>

      {/* SECCIÓN 2: ENTREVISTA */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderLeft: '5px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom>Sección 2. Resumen de Entrevistas al Personal</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Consolide la información obtenida al entrevistar al vacunador, supervisor o técnico de cadena de frío. (Separe las ideas con Enter).
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>A. Generalidades y Cadena de Frío</Typography>
            <Controller name="entrevista_manejo" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={3} placeholder="Resuma el flujo habitual, recepción de vacunas, control de temperatura y últimos mantenimientos..." />
            )}/>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>B. Preparación y Administración</Typography>
            <Controller name="entrevista_preparacion" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={3} placeholder="Resuma quién prepara la vacuna, cómo verifican al paciente, contraindicaciones y seguridad post-vacunación..." />
            )}/>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>C. Supervisión y Cierre</Typography>
            <Controller name="entrevista_documentacion" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={3} placeholder="Resuma cómo registran la vacunación (NOMIVAC, SISA), últimas supervisiones y dificultades..." />
            )}/>
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN 3: EVIDENCIA Y FOTOS */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: '#f4f6f8' }}>
        <CameraAltIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h6" gutterBottom>Sección 3. Documentación Fotográfica</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tome fotografías del refrigerador de vacunas, registros de temperatura o aspecto del lote (Se activará su cámara en dispositivos móviles).
        </Typography>
        <Button variant="contained" component="label" color="secondary" size="large">
          TOMAR FOTO / SUBIR ARCHIVO
          <input type="file" hidden multiple accept="image/*" capture="environment" />
        </Button>
      </Paper>

      {/* BOTÓN FINAL */}
      <Box sx={{ textAlign: 'right' }}>
        <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} size="large">
          Finalizar y Guardar Anexo V
        </Button>
      </Box>

    </Box>
  );
}