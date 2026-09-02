import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';
import { guardarEnSheets, obtenerExpediente, subirArchivoEvidencia } from '../../../services/googleSheetsService';
import { useAuthStore } from '../../../store/useAuthStore';
import { useReactToPrint } from 'react-to-print';
import { useRef, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const anexoVSchema = z.object({
  idUnico: z.string().optional(),
  nombrePuesto: z.string().max(500, "Máximo 500 caracteres").optional(),
  fechaVisita: z.string().optional().refine((val) => {
    if (!val) return true;
    const selectedDate = new Date(val);
    const now = new Date();
    now.setHours(23, 59, 59, 999); 
    return selectedDate <= now;
  }, { message: "La fecha no puede ser futura" }),
  responsablePuesto: z.string().max(500, "Máximo 500 caracteres").optional(),

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
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isViewMode, setIsViewMode] = useState(searchParams.get('mode') === 'view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const { userEmail } = useAuthStore();

  // === GENERACIÓN DE PDF ===
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Anexo_V_PuestoVacunacion_${id}`,
  });

  const { control, handleSubmit, reset } = useForm<AnexoVFormValues>({
    resolver: zodResolver(anexoVSchema),
    defaultValues: {
      idUnico: id || '', nombrePuesto: '', fechaVisita: new Date().toISOString().split('T')[0], responsablePuesto: '',
      s1_chk_1: '', s1_obs_1: '', s1_chk_2: '', s1_obs_2: '', s1_chk_3: '', s1_obs_3: '',
      s1_chk_4: '', s1_obs_4: '', s1_chk_5: '', s1_obs_5: '', s1_chk_6: '', s1_obs_6: '',
      s1_chk_7: '', s1_obs_7: '', s1_chk_8: '', s1_obs_8: '', s1_chk_9: '', s1_obs_9: '',
      s1_chk_10: '', s1_obs_10: '', s1_chk_11: '', s1_obs_11: '', s1_chk_12: '', s1_obs_12: '',
      s1_chk_13: '', s1_obs_13: '', s1_chk_14: '', s1_obs_14: '',
      entrevista_a1: '', entrevista_a2: '', entrevista_a3: '',
      entrevista_b1: '', entrevista_b2: '', entrevista_b3: '', entrevista_b4: '',
      entrevista_c1: '', entrevista_c2: '', entrevista_c3: '', entrevista_c4: '', entrevista_c5: '', entrevista_c6: '', entrevista_c7: '', entrevista_c8: '',
      entrevista_d1: '', entrevista_d2: '', entrevista_d3: '',
      entrevista_e1: '', entrevista_e2: '', entrevista_e3: ''
    }
  });

  useEffect(() => {
    async function loadData() {
      if (id) {
        try {
          const res = await obtenerExpediente(id);
          if (res.success && res.data.anexos) {
            const anexo = res.data.anexos.find((a: any) => a.tipo_anexo?.includes('V (') || a.id_anexo?.includes('ANXV-'));
            if (anexo && anexo.datos_formulario_json) {
              const parsed = typeof anexo.datos_formulario_json === 'string' ? JSON.parse(anexo.datos_formulario_json) : anexo.datos_formulario_json;
              reset({
                ...parsed,
                idUnico: id || '',
                fechaVisita: parsed.fechaVisita || new Date().toISOString().split('T')[0]
              });
            } else if (!isViewMode && (!anexo || !anexo.datos_formulario_json)) {
              // It's a new form, do nothing.
            } else if (!anexo || !anexo.datos_formulario_json) {
              setIsViewMode(false);
              setSearchParams({});
            }
          } else {
            if (isViewMode) {
              setIsViewMode(false);
              setSearchParams({});
            }
          }
        } catch (error) {
          console.error("Error cargando anexo:", error);
          if (isViewMode) {
            setIsViewMode(false);
            setSearchParams({});
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, isViewMode, reset, setSearchParams]);

  const onSubmit = async (data: AnexoVFormValues) => {
    setIsSubmitting(true);
    try {
      if (id && import.meta.env.VITE_USE_API === 'true') {
        const payloadDatos = {
          id_anexo: `ANXV-${Date.now()}`,
          id_caso: id,
          fecha_registro: new Date().toISOString(),
          id_enfermero_autor: userEmail || 'UsuarioDesconocido',
          cadena_frio_correcta: data.s1_chk_7 || 'No Evaluado',
          kit_anafilaxia_disponible: data.s1_chk_13 || 'No Evaluado',
          anomalias_detectadas: 'Pendiente de analizar',
          datos_formulario_json: JSON.stringify(data)
        };
        await guardarEnSheets('ANEXO_VACUNACION', payloadDatos);

        const store = useCasesStore.getState();
        await store.marcarAnexoCompletado(id, 'V');
        
        const casoActual = store.casos.find((c: any) => c.id === id);
        if (casoActual?.estadoFlujo === 'DEVUELTO_A_ERR') {
          store.avanzarCaso(id, 'EN_INVESTIGACION', 'Fase 4: Investigación', 'Corrección aplicada al anexo. Listo para re-evaluación institucional.');
        }
      }
      
      alert("Guía del Puesto de Vacunación (Anexo V) guardada exitosamente.");
      navigate(-1);
    } catch (error) {
      console.error("Error al guardar Anexo V:", error);
      alert("Hubo un error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id) return alert('Debes guardar el caso antes de subir archivos.');
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await subirArchivoEvidencia(id, 'pni', base64, file.type, file.name);
        if (res.success) {
          alert('Archivo subido exitosamente a la carpeta PNI del caso.');
        } else {
          alert('Error al subir el archivo: ' + res.error);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error procesando el archivo.');
      setIsUploading(false);
    }
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary">Cargando información del Anexo...</Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1100, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo V: Guía de Puesto de Vacunación
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => handlePrint()}>
            Descargar PDF
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
        </Box>
      </Box>

      <Box ref={componentRef} sx={{ p: 2, bgcolor: '#fff', borderRadius: 2 }}>
        <fieldset disabled={isViewMode} style={{ border: 'none', margin: 0, padding: 0 }}>

      {/* ENCABEZADO */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller name="idUnico" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth label="ID ESAVI" disabled variant="filled" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Controller name="nombrePuesto" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth label="Nombre del Puesto / Establecimiento visitado" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller name="fechaVisita" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth type="date" label="Fecha de la visita" slotProps={{ htmlInput: { readOnly: true }, inputLabel: { shrink: true } }} focused error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Controller name="responsablePuesto" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth label="Nombre del Responsable del Puesto" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
        </Grid>
      </Paper>

      {/* SECCIÓN 1: CHECKLIST */}
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
                  <Controller name={`s1_chk_${item.num}` as any} control={control} render={({ field }) => (
                    <ToggleButtonGroup
                      {...field}
                      exclusive
                      size="small"
                      onChange={(_, newValue) => {
                        if (newValue !== null) field.onChange(newValue);
                      }}
                      color="primary"
                    >
                      <ToggleButton value="SI" sx={{ fontWeight: 'bold' }}>SÍ</ToggleButton>
                      <ToggleButton value="NO" sx={{ fontWeight: 'bold' }}>NO</ToggleButton>
                    </ToggleButtonGroup>
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

      {/* SECCIÓN 2: GUÍA DE ENTREVISTA */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderLeft: '5px solid', borderColor: 'secondary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom>Sección 2. Guía de entrevista</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Durante la investigación, se sugiere entrevistar al personal del puesto de vacunación para obtener información complementaria.
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" color="primary.dark" sx={{ fontWeight: 'bold', mb: 2 }}>A. Generalidades del puesto</Typography>
          <Controller name="entrevista_a1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Cuál es el flujo habitual de vacunación en este puesto (número de personas vacunadas por día)?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_a2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Qué vacunas se administran actualmente y con qué frecuencia reciben abastecimiento?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_a3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Qué procedimientos se siguen para el registro y control de los lotes?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" color="primary.dark" sx={{ fontWeight: 'bold', mb: 2 }}>B. Manejo y conservación de vacunas</Typography>
          <Controller name="entrevista_b1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Cómo se recibe la vacuna desde el nivel superior? ¿Se documenta la temperatura al momento de la recepción?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_b2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Qué equipamiento se utiliza para la conservación de las vacunas? ¿Cuenta con registro de temperatura diario?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_b3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Cuándo fue el último mantenimiento del equipo de refrigeración?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_b4" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Existen procedimientos escritos para el control de la cadena de frío?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" color="primary.dark" sx={{ fontWeight: 'bold', mb: 2 }}>C. Preparación y administración</Typography>
          <Controller name="entrevista_c1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Quién prepara la vacuna antes de su aplicación?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Qué procedimientos se siguen para la reconstitución (en caso de vacunas liofilizadas)?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Qué tipo de jeringas o dispositivos se utilizan? ¿Se han observado dificultades recientes con su uso?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c4" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Qué se hace si se detecta una vacuna con cambio de aspecto o expirada?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c5" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Cómo se verifica la identidad del paciente y el tipo de vacuna antes de aplicar?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c6" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Cómo se verifica que el paciente no tenga contraindicaciones para la administración de la vacuna?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c7" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Qué medidas de seguridad se implementan posterior a la administración de la vacuna?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_c8" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Quiénes están entrenados en detección y manejo de un caso de anafilaxia?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" color="primary.dark" sx={{ fontWeight: 'bold', mb: 2 }}>D. Condiciones de trabajo y supervisión</Typography>
          <Controller name="entrevista_d1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Existen controles o supervisiones periódicas del puesto? ¿Cuándo fue la última supervisión?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_d2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Cómo se maneja la comunicación con el nivel jurisdiccional ante un evento adverso?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_d3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Qué medidas se adoptan si ocurre una reacción inmediata tras la vacunación?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" color="primary.dark" sx={{ fontWeight: 'bold', mb: 2 }}>E. Cierre y documentación</Typography>
          <Controller name="entrevista_e1" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Dónde se registran los datos de la vacunación (SISA, fichas locales, NOMIVAC, etc.)?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_e2" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Cómo se almacena o archiva la información sobre las vacunas aplicadas?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
          <Controller name="entrevista_e3" control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth multiline minRows={2} sx={{ mb: 3 }} slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} label="¿Qué dificultades enfrenta el equipo en la gestión de registros o en la notificación de ESAVI?" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </Box>
      </Paper>

      {/* SECCIÓN 3: EVIDENCIA */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: '#f4f6f8' }}>
        <CameraAltIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h6" gutterBottom>Sección 3. Recomendaciones finales (Documentación Fotográfica)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Documentar con fotografías, copias de registros y observaciones detalladas cualquier hallazgo relevante.
        </Typography>
        <Button variant="contained" component="label" color="secondary" size="large" disabled={isUploading}>
          {isUploading ? 'SUBIENDO...' : 'TOMAR FOTO / SUBIR ARCHIVO'}
          <input type="file" hidden multiple accept="image/*" capture="environment" onChange={handleFileUpload} />
        </Button>
      </Paper>

        </fieldset>
      </Box>

      {!isViewMode && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="contained" color="primary" type="submit" size="large" startIcon={<SaveIcon />} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar y Finalizar Anexo'}
          </Button>
        </Box>
      )}
    </Box>
  );
}