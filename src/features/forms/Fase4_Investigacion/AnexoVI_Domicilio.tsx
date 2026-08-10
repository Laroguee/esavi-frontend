import { useForm, Controller } from 'react-hook-form';
import { 
  Box, Paper, Typography, Grid, TextField, Button, Divider, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// =======================================================
// ESQUEMA ESTRICTO DE ZOD
// =======================================================
const anexoVISchema = z.object({
  idUnico: z.string().optional(),
  
  fechaVisita: z.string().optional().refine((val) => {
    if (!val) return true;
    const selectedDate = new Date(val);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return selectedDate <= now;
  }, { message: "La fecha no puede ser en el futuro" }),
  
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),

  fase1_nota_1: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_2: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_3: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_4: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_5: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_6: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_7: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_8: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_9: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_10: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  fase1_nota_11: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),

  obs_acceso: z.string().optional(), nota_acceso: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_ambiental: z.string().optional(), nota_ambiental: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_infra: z.string().optional(), nota_infra: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_socioEco: z.string().optional(), nota_socioEco: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_recursosSalud: z.string().optional(), nota_recursosSalud: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_costumbres: z.string().optional(), nota_costumbres: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_comercio: z.string().optional(), nota_comercio: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_drogas: z.string().optional(), nota_drogas: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_percepcionVacuna: z.string().optional(), nota_percepcionVacuna: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_rumores: z.string().optional(), nota_rumores: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  obs_seguridad: z.string().optional(), nota_seguridad: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),

  entrevista_evolucion: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_antecedentes: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_vacunacion: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_laboral: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_extraLaboral: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_exposicion: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_casosAdicionales: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),

  dom_vivienda: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  dom_higiene: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  dom_familiar: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  dom_ambiental: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  dom_acceso: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  dom_evidencia: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  dom_almacenMedicina: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  dom_percepcionFamilia: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),

  entrevista_a1: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_a2: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_a3: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_a4: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_a5: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_a6: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_b1: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_b2: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_b3: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_b4: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_b5: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_c1: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_c2: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_c3: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_c4: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_d1: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_d2: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_d3: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_d4: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_d5: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_d6: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_e1: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_e2: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_e3: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_e4: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_f1: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_f2: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_f3: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_g1: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_g2: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_g3: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_g4: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  entrevista_g5: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),

  domicilio_obs_1: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  domicilio_obs_2: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  domicilio_obs_3: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  domicilio_obs_4: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  domicilio_obs_5: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  domicilio_obs_6: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  domicilio_obs_7: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
  domicilio_obs_8: z.string().max(500, "Máximo 500 caracteres permitidos").optional(),
}).superRefine((data, ctx) => {
  const validateRisk = (selectVal: string | undefined, textVal: string | undefined, fieldName: string) => {
    if ((selectVal === 'Riesgo Detectado' || selectVal === 'Sí' || selectVal === 'SI') && (!textVal || textVal.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe describir el riesgo o antecedente identificado",
        path: [fieldName]
      });
    }
  };

  validateRisk(data.obs_acceso, data.nota_acceso, 'nota_acceso');
  validateRisk(data.obs_ambiental, data.nota_ambiental, 'nota_ambiental');
  validateRisk(data.obs_infra, data.nota_infra, 'nota_infra');
  validateRisk(data.obs_socioEco, data.nota_socioEco, 'nota_socioEco');
  validateRisk(data.obs_recursosSalud, data.nota_recursosSalud, 'nota_recursosSalud');
  validateRisk(data.obs_costumbres, data.nota_costumbres, 'nota_costumbres');
  validateRisk(data.obs_comercio, data.nota_comercio, 'nota_comercio');
  validateRisk(data.obs_drogas, data.nota_drogas, 'nota_drogas');
  validateRisk(data.obs_percepcionVacuna, data.nota_percepcionVacuna, 'nota_percepcionVacuna');
  validateRisk(data.obs_rumores, data.nota_rumores, 'nota_rumores');
  validateRisk(data.obs_seguridad, data.nota_seguridad, 'nota_seguridad');
});

type AnexoVIFormValues = z.infer<typeof anexoVISchema>;

