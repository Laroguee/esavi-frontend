import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// =======================================================
// ESQUEMA ESTRICTO DE ZOD (Anexo V - Puesto de Vacunación)
// =======================================================
const anexoVSchema = z.object({
  idUnico: z.string().optional(),
  nombrePuesto: z.string().max(500, "Máximo 500 caracteres").optional(),
  // Regla estricta: La fecha no puede ser futura
  fechaVisita: z.string().optional().refine((val) => {
    if (!val) return true;
    const selectedDate = new Date(val);
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
    return selectedDate <= now;
  }, { message: "La fecha no puede ser futura" }),
  responsablePuesto: z.string().max(500, "Máximo 500 caracteres").optional(),

  // SECCIÓN 1: Checklist (Límites de 500 caracteres)
  s1_chk_1: z.string().optional(), s1_obs_1: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_2: z.string().optional(), s1_obs_2: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_3: z.string().optional(), s1_obs_3: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_4: z.string().optional(), s1_obs_4: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_5: z.string().optional(), s1_obs_5: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_6: z.string().optional(), s1_obs_6: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_7: z.string().optional(), s1_obs_7: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_8: z.string().optional(), s1_obs_8: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_9: z.string().optional(), s1_obs_9: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_10: z.string().optional(), s1_obs_10: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_11: z.string().optional(), s1_obs_11: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_12: z.string().optional(), s1_obs_12: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_13: z.string().optional(), s1_obs_13: z.string().max(500, "Máximo 500 caracteres").optional(),
  s1_chk_14: z.string().optional(), s1_obs_14: z.string().max(500, "Máximo 500 caracteres").optional(),

  // SECCIÓN 2: Entrevista (Límites de 500 caracteres)
  entrevista_a1: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_a2: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_a3: z.string().max(500, "Máximo 500 caracteres").optional(),
  
  entrevista_b1: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_b2: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_b3: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_b4: z.string().max(500, "Máximo 500 caracteres").optional(),
  
  entrevista_c1: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_c2: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_c3: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_c4: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_c5: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_c6: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_c7: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_c8: z.string().max(500, "Máximo 500 caracteres").optional(),
  
  entrevista_d1: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_d2: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_d3: z.string().max(500, "Máximo 500 caracteres").optional(),
  
  entrevista_e1: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_e2: z.string().max(500, "Máximo 500 caracteres").optional(),
  entrevista_e3: z.string().max(500, "Máximo 500 caracteres").optional(),
}).superRefine((data, ctx) => {
  // Regla estricta condicional del Checklist
  for (let i = 1; i <= 14; i++) {
    const chkKey = `s1_chk_${i}` as keyof typeof data;
    const obsKey = `s1_obs_${i}` as keyof typeof data;
    
    if (data[chkKey] === 'NO' && (!data[obsKey] || String(data[obsKey]).trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe justificar por qué no cumple",
        path: [obsKey]
      });
    }
  }
});

type AnexoVFormValues = z.infer<typeof anexoVSchema>;

