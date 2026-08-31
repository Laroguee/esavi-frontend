import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Box, Paper, Typography, Grid, TextField, Button, MenuItem, FormControlLabel, Switch, 
  Collapse, Divider, Checkbox, FormLabel, Tabs, Tab, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PregnantWomanIcon from '@mui/icons-material/PregnantWoman';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';
import { guardarEnSheets, obtenerExpediente, subirArchivoEvidencia } from '../../../services/googleSheetsService';
import { useAuthStore } from '../../../store/useAuthStore';
import { useReactToPrint } from 'react-to-print';
import { useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// =======================================================
// ESQUEMA ESTRICTO DE ZOD (Evaluación Clínica)
// =======================================================
const anexoVIISchema = z.object({
  fechaInicioLlenado: z.string().optional(),
  fuentes_historiaClinica: z.boolean().optional(),
  fuentes_entrevistaVacunado: z.boolean().optional(),
  fuentes_entrevistaSalud: z.boolean().optional(),
  fuentes_registrosVac: z.boolean().optional(),
  fuentes_autopsia: z.boolean().optional(),
  fuentes_autopsiaVerbal: z.boolean().optional(),
  fuentes_comunitaria: z.boolean().optional(),
  fuentes_otro: z.string().optional(),
  idUnico: z.string().optional(),
  lugarVacunacion: z.string().optional(),
  lugarVacunacionOtro: z.string().optional(),
  direccionVacunacion: z.string().optional(),
  eq_farma_nombre: z.string().optional(), eq_farma_cargo: z.string().optional(), eq_farma_correo: z.string().optional(), eq_farma_tel: z.string().optional(),
  eq_inmuno_nombre: z.string().optional(), eq_inmuno_cargo: z.string().optional(), eq_inmuno_correo: z.string().optional(), eq_inmuno_tel: z.string().optional(),
  eq_epi_nombre: z.string().optional(), eq_epi_cargo: z.string().optional(), eq_epi_correo: z.string().optional(), eq_epi_tel: z.string().optional(),
  fechaHospitalizacion: z.string().optional(),
  fechaInicioInvestigacion: z.string().optional(),
  estadoPaciente: z.string().optional(),
  fechaMuerte: z.string().optional(),
  horaMuerte: z.string().optional(),
  seRealizoAutopsia: z.string().optional(),
  fechaPrevistaAutopsia: z.string().optional(),
  razonNoAutopsia: z.string().optional(),
  razonNoAutopsiaOtro: z.string().optional(),
  datosNecropsia: z.string().optional(),
  hosp30Dias: z.string().optional(),
  obs_hosp30Dias: z.string().optional(),
  antFamiliares: z.string().optional(),
  obs_antFamiliares: z.string().optional(),
  embarazada: z.string().optional(),
  
  semGestacion: z.string().optional().refine((val) => {
    if (!val) return true; 
    const num = Number(val);
    return num >= 1 && num <= 42;
  }, { message: "Debe ser un número entre 1 y 42" }),

  metGestacion: z.string().optional(),
  metGestacionOtro: z.string().optional(),
  factorRiesgoObs: z.string().optional(),
  exp_factorRiesgoObs: z.string().optional(),
  parto: z.string().optional(),
  nacimiento: z.string().optional(),

  pesoNacer: z.string().optional().refine((val) => {
    if (!val) return true; 
    return Number(val) <= 6000;
  }, { message: "El peso no puede exceder los 6000 gramos" }),

  desenlaceEmbarazo: z.string().optional(),
  afeccionRecienNacido: z.string().optional(),
  amamantando: z.string().optional(),
  recibioAtencionMedica: z.string().optional(),
  fuenteC_examen: z.boolean().optional(),
  fuenteC_docs: z.boolean().optional(),
  fuenteC_autopsia: z.boolean().optional(),
  fuenteC_otro: z.string().optional(),
  institucionDiferente: z.string().optional(),
  instInicial: z.string().optional(),
  medicoInicial: z.string().optional(),
  contactoInicial: z.string().optional(),
  instDefinitiva: z.string().optional(),
  medicoDefinitivo: z.string().optional(),
  contactoDefinitivo: z.string().optional(),
  contactoConoceDetalles: z.string().optional(),
  sospechaMaltrato: z.string().optional(),
  exp_sospechaMaltrato: z.string().optional(),
  violenciaIntrafamiliar: z.string().optional(),
  exp_violenciaIntrafamiliar: z.string().optional(),
  otrosAntSociales: z.string().optional(),
  familiarContacto: z.string().optional(),
  signosCronologicos: z.string().optional(),
  resumenParaclinico: z.string().optional(),
  diagnosticoFinal: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.estadoPaciente === 'Fallecido' && (!data.fechaMuerte || data.fechaMuerte.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La fecha de defunción es obligatoria si el paciente falleció",
      path: ["fechaMuerte"]
    });
  }
});