export default function AnexoVI_Domicilio() {
  const navigate = useNavigate();

  const { control, handleSubmit } = useForm<AnexoVIFormValues>({
    resolver: zodResolver(anexoVISchema),
    defaultValues: {
      idUnico: 'ESAVI-MINSAL-2025-001', horaInicio: '', horaFin: '', fechaVisita: '',
      fase1_nota_1: '', fase1_nota_2: '', fase1_nota_3: '', fase1_nota_4: '', fase1_nota_5: '', 
      fase1_nota_6: '', fase1_nota_7: '', fase1_nota_8: '', fase1_nota_9: '', fase1_nota_10: '', fase1_nota_11: '',
      entrevista_a1: '', entrevista_a2: '', entrevista_a3: '', entrevista_a4: '', entrevista_a5: '', entrevista_a6: '',
      entrevista_b1: '', entrevista_b2: '', entrevista_b3: '', entrevista_b4: '', entrevista_b5: '',
      entrevista_c1: '', entrevista_c2: '', entrevista_c3: '', entrevista_c4: '',
      entrevista_d1: '', entrevista_d2: '', entrevista_d3: '', entrevista_d4: '', entrevista_d5: '', entrevista_d6: '',
      entrevista_e1: '', entrevista_e2: '', entrevista_e3: '', entrevista_e4: '',
      entrevista_f1: '', entrevista_f2: '', entrevista_f3: '',
      entrevista_g1: '', entrevista_g2: '', entrevista_g3: '', entrevista_g4: '', entrevista_g5: '',
      domicilio_obs_1: '', domicilio_obs_2: '', domicilio_obs_3: '', domicilio_obs_4: '', 
      domicilio_obs_5: '', domicilio_obs_6: '', domicilio_obs_7: '', domicilio_obs_8: '',
      obs_acceso: '', nota_acceso: '', obs_ambiental: '', nota_ambiental: '', obs_infra: '', nota_infra: '',
      obs_socioEco: '', nota_socioEco: '', obs_recursosSalud: '', nota_recursosSalud: '', obs_costumbres: '', nota_costumbres: '',
      obs_comercio: '', nota_comercio: '', obs_drogas: '', nota_drogas: '', obs_percepcionVacuna: '', nota_percepcionVacuna: '',
      obs_rumores: '', nota_rumores: '', obs_seguridad: '', nota_seguridad: '',
      entrevista_evolucion: '', entrevista_antecedentes: '', entrevista_vacunacion: '', entrevista_laboral: '', entrevista_extraLaboral: '', entrevista_exposicion: '', entrevista_casosAdicionales: '',
      dom_vivienda: '', dom_higiene: '', dom_familiar: '', dom_ambiental: '', dom_acceso: '', dom_evidencia: '', dom_almacenMedicina: '', dom_percepcionFamilia: ''
    }
  });

  const onSubmit = (data: AnexoVIFormValues) => {
    console.log("Anexo VI Guardado:", data);
    alert("Guía Domiciliaria (Anexo VI) guardada exitosamente.");
    navigate(-1);
  };

  const tabla4 = [
    { num: 1, cat: 'Accesibilidad geográfica', desc: 'Distancia hasta el centro de salud más cercano, medios de transporte disponibles, condiciones del camino, tiempo de traslado en emergencias.' },
    { num: 2, cat: 'Condiciones ambientales', desc: 'Estado general del ambiente: tipo de terreno, zonas inundables, presencia de residuos o contaminantes, fuentes de agua, vectores o animales domésticos.' },
    { num: 3, cat: 'Condiciones de infraestructura y servicios básicos', desc: 'Disponibilidad de agua potable, energía eléctrica, saneamiento, recolección de residuos, vías de comunicación y señal telefónica.' },
    { num: 4, cat: 'Condiciones socioeconómicas predominantes', desc: 'Tipología de viviendas, nivel de hacinamiento, indicadores visibles de vulnerabilidad.' },
    { num: 5, cat: 'Recursos de salud locales', desc: 'Existencia de centro de salud, sala de primeros auxilios o agentes sanitarios comunitarios; frecuencia de atención médica y campañas de vacunación.' },
    { num: 6, cat: 'Prácticas y costumbres locales', desc: 'Conductas relacionadas con la salud y la vacunación.' },
    { num: 7, cat: 'Comercio y actividad económica local', desc: 'Venta ilegal de medicamentos, comercio inseguro de alimentos, faena insegura, comercio ilegal de aves, prácticas inseguras de agricultura familiar, etc.' },
    { num: 8, cat: 'Venta o consumo de sustancias psicoactivas', desc: 'Presencia visible o referida de venta informal, circulación o consumo de sustancias psicoactivas.' },
    { num: 9, cat: 'Percepción comunitaria sobre la vacunación', desc: 'Opiniones expresadas espontáneamente, nivel de confianza en el sistema de salud, rumores.' },
    { num: 10, cat: 'Presencia de otros casos o rumores de eventos similares', desc: 'Menciones sobre otras personas afectadas por el mismo evento luego de la vacunación.' },
    { num: 11, cat: 'Factores de seguridad y accesibilidad', desc: 'Riesgos para el equipo de salud: zonas de difícil acceso, conflictos sociales, condiciones de violencia o inseguridad.' }
  ];

  const tabla5 = [
    { num: 1, elem: 'Condiciones de la vivienda', desc: 'Tipo de construcción, ventilación, iluminación, saneamiento, acceso a agua potable.' },
    { num: 2, elem: 'Condiciones de higiene', desc: 'Limpieza del entorno, disposición de residuos, control de plagas.' },
    { num: 3, elem: 'Entorno familiar', desc: 'Número de convivientes, presencia de niños, personas mayores o embarazadas, dinámica familiar. Número de personas por cuarto.' },
    { num: 4, elem: 'Factores ambientales', desc: 'Exposición a humo, contaminación, agroquímicos u otras sustancias.' },
    { num: 5, elem: 'Accesibilidad sanitaria', desc: 'Distancia a centros de salud, disponibilidad de transporte, barreras.' },
    { num: 6, elem: 'Evidencias documentales', desc: 'Certificado de vacunación, recetas médicas, resultados de laboratorio, epicrisis, informes de alta.' },
    { num: 7, elem: 'Condiciones de almacenamiento de medicamentos', desc: 'Identificar si el paciente guarda medicamentos, hierbas, productos naturales en el domicilio y en qué condiciones.' },
    { num: 8, elem: 'Percepción de la familia sobre la vacunación', desc: 'Actitudes, temores, experiencias previas, confianza en el sistema de salud.' }
  ];

  function EntrevistaField({ name, label }: { name: string, label: string }) {
    return (
      <Controller name={name as any} control={control} render={({ field, fieldState }) => (
        <TextField 
          {...field} fullWidth size="small" sx={{ mb: 3 }} 
          label={label} 
          slotProps={{ inputLabel: { shrink: true, sx: { whiteSpace: 'normal', maxWidth: '100%' } } }} 
          multiline minRows={1}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        />
      )}/>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1100, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo VI: Investigación Domiciliaria
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
      </Box>

      {/* ENCABEZADO FIJO */}
      <Paper elevation={2} sx={{ p: 4, mb: 3, borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller name="idUnico" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth label="ID ESAVI" disabled variant="filled" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
             <Controller name="fechaVisita" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth type="date" label="Fecha de la visita" slotProps={{ inputLabel: { shrink: true } }} focused error={!!fieldState.error} helperText={fieldState.error?.message} />} />
          </Grid>
        </Grid>
      </Paper>

      {/* =========================================================
          ACORDEÓN 1: FASE I
      ========================================================= */}
      <Accordion defaultExpanded sx={{ mb: 2, border: '1px solid #e0e0e0' }} elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f4f6f8' }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>1. Fase I: Observación de la Comunidad</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#eeeeee' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Categoría</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Elementos a registrar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>Notas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tabla4.map((row) => (
                  <TableRow key={row.num} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{row.cat}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{row.desc}</TableCell>
                    <TableCell>
                      <Controller name={`fase1_nota_${row.num}` as any} control={control} render={({ field, fieldState }) => (
                        <TextField {...field} fullWidth size="small" multiline minRows={1} placeholder="Registrar hallazgos..." variant="outlined" error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )}/>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* =========================================================
          ACORDEÓN 2: FASE II - ENTREVISTA
      ========================================================= */}
      <Accordion sx={{ mb: 2, border: '1px solid #e0e0e0' }} elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f4f6f8' }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>2. Fase II: Entrevista a Persona Afectada o Familia</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 4 }}>
          
          <Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1rem' }}>A. Sobre el evento y su evolución</Typography>
          <EntrevistaField name="entrevista_a1" label="¿Qué síntomas presentó y cuándo comenzaron?" />
          <EntrevistaField name="entrevista_a2" label="¿Qué estaba haciendo antes de que aparecieran los síntomas?" />
          <EntrevistaField name="entrevista_a3" label="¿Cuánto tiempo pasó entre la vacunación y el inicio del malestar?" />
          <EntrevistaField name="entrevista_a4" label="¿Cómo evolucionaron los síntomas con el tiempo?" />
          <EntrevistaField name="entrevista_a5" label="¿Recibió atención médica? ¿Dónde y cuándo?" />
          <EntrevistaField name="entrevista_a6" label="¿Se encuentra recuperado/a actualmente?" />

          <Divider sx={{ my: 4 }} />
          <Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1rem' }}>B. Sobre antecedentes personales</Typography>
          <EntrevistaField name="entrevista_b1" label="¿Ha tenido alguna enfermedad importante en el último año?" />
          <EntrevistaField name="entrevista_b2" label="¿Toma medicamentos habitualmente? ¿Cuáles?" />
          <EntrevistaField name="entrevista_b3" label="¿Acostumbra usar algún té, hierba, yuyo u otro remedio natural para aliviar síntomas? ¿Podría contarme dónde los consigue?" />
          <EntrevistaField name="entrevista_b4" label="¿Ha tenido reacciones a vacunas anteriormente?" />
          <EntrevistaField name="entrevista_b5" label="En caso de embarazo: ¿En qué semana se encontraba al momento de la vacunación?" />

          <Divider sx={{ my: 4 }} />
          <Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1rem' }}>C. Sobre la vacunación</Typography>
          <EntrevistaField name="entrevista_c1" label="¿Dónde y cuándo recibió la vacuna?" />
          <EntrevistaField name="entrevista_c2" label="¿Recuerda si se aplicó alguna otra vacuna o medicamento ese mismo día?" />
          <EntrevistaField name="entrevista_c3" label="¿Observó algo inusual durante la vacunación (dolor excesivo, cambio de color, malestar inmediato)?" />
          <EntrevistaField name="entrevista_c4" label="¿Conoce si otras personas vacunadas ese día presentaron molestias similares?" />

          <Divider sx={{ my: 4 }} />
          <Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1rem' }}>D. Ocupación y actividad laboral</Typography>
          <EntrevistaField name="entrevista_d1" label="¿A qué se dedica actualmente?" />
          <EntrevistaField name="entrevista_d2" label="¿Su trabajo implica exposición a sustancias químicas, polvo, pesticidas o combustibles?" />
          <EntrevistaField name="entrevista_d3" label="¿Trabaja con animales, en el campo, en frigoríficos?" />
          <EntrevistaField name="entrevista_d4" label="¿Trabaja con máquinas, herramientas o en tareas que impliquen alto esfuerzo físico?" />
          <EntrevistaField name="entrevista_d5" label="¿Tiene más de un empleo o realiza trabajos informales? ¿Cuáles?" />
          <EntrevistaField name="entrevista_d6" label="¿Ha tenido recientemente cambios laborales significativos (nuevas tareas, viajes, turnos nocturnos)?" />

          <Divider sx={{ my: 4 }} />
          <Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1rem' }}>E. Actividades extra laborales</Typography>
          <EntrevistaField name="entrevista_e1" label="¿Realiza actividades en las que se usen químicos para agricultura, artesanías, limpieza, control de plagas, mecánica?" />
          <EntrevistaField name="entrevista_e2" label="¿Participa en ferias, mercados o comercio comunitario de aves, fauna, alimentos?" />
          <EntrevistaField name="entrevista_e3" label="¿Tiene contacto frecuente con animales domésticos o de granja?" />
          <EntrevistaField name="entrevista_e4" label="¿Viaja frecuentemente por motivos laborales o personales? ¿A dónde?" />

          <Divider sx={{ my: 4 }} />
          <Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1rem' }}>F. Exposiciones ambientales</Typography>
          <EntrevistaField name="entrevista_f1" label="¿Está expuesto/a en el hogar o trabajo a humo, leña, carbón, pesticidas o metales pesados?" />
          <EntrevistaField name="entrevista_f2" label="¿Qué agua consumen en el hogar? ¿Cómo la obtienen? ¿Realizan algún procesamiento?" />
          <EntrevistaField name="entrevista_f3" label="¿Vive o trabaja cerca de basurales, industrias, plantaciones o cuerpos de agua contaminados?" />

          <Divider sx={{ my: 4 }} />
          <Typography variant="subtitle2" color="secondary.main" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1rem' }}>G. Sobre el contexto familiar, comunitario y casos adicionales</Typography>
          <EntrevistaField name="entrevista_g1" label="¿Alguien más en la familia o comunidad ha estado enfermo últimamente?" />
          <EntrevistaField name="entrevista_g2" label="¿Han tenido dificultades recientes para acceder a atención médica o medicamentos?" />
          <EntrevistaField name="entrevista_g3" label="¿Ha participado recientemente en celebraciones, reuniones masivas o eventos sociales? ¿Alguien presentó los mismos síntomas?" />
          <EntrevistaField name="entrevista_g4" label="¿Ha tenido contacto cercano con alguien enfermo en los últimos días o semanas?" />
          <EntrevistaField name="entrevista_g5" label="¿Alguien en su entorno tuvo síntomas similares a los suyos?" />

        </AccordionDetails>
      </Accordion>

      {/* =========================================================
          ACORDEÓN 3: FASE II - DOMICILIO
      ========================================================= */}
      <Accordion sx={{ mb: 2, border: '1px solid #e0e0e0' }} elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f4f6f8' }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>3. Fase II: Observación Directa en Domicilio</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#eeeeee' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Elemento a observar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Aspectos a registrar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>Observación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tabla5.map((row) => (
                  <TableRow key={row.num} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{row.elem}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{row.desc}</TableCell>
                    <TableCell>
                      <Controller name={`domicilio_obs_${row.num}` as any} control={control} render={({ field, fieldState }) => (
                        <TextField {...field} fullWidth size="small" multiline minRows={1} placeholder="Registrar hallazgos..." variant="outlined" error={!!fieldState.error} helperText={fieldState.error?.message} />
                      )}/>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* =========================================================
          ACORDEÓN 4: FASE III - CIERRE Y EVIDENCIA
      ========================================================= */}
      <Accordion sx={{ mb: 4, border: '1px solid #e0e0e0' }} elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f4f6f8' }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>4. Fase III: Cierre Administrativo y Evidencia</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 4 }}>
          
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Hora de inicio de la visita</Typography>
              <Controller name="horaInicio" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth type="time" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Hora de finalización de la visita</Typography>
              <Controller name="horaFin" control={control} render={({ field, fieldState }) => <TextField {...field} fullWidth type="time" slotProps={{ inputLabel: { shrink: true } }} error={!!fieldState.error} helperText={fieldState.error?.message} />} />
            </Grid>
          </Grid>

          <Box sx={{ border: '2px dashed #ccc', p: 4, textAlign: 'center', borderRadius: 2, bgcolor: '#fafafa' }}>
            <CameraAltIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" gutterBottom>Evidencia Fotográfica y Documental</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Fotografíe el carnet de vacunación, recetas médicas o entorno ambiental.
            </Typography>
            <Button variant="contained" component="label" color="secondary" size="large">
              TOMAR FOTO / SUBIR ARCHIVO
              <input type="file" hidden multiple accept="image/*,.pdf" capture="environment" />
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* BOTÓN FINAL */}
      <Box sx={{ textAlign: 'right' }}>
        <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} size="large">
          Finalizar y Guardar Anexo VI
        </Button>
      </Box>

    </Box>
  );
}