export default function AnexoV_PuestoVacuna() {
  const navigate = useNavigate();

  const { control, handleSubmit } = useForm<AnexoVFormValues>({
    resolver: zodResolver(anexoVSchema),
    defaultValues: {
      // Encabezado
      idUnico: 'ESAVI-MINSAL-2025-001', nombrePuesto: '', fechaVisita: '', responsablePuesto: '',
      
      // SECCIÓN 1: Checklist de Observación
      s1_chk_1: '', s1_obs_1: '', s1_chk_2: '', s1_obs_2: '', s1_chk_3: '', s1_obs_3: '',
      s1_chk_4: '', s1_obs_4: '', s1_chk_5: '', s1_obs_5: '', s1_chk_6: '', s1_obs_6: '',
      s1_chk_7: '', s1_obs_7: '', s1_chk_8: '', s1_obs_8: '', s1_chk_9: '', s1_obs_9: '',
      s1_chk_10: '', s1_obs_10: '', s1_chk_11: '', s1_obs_11: '', s1_chk_12: '', s1_obs_12: '',
      s1_chk_13: '', s1_obs_13: '', s1_chk_14: '', s1_obs_14: '',

      // SECCIÓN 2: Guía de entrevista
      entrevista_a1: '', entrevista_a2: '', entrevista_a3: '',
      entrevista_b1: '', entrevista_b2: '', entrevista_b3: '', entrevista_b4: '',
      entrevista_c1: '', entrevista_c2: '', entrevista_c3: '', entrevista_c4: '', entrevista_c5: '', entrevista_c6: '', entrevista_c7: '', entrevista_c8: '',
      entrevista_d1: '', entrevista_d2: '', entrevista_d3: '',
      entrevista_e1: '', entrevista_e2: '', entrevista_e3: ''
    }
  });

  const onSubmit = (data: AnexoVFormValues) => {
    console.log("Anexo V Guardado:", data);
    alert("Guía del Puesto de Vacunación (Anexo V) guardada exitosamente.");
    navigate(-1);
  };

  const checklistItems = [
    { num: 1, elemento: 'Identificación del puesto de vacunación', detalle: 'Nombre del establecimiento, ubicación, responsable del puesto, tipo (fijo o extramuro).' },
    { num: 2, elemento: 'Documentación de las vacunas', detalle: 'Verificar nombre comercial y genérico de los productos almacenados en el refrigerador del puesto de vacunación, concentración, dosis, presentación, fabricante y distribuidor.' },
    { num: 3, elemento: 'Número de lote y fechas', detalle: 'Confirmar número de lote, fecha de fabricación y vencimiento de vacuna y diluyente.' },
    { num: 4, elemento: 'Aspecto del producto y materiales', detalle: 'Observar el aspecto macroscópico de la vacuna, diluyente y dispositivo de administración (antes y después de reconstitución, cuando sea necesario).' },
    { num: 5, elemento: 'Dispositivo de administración', detalle: 'Tipo de dispositivo, calidad, estado y condiciones de uso.' },
    { num: 6, elemento: 'Técnica de vacunación', detalle: 'Verificar procedimientos de preparación, manipulación y administración de la vacuna, así como eliminación del material utilizado.' },
    { num: 7, elemento: 'Cadena de frío', detalle: 'Revisar temperatura, registros de control, mantenimiento de equipos de refrigeración y evidencia de uso exclusivo para vacunas.' },
    { num: 8, elemento: 'Área física y condiciones ambientales', detalle: 'Observar condiciones de la sala de vacunación, área de preparación y almacenamiento, limpieza, iluminación y ventilación.' },
    { num: 9, elemento: 'Problemas recientes o desviaciones', detalle: 'Registrar dificultades recientes con el suministro de vacunas, jeringas o dispositivos.' },
    { num: 10, elemento: 'Vacunaciones simultáneas', detalle: 'Verificar en los registros del puesto de vacunación si hubo otras vacunas aplicadas el mismo día o con el mismo lote, y si existen otros casos con eventos similares.' },
    { num: 11, elemento: 'Aplicaciones extramuros', detalle: 'Si corresponde, verificar condiciones del espacio físico, transporte, almacenamiento, y cadena de frío en terreno.' },
    { num: 12, elemento: 'Medidas de seguridad y recomendaciones', detalle: 'Observe la entrevista que se realiza para identificar posibles contraindicaciones, verifique si se recomienda la observación en el puesto de vacunación posterior a la vacunación. Identifique si se entregan recomendaciones ante la aparición de un ESAVI.' },
    { num: 13, elemento: 'Protocolo de actuación en anafilaxia', detalle: 'Verifique que visibilidad y claridad del protocolo de acción ante un caso de anafilaxia. Revise el kit de anafilaxia (existencia y condiciones, vencimiento de productos).' },
    { num: 14, elemento: 'Inventario general', detalle: 'Revisar listado de medicamentos y materiales del servicio (parte de movimiento de medicamentos).' },
  ];

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1100, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo V: Guía de Puesto de Vacunación
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
      </Box>

      {/* ENCABEZADO */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Controller name="idUnico" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth label="ID ESAVI" disabled variant="filled" InputLabelProps={{ shrink: true }} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Controller name="nombrePuesto" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth label="Nombre del Puesto / Establecimiento visitado" InputLabelProps={{ shrink: true }} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="fechaVisita" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth type="date" label="Fecha de la visita" InputLabelProps={{ shrink: true }} focused error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Controller name="responsablePuesto" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth label="Nombre del Responsable del Puesto" InputLabelProps={{ shrink: true }} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN 1: CHECKLIST CON TABLA DE MATERIAL-UI */}
      <TableContainer component={Paper} elevation={2} sx={{ mb: 4 }}>
        <Box sx={{ p: 3, bgcolor: '#fafafa', borderBottom: '1px solid #ddd' }}>
          <Typography variant="h6" color="primary" gutterBottom>Sección 1. Observación durante la visita al puesto de vacunación</Typography>
          <Typography variant="body2" color="text.secondary">
            Durante la visita al puesto de vacunación, el equipo deberá realizar una revisión visual, documental y técnica de los siguientes aspectos:
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#eeeeee' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '5%' }}>Nº</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Elemento a observar</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>Detalle a verificar</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Cumple (Sí/No)</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Observaciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {checklistItems.map((item) => (
              <TableRow key={item.num} hover>
                <TableCell>{item.num}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{item.elemento}</TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>{item.detalle}</TableCell>
                <TableCell>
                  <Controller name={`s1_chk_${item.num}` as any} control={control} render={({ field, fieldState }) => (
                    <TextField {...field} select fullWidth size="small" variant="outlined" error={!!fieldState.error} helperText={fieldState.error?.message}>
                      <MenuItem value="SI">Sí</MenuItem>
                      <MenuItem value="NO">No</MenuItem>
                    </TextField>
                  )}/>
                </TableCell>
                <TableCell>
                  <Controller name={`s1_obs_${item.num}` as any} control={control} render={({ field, fieldState }) => (
                    <TextField {...field} fullWidth size="small" multiline minRows={1} placeholder="Anotar hallazgo..." variant="outlined" error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}/>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* SECCIÓN 2: GUÍA DE ENTREVISTA INDIVIDUALIZADA */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderLeft: '5px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom>Sección 2. Guía de entrevista</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Durante la investigación, se sugiere entrevistar al personal del puesto de vacunación para obtener información complementaria.
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" sx={{ mb: 2 }}>A. Generalidades del puesto</Typography>
          <Controller name="entrevista_a1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Cuál es el flujo habitual de vacunación en este puesto (número de personas vacunadas por día)?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_a2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Qué vacunas se administran actualmente y con qué frecuencia reciben abastecimiento?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_a3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Qué procedimientos se siguen para el registro y control de los lotes?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" sx={{ mb: 2 }}>B. Manejo y conservación de vacunas</Typography>
          <Controller name="entrevista_b1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Cómo se recibe la vacuna desde el nivel superior? ¿Se documenta la temperatura al momento de la recepción?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_b2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Qué equipamiento se utiliza para la conservación de las vacunas? ¿Cuenta con registro de temperatura diario?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_b3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Cuándo fue el último mantenimiento del equipo de refrigeración?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_b4" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Existen procedimientos escritos para el control de la cadena de frío?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" sx={{ mb: 2 }}>C. Preparación y administración</Typography>
          <Controller name="entrevista_c1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Quién prepara la vacuna antes de su aplicación?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Qué procedimientos se siguen para la reconstitución (en caso de vacunas liofilizadas)?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Qué tipo de jeringas o dispositivos se utilizan? ¿Se han observado dificultades recientes con su uso?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c4" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Qué se hace si se detecta una vacuna con cambio de aspecto o expirada?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c5" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Cómo se verifica la identidad del paciente y el tipo de vacuna antes de aplicar?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c6" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Cómo se verifica que el paciente no tenga contraindicaciones para la administración de la vacuna?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c7" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Qué medidas de seguridad se implementan posterior a la administración de la vacuna?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c8" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Quiénes están entrenados en detección y manejo de un caso de anafilaxia?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" sx={{ mb: 2 }}>D. Condiciones de trabajo y supervisión</Typography>
          <Controller name="entrevista_d1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Existen controles o supervisiones periódicas del puesto? ¿Cuándo fue la última supervisión?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_d2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Cómo se maneja la comunicación con el nivel jurisdiccional ante un evento adverso?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_d3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Qué medidas se adoptan si ocurre una reacción inmediata tras la vacunación?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" sx={{ mb: 2 }}>E. Cierre y documentación</Typography>
          <Controller name="entrevista_e1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Dónde se registran los datos de la vacunación (SISA, fichas locales, NOMIVAC, etc.)?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_e2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Cómo se almacena o archiva la información sobre las vacunas aplicadas?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_e3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} InputLabelProps={{ shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } }} label="¿Qué dificultades enfrenta el equipo en la gestión de registros o en la notificación de ESAVI?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>
      </Paper>

      {/* SECCIÓN 3: EVIDENCIA Y FOTOS */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: '#f4f6f8' }}>
        <CameraAltIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h6" gutterBottom>Sección 3. Recomendaciones finales (Documentación Fotográfica)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Documentar con fotografías, copias de registros y observaciones detalladas cualquier hallazgo relevante.
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