type AnexoVIIFormValues = z.infer<typeof anexoVIISchema>;

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return <div hidden={value !== index} {...other}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

export default function AnexoVII_Clinico() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isViewMode, setIsViewMode] = useState(searchParams.get('mode') === 'view');
  const [tabIndex, setTabIndex] = useState(0);
  const [esMujerFertil, setEsMujerFertil] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isViewMode);
  const { userEmail } = useAuthStore();

  // === GENERACIÓN DE PDF ===
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Anexo_VII_Clinico_${id}`,
  });

  // === LÓGICA DE MUJER FÉRTIL ===
  useEffect(() => {
    if (id) {
      const store = useCasesStore.getState();
      const caso = store.casos.find((c: any) => c.id === id);
      if (caso && caso.sexo === 'Femenino' && caso.edad && caso.edad >= 12 && caso.edad <= 50) {
        setEsMujerFertil(true);
      }
    }
  }, [id]);

  const { control, handleSubmit, watch, reset } = useForm<AnexoVIIFormValues>({
    resolver: zodResolver(anexoVIISchema),
    defaultValues: {
      fechaInicioLlenado: '', 
      fuentes_historiaClinica: false, fuentes_entrevistaVacunado: false, fuentes_entrevistaSalud: false, fuentes_registrosVac: false, fuentes_autopsia: false, fuentes_autopsiaVerbal: false, fuentes_comunitaria: false, fuentes_otro: '',
      idUnico: 'ESAVI-MINSAL-2025-001', lugarVacunacion: '', lugarVacunacionOtro: '', direccionVacunacion: '', 
      eq_farma_nombre: '', eq_farma_cargo: '', eq_farma_correo: '', eq_farma_tel: '',
      eq_inmuno_nombre: '', eq_inmuno_cargo: '', eq_inmuno_correo: '', eq_inmuno_tel: '',
      eq_epi_nombre: '', eq_epi_cargo: '', eq_epi_correo: '', eq_epi_tel: '',
      fechaHospitalizacion: '', fechaInicioInvestigacion: '', estadoPaciente: '', 
      fechaMuerte: '', horaMuerte: '', seRealizoAutopsia: '', fechaPrevistaAutopsia: '', razonNoAutopsia: '', razonNoAutopsiaOtro: '', datosNecropsia: '',
      hosp30Dias: '', obs_hosp30Dias: '', antFamiliares: '', obs_antFamiliares: '',
      embarazada: '', semGestacion: '', metGestacion: '', metGestacionOtro: '', factorRiesgoObs: '', exp_factorRiesgoObs: '', parto: '', nacimiento: '', pesoNacer: '', desenlaceEmbarazo: '', afeccionRecienNacido: '', amamantando: '',
      recibioAtencionMedica: '', fuenteC_examen: false, fuenteC_docs: false, fuenteC_autopsia: false, fuenteC_otro: '', institucionDiferente: '', instInicial: '', medicoInicial: '', contactoInicial: '', instDefinitiva: '', medicoDefinitivo: '', contactoDefinitivo: '', contactoConoceDetalles: '',
      sospechaMaltrato: '', exp_sospechaMaltrato: '', violenciaIntrafamiliar: '', exp_violenciaIntrafamiliar: '', otrosAntSociales: '', familiarContacto: '', signosCronologicos: '', resumenParaclinico: '', diagnosticoFinal: ''
    }
  });

  useEffect(() => {
    async function loadData() {
      if (id) {
        try {
          const res = await obtenerExpediente(id);
          if (res.success && res.data.anexos) {
            const anexo = res.data.anexos.find((a: any) => a.tipo_anexo?.includes('VII') || a.id_anexo?.includes('ANXVII'));
            if (anexo && anexo.datos_formulario_json) {
              const parsed = typeof anexo.datos_formulario_json === 'string' ? JSON.parse(anexo.datos_formulario_json) : anexo.datos_formulario_json;
              reset(parsed);
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

  const estadoActual = watch('estadoPaciente');
  const hizoAutopsia = watch('seRealizoAutopsia');
  const razonAutopsia = watch('razonNoAutopsia');
  const desenlace = watch('desenlaceEmbarazo');
  const instDiferente = watch('institucionDiferente');

  const onSubmit = async (data: AnexoVIIFormValues) => {
    setIsSubmitting(true);
    try {
      if (id && import.meta.env.VITE_USE_API === 'true') {
        const payloadDatos = {
          id_anexo: `ANXVII-${Date.now()}`,
          id_caso: id,
          fecha_registro: new Date().toISOString(),
          id_medico_autor: userEmail || 'UsuarioDesconocido',
          estado_paciente: data.estadoPaciente || 'Desconocido',
          es_gestante: data.embarazada === 'SI' ? 'SI' : 'NO',
          requirio_hospitalizacion: data.hosp30Dias === 'SI' ? 'SI' : 'NO',
          diagnostico_final: data.diagnosticoFinal || 'Pendiente',
          datos_formulario_json: JSON.stringify(data)
        };
        await guardarEnSheets('ANEXO_CLINICO', payloadDatos);

        const store = useCasesStore.getState();
        await store.marcarAnexoCompletado(id, 'VII');
        
        const casoActual = store.casos.find((c: any) => c.id === id);
        if (casoActual?.estadoFlujo === 'DEVUELTO_A_ERR') {
          store.avanzarCaso(id, 'EN_INVESTIGACION', 'Fase 4: Investigación', 'Corrección aplicada al anexo. Listo para re-evaluación institucional.');
        }
      }
      
      alert("Anexo VII Guardado Exitosamente.");
      navigate(-1);
    } catch (error) {
      console.error("Error al guardar Anexo VII:", error);
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
        const res = await subirArchivoEvidencia(id, 'clinica', base64, file.type, file.name);
        if (res.success) {
          alert('Archivo subido exitosamente a la carpeta clínica del caso.');
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

  function RenderEquipoRow({ prefix, titulo }: { prefix: string, titulo: string }) {
    return (
      <TableRow>
        <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>{titulo}</TableCell>
        <TableCell>
          <Controller name={`${prefix}_nombre` as any} control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth size="small" variant="standard" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </TableCell>
        <TableCell>
          <Controller name={`${prefix}_cargo` as any} control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth size="small" variant="standard" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </TableCell>
        <TableCell>
          <Controller name={`${prefix}_correo` as any} control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth size="small" variant="standard" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </TableCell>
        <TableCell>
          <Controller name={`${prefix}_tel` as any} control={control} render={({ field, fieldState }) => (
            <TextField {...field} fullWidth size="small" variant="standard" error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}/>
        </TableCell>
      </TableRow>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary">Cargando información del Anexo...</Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1200, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo VII: Evaluación Clínica
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="secondary" size="small" onClick={() => handlePrint()}>
            Descargar PDF
          </Button>
          <Button variant="outlined" size="small" onClick={() => navigate(-1)}>Cancelar</Button>
        </Box>
      </Box>

      <Box ref={componentRef} sx={{ p: 2, bgcolor: '#fff', borderRadius: 2 }}>
        <Paper elevation={3} sx={{ borderRadius: 2 }}>
        {/* CORRECCIÓN: Se reemplazó (e, val) por (_, val) */}
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} indicatorColor="secondary" textColor="primary" variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
          <Tab icon={<AssignmentIcon />} label="A. Info Básica" sx={{ fontWeight: 'bold', minHeight: 60 }} />
          <Tab icon={<PregnantWomanIcon />} label="B. Antes de Inmunización" sx={{ fontWeight: 'bold', minHeight: 60 }} />
          <Tab icon={<LocalHospitalIcon />} label="C. Evaluación Clínica" sx={{ fontWeight: 'bold', minHeight: 60 }} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <fieldset disabled={isViewMode} style={{ border: 'none', margin: 0, padding: 0 }}>
          {/* =========================================================
              PESTAÑA A: INFO BÁSICA
          ========================================================= */}
          <TabPanel value={tabIndex} index={0}>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Fecha inicio llenado de ficha</Typography>
                <Controller name="fechaInicioLlenado" control={control} render={({ field, fieldState }) => (
                  // CORRECCIÓN: slotProps en lugar de InputLabelProps
                  <TextField {...field} fullWidth type="date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f9f9f9' }}>
                  <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.85rem' }}>Fuentes de información consultadas:</FormLabel>
                  <Grid container spacing={0}>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuentes_historiaClinica" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} checked={field.value === true || field.value === "true"} />} label={<Typography variant="body2">Historia clínica</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuentes_entrevistaVacunado" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} checked={field.value === true || field.value === "true"} />} label={<Typography variant="body2">Entrevista al vacunado</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuentes_entrevistaSalud" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} checked={field.value === true || field.value === "true"} />} label={<Typography variant="body2">Entrevista personal salud</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuentes_registrosVac" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} checked={field.value === true || field.value === "true"} />} label={<Typography variant="body2">Registros de vacunación</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuentes_autopsia" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} checked={field.value === true || field.value === "true"} />} label={<Typography variant="body2">Informe de Autopsia</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuentes_autopsiaVerbal" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} checked={field.value === true || field.value === "true"} />} label={<Typography variant="body2">Informe autopsia verbal</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuentes_comunitaria" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} checked={field.value === true || field.value === "true"} />} label={<Typography variant="body2">Inv. comunitaria</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <Controller name="fuentes_otro" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} fullWidth placeholder="Otro ¿Cuál?" size="small" variant="standard" error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )} />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Número de identificación del ESAVI</Typography>
                <Controller name="idUnico" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth disabled size="small" variant="filled" error={!!fieldState.error} helperText={fieldState.error?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Lugar de Vacunación</Typography>
                <Controller name="lugarVacunacion" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                    <MenuItem value="Intramural">Intramural – Puesto fijo en establecimiento de salud</MenuItem>
                    <MenuItem value="Extramuros Movil">Extramuros – puesto Móvil</MenuItem>
                    <MenuItem value="Extramural Semi">Extramural – semi móvil</MenuItem>
                    <MenuItem value="Extramural Campana">Extramural – campaña</MenuItem>
                    <MenuItem value="Extramural Seguimiento">Extramural – Campaña de Seguimiento</MenuItem>
                    <MenuItem value="Extramural Intensificado">Extramural – Intensificado</MenuItem>
                    <MenuItem value="Control">Medidas de Control</MenuItem>
                    <MenuItem value="Otro">Otro ¿Cuál?</MenuItem>
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Si eligió 'Otro'</Typography>
                <Controller name="lugarVacunacionOtro" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Dirección completa del lugar de vacunación</Typography>
                <Controller name="direccionVacunacion" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />
                )} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Datos del equipo de investigación</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#eeeeee' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Área</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Nombres y Apellidos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Institución y cargo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Correo electrónico</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Teléfono móvil</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <RenderEquipoRow prefix="eq_farma" titulo="Farmacovigilancia" />
                  <RenderEquipoRow prefix="eq_inmuno" titulo="Inmunizaciones" />
                  <RenderEquipoRow prefix="eq_epi" titulo="Epidemiología" />
                </TableBody>
              </Table>
            </TableContainer>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Fecha de hospitalización</Typography>
                <Controller name="fechaHospitalizacion" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth type="date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Fecha inicio investigación</Typography>
                <Controller name="fechaInicioInvestigacion" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth type="date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Estado de la persona al investigar</Typography>
                <Controller name="estadoPaciente" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                    <MenuItem value="Fallecido">Fallecido</MenuItem>
                    <MenuItem value="No recuperado">No recuperado/no resuelto</MenuItem>
                    <MenuItem value="En recuperacion">En recuperación/resolviendo</MenuItem>
                    <MenuItem value="Recuperado">Recuperado/resuelto</MenuItem>
                    <MenuItem value="Recuperado con secuelas">Recuperado/resuelto con secuelas</MenuItem>
                    <MenuItem value="Desconocido">Desconocido</MenuItem>
                  </TextField>
                )}/>
              </Grid>
            </Grid>

            {/* SECCIÓN CONDICIONAL: FALLECIDO */}
            <Collapse in={estadoActual === 'Fallecido'}>
              <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#fff5f5', borderColor: '#ef5350' }}>
                <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold', mb: 1 }}>Detalles de Defunción</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Fecha de muerte</Typography>
                    <Controller name="fechaMuerte" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} fullWidth type="date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                    )} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Hora de muerte (24 hrs)</Typography>
                    <Controller name="horaMuerte" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} fullWidth type="time" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                    )} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>¿Se realizó autopsia?</Typography>
                    <Controller name="seRealizoAutopsia" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                        <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem>
                      </TextField>
                    )}/>
                  </Grid>
                  
                  {hizoAutopsia === 'NO' && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Razón por la que no se practicó</Typography>
                      <Controller name="razonNoAutopsia" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                          <MenuItem value="Negativa familiar">Negativa de la familia</MenuItem>
                          <MenuItem value="No solicitada">La persona que notificó o trató no lo solicitó</MenuItem>
                          <MenuItem value="No disponible">Los servicios de autopsia no estaban disponibles</MenuItem>
                          <MenuItem value="No normatividad">No existe normatividad que permita practicar la autopsia</MenuItem>
                          <MenuItem value="Otra">Otra razón: ¿Cuál?</MenuItem>
                        </TextField>
                      )}/>
                    </Grid>
                  )}
                  {razonAutopsia === 'Otra' && hizoAutopsia === 'NO' && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Especifique la otra razón</Typography>
                      <Controller name="razonNoAutopsiaOtro" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )} />
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Fecha prevista autopsia (pasada/prevista)</Typography>
                    <Controller name="fechaPrevistaAutopsia" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} fullWidth type="date" size="small" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                    )} />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Registre los datos de la necropsia</Typography>
                    <Controller name="datosNecropsia" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} fullWidth size="small" multiline rows={2} error={!!fieldState.error} helperText={fieldState.error?.message} />
                    )} />
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>
            
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button variant="contained" size="small" onClick={() => setTabIndex(1)}>Siguiente &rarr;</Button>
            </Box>
          </TabPanel>

          {/* =========================================================
              PESTAÑA B: ANTES DE INMUNIZACIÓN
          ========================================================= */}
          <TabPanel value={tabIndex} index={1}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Hosp. en 30 días previos</Typography>
                <Controller name="hosp30Dias" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                    <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem>
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Observaciones</Typography>
                <Controller name="obs_hosp30Dias" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />
                )} />
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Otra enf. familiar o alergia</Typography>
                <Controller name="antFamiliares" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                    <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem>
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Observaciones</Typography>
                <Controller name="obs_antFamiliares" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />
                )} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fdfbfd', borderColor: '#ce93d8' }}>
              <FormControlLabel 
                control={<Switch size="small" checked={esMujerFertil} onChange={(e) => setEsMujerFertil(e.target.checked)} color="secondary" />} 
                label={<Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 'bold' }}>PREGUNTAS PARA MUJERES (12 a 50 años / sospecha embarazo)</Typography>} 
              />
              <Collapse in={esMujerFertil}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>¿Embarazada al vacunar?</Typography>
                    <Controller name="embarazada" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                        <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem>
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Semanas de gestación (1-42)</Typography>
                    <Controller name="semGestacion" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} fullWidth size="small" type="number" error={!!fieldState.error} helperText={fieldState.error?.message} />
                    )} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Método de cálculo</Typography>
                    <Controller name="metGestacion" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                        <MenuItem value="Examen">Examen físico</MenuItem>
                        <MenuItem value="FUR Confiable">Fecha última menstruación-confiable</MenuItem>
                        <MenuItem value="FUR No Confiable">Fecha última menstruación-no confiable</MenuItem>
                        <MenuItem value="USG 1">Ultrasonido de primer trimestre</MenuItem>
                        <MenuItem value="USG 2">Ultrasonido de segundo trimestre</MenuItem>
                        <MenuItem value="USG 3">Ultrasonido de tercer trimestre</MenuItem>
                        <MenuItem value="Otro">Otro</MenuItem>
                      </TextField>
                    )}/>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>¿Factor riesgo obstétrico?</Typography>
                    <Controller name="factorRiesgoObs" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                        <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem>
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Explique cuál fue</Typography>
                    <Controller name="exp_factorRiesgoObs" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />
                    )} />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>El parto fue</Typography>
                    <Controller name="parto" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                        <MenuItem value="Normal">Normal</MenuItem><MenuItem value="Cesarea">Cesárea</MenuItem><MenuItem value="Instrumentado">Instrumentado</MenuItem><MenuItem value="Complicaciones">Con complicaciones</MenuItem><MenuItem value="No aplica">No aplica</MenuItem>
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>El nacimiento fue</Typography>
                    <Controller name="nacimiento" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                        <MenuItem value="Prematuro">Prematuro</MenuItem><MenuItem value="Termino">A Término</MenuItem><MenuItem value="Postermino">Postérmino</MenuItem><MenuItem value="No aplica">No Aplica</MenuItem>
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                   <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>{"Peso al Nacer (<=6000g)"}</Typography> 
                    <Controller name="pesoNacer" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} fullWidth size="small" type="number" error={!!fieldState.error} helperText={fieldState.error?.message} />
                    )} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>¿Amamantando al vacunar?</Typography>
                    <Controller name="amamantando" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                        <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem>
                      </TextField>
                    )}/>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Desenlace del embarazo</Typography>
                    <Controller name="desenlaceEmbarazo" control={control} render={({ field, fieldState }) => (
                      <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                        <MenuItem value="Sano">Nacido vivo sano</MenuItem>
                        <MenuItem value="Afeccion">Nacido vivo con afección médica al nacer</MenuItem>
                        <MenuItem value="Muerte Temprana">Muerte neonatal temprana</MenuItem>
                        <MenuItem value="Muerte Fetal">Muerte Fetal</MenuItem>
                        <MenuItem value="Muerte Tardia">Muerte neonatal tardía</MenuItem>
                        <MenuItem value="Aborto">Aborto</MenuItem>
                        <MenuItem value="Evolucion">En evolución</MenuItem>
                      </TextField>
                    )}/>
                  </Grid>
                  
                  {desenlace === 'Afeccion' && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Describa la afección médica del recién nacido</Typography>
                      <Controller name="afeccionRecienNacido" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )} />
                    </Grid>
                  )}
                </Grid>
              </Collapse>
            </Paper>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" size="small" onClick={() => setTabIndex(0)}>&larr; Volver a Sección A</Button>
              <Button variant="contained" size="small" onClick={() => setTabIndex(2)}>Siguiente &rarr;</Button>
            </Box>
          </TabPanel>

          {/* =========================================================
              PESTAÑA C: EVALUACIÓN CLÍNICA
          ========================================================= */}
          <TabPanel value={tabIndex} index={2}>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>¿Atención médica para ESAVI?</Typography>
                <Controller name="recibioAtencionMedica" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                    <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem>
                  </TextField>
                )}/>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f9f9f9' }}>
                  <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.85rem' }}>Fuente de información (Atención):</FormLabel>
                  <Grid container spacing={0}>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuenteC_examen" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Examen por investigador</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuenteC_docs" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Documentos</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><Controller name="fuenteC_autopsia" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Autopsia Verbal</Typography>} />} /></Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <Controller name="fuenteC_otro" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} fullWidth placeholder="Otro ¿Cuál?" size="small" variant="standard" sx={{ mt: 0.5 }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )} />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>¿La institución inicial es DIFERENTE a la definitiva?</Typography>
                <Controller name="institucionDiferente" control={control} render={({ field, fieldState }) => (
                  <TextField {...field} select sx={{ width: '200px' }} size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                    <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem>
                  </TextField>
                )}/>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: instDiferente === 'SI' ? 4 : 6 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Institución Inicial</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Nombre Institución</Typography>
                      <Controller name="instInicial" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" sx={{ mb: 1 }} error={!!fieldState.error} helperText={fieldState.error?.message}/>} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Médico</Typography>
                      <Controller name="medicoInicial" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" sx={{ mb: 1 }} error={!!fieldState.error} helperText={fieldState.error?.message}/>} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Contacto (Tel/Email)</Typography>
                      <Controller name="contactoInicial" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />} />
                    </Grid>
                    
                    {instDiferente === 'SI' && (
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Institución Definitiva</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Nombre Institución</Typography>
                        <Controller name="instDefinitiva" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" sx={{ mb: 1 }} error={!!fieldState.error} helperText={fieldState.error?.message}/>} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Médico</Typography>
                        <Controller name="medicoDefinitivo" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" sx={{ mb: 1 }} error={!!fieldState.error} helperText={fieldState.error?.message}/>} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Contacto (Tel/Email)</Typography>
                        <Controller name="contactoDefinitivo" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />} />
                      </Grid>
                    )}

                    <Grid size={{ xs: 12, md: instDiferente === 'SI' ? 4 : 6 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Referencia Familiar</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Familiar/Persona con detalles clínicos</Typography>
                      <Controller name="contactoConoceDetalles" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" multiline rows={4} placeholder="Nombre e información de contacto..." error={!!fieldState.error} helperText={fieldState.error?.message} />} />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* SECCIÓN COMPACTA: ANTECEDENTES SOCIALES Y VIOLENCIA */}
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderColor: '#e0e0e0' }}>
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Antecedentes Sociales y Violencia</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Menor 5 años: ¿Sospecha de maltrato?</Typography>
                      <Controller name="sospechaMaltrato" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                          <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem>
                        </TextField>
                      )}/>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Explique (si aplica)</Typography>
                      <Controller name="exp_sospechaMaltrato" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Adolesc/Adulto: ¿Violencia intrafamiliar?</Typography>
                      <Controller name="violenciaIntrafamiliar" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} select fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message}>
                          <MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem>
                        </TextField>
                      )}/>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Explique (si aplica)</Typography>
                      <Controller name="exp_violenciaIntrafamiliar" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />} />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Otros antecedentes sociales relevantes del caso</Typography>
                      <Controller name="otrosAntSociales" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth size="small" multiline rows={2} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* SECCIÓN COMPACTA: SIGNOS Y DIAGNÓSTICO */}
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: '#e0e0e0' }}>
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Signos, Síntomas y Diagnóstico</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Signos y síntomas en orden cronológico desde la vacunación:</Typography>
                      <Controller name="signosCronologicos" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} fullWidth size="small" multiline rows={3} placeholder="Detalle cronológico..." error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )}/>
                    </Grid>
                    
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Resumen completo clínico y paraclínico (exámenes y gabinete):</Typography>
                      <Controller name="resumenParaclinico" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} fullWidth size="small" multiline rows={3} placeholder="Resaltando lo más relevante..." error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )}/>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>Diagnóstico final o presuntivo:</Typography>
                      <Controller name="diagnosticoFinal" control={control} render={({ field, fieldState }) => (
                        <TextField {...field} fullWidth size="small" variant="outlined" sx={{ bgcolor: '#fffde7' }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )}/>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* ZONA DE SUBIDA */}
            <Box sx={{ mt: 4, border: '1px dashed #9c27b0', p: 2, textAlign: 'center', borderRadius: 1, bgcolor: '#fafafa' }}>
              <CloudUploadIcon color="secondary" sx={{ fontSize: 32, mb: 0.5 }} />
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Adjuntar Evidencias Médicas</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Historia Clínica, Exámenes o Autopsia (PDF/Foto).</Typography>
              <Button variant="outlined" component="label" color="secondary" size="small" disabled={isUploading}>
                {isUploading ? 'SUBIENDO...' : 'SELECCIONAR ARCHIVOS'}
                <input type="file" hidden multiple accept="image/*,.pdf" capture="environment" onChange={handleFileUpload} />
              </Button>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="outlined" size="small" onClick={() => setTabIndex(1)}>&larr; Volver a Sección B</Button>
            </Box>
          </TabPanel>
          </fieldset>
        </Box>
      </Paper>
      </Box> {/* Cierre de componentRef */}

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