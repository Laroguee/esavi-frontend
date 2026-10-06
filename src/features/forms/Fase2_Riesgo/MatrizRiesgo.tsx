import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Box, Paper, Typography, TextField, MenuItem, Button, Alert, 
  Backdrop, CircularProgress, Grid, Divider, CircularProgress as CircularGauge 
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShieldIcon from '@mui/icons-material/Shield';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import GroupIcon from '@mui/icons-material/Group';
import AutorenewIcon from '@mui/icons-material/Autorenew';

import { useReactToPrint } from 'react-to-print';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { guardarEnSheets, registrarLog, crearNotificacion, obtenerExpediente } from '../../../services/firebaseService';

// --- TYPES & CONSTANTS ---
type RiskLevelKey = 'noRisk' | 'low' | 'moderate' | 'high' | 'critical';

interface Option {
  value: number;
  label: string;
}

interface RiskFactorDefinition {
  id: string; 
  label: string;
  options: Option[];
}

interface RiskLevelConfig {
  level: string;
  response: string;
  etiquetaHistorica: string;
  colorMui: 'success' | 'warning' | 'error' | 'info';
  nivelRespuestaHistorico: string;
}

const INITIAL_STATE = {
  fechaReunionEvaluacion: new Date().toISOString().split('T')[0],
  capacidad_respuesta: -1, just_capacidad_respuesta: '',
  gravedad: -1, just_gravedad: '',
  conglomerado: -1, just_conglomerado: '',
  senal: -1, just_senal: '',
  vacuna: -1, just_vacuna: '',
  error: -1, just_error: '',
  impacto: -1, just_impacto: '',
  calidad_biologico: -1, just_calidad_biologico: '',
  grupos_especiales: -1, just_grupos_especiales: '',
  grupos_riesgo: -1, just_grupos_riesgo: '',
};

const RISK_LEVELS: Record<RiskLevelKey, RiskLevelConfig> = {
  noRisk: {
    level: "Sin Riesgo",
    response: "No se requiere acción específica. Monitoreo de rutina.",
    etiquetaHistorica: 'RIESGO BAJO', colorMui: 'success', nivelRespuestaHistorico: 'LOCAL'
  },
  low: {
    level: "Nivel I – Bajo",
    response: "Gestión local / institucional.",
    etiquetaHistorica: 'RIESGO BAJO', colorMui: 'success', nivelRespuestaHistorico: 'LOCAL'
  },
  moderate: {
    level: "Nivel II – Moderado",
    response: "Apoyo técnico subnacional (departamental/distrital).",
    etiquetaHistorica: 'RIESGO MODERADO', colorMui: 'warning', nivelRespuestaHistorico: 'DEPARTAMENTAL'
  },
  high: {
    level: "Nivel III – Alto",
    response: "Análisis nacional (INS/MSPS/INVIMA).",
    etiquetaHistorica: 'RIESGO ALTO', colorMui: 'warning', nivelRespuestaHistorico: 'REGIONAL'
  },
  critical: {
    level: "Nivel IV – Muy alto / crítico",
    response: "Respuesta interinstitucional ampliada (Fondo Rotatorio, fabricante).",
    etiquetaHistorica: 'RIESGO CRÍTICO', colorMui: 'error', nivelRespuestaHistorico: 'NACIONAL'
  }
};

const QUESTIONS_CAPACITY: RiskFactorDefinition[] = [
  {
    id: 'capacidad_respuesta', label: 'Evalúe la capacidad de respuesta local ante el evento',
    options: [
      { value: 0, label: 'El municipio o nivel local cuenta con profesionales con entrenamiento en investigación.' },
      { value: 100, label: 'El municipio no cuenta con capacidad, pero el departamento sí.' },
      { value: 250, label: 'El departamento no cuenta con capacidad, pero el nivel central sí.' },
      { value: 500, label: 'El nivel central no tiene capacidad o recursos limitados.' },
    ]
  }
];

const QUESTIONS_THREAT: RiskFactorDefinition[] = [
  {
    id: 'gravedad', label: 'Gravedad del ESAVI',
    options: [
      { value: 0, label: 'No grave' },
      { value: 5, label: 'Hospitalización o prolongación de estancia hospitalaria' },
      { value: 15, label: 'Malformación congénita o discapacidad permanente o significativa' },
      { value: 100, label: 'Riesgo inminente de muerte, muerte, aborto o muerte fetal' },
    ]
  },
  {
    id: 'conglomerado', label: 'Conglomerado de ESAVI',
    options: [
      { value: 0, label: 'Solo un caso reportado o eventos sin similitud temporal/clínica' },
      { value: 5, label: 'Dos casos similares, sin coincidencia de lote/lugar' },
      { value: 15, label: 'Dos o más casos con nexo común, sin confirmación nacional' },
      { value: 100, label: 'Múltiples casos confirmados con nexo (lote, fabricante, distribución)' },
    ]
  },
  {
    id: 'senal', label: 'Asociado a señal de seguridad cuantitativa',
    options: [
      { value: 0, label: 'Sin señal' },
      { value: 5, label: 'Señal en evaluación' },
      { value: 15, label: 'Señal confirmada nacionalmente' },
      { value: 100, label: 'Señal confirmada internacionalmente (OPS/OMS/EMA/FDA)' },
    ]
  },
  {
    id: 'vacuna', label: 'Nuevas vacunas / cambios de formulación',
    options: [
      { value: 0, label: 'Vacuna establecida en el esquema regular (>2 años)' },
      { value: 5, label: 'Vacuna introducida hace >6 meses y <2 años' },
      { value: 15, label: 'Introducida ≤6 meses o cambio de presentación' },
      { value: 100, label: 'Introducción reciente/campaña masiva o uso en emergencia' },
    ]
  }
];

const QUESTIONS_VULNERABILITY: RiskFactorDefinition[] = [
  {
    id: 'error', label: 'Error programático que genere un EAPV',
    options: [
      { value: 0, label: 'No hay evidencia de fallas en cadena de frío, preparación o administración' },
      { value: 5, label: 'Un evento aislado con posible error humano' },
      { value: 15, label: 'Prácticas inadecuadas confirmadas en servicio' },
      { value: 100, label: 'Falla confirmada que afecta a múltiples usuarios' },
    ]
  },
  {
    id: 'impacto', label: 'Impacto mediático / político / social',
    options: [
      { value: 0, label: 'Sin impacto mediático o gestionado localmente' },
      { value: 5, label: 'Reporte en medios locales o redes sociales con potencial de difusión' },
      { value: 15, label: 'Reporte en medios de alcance departamental' },
      { value: 100, label: 'Crisis mediática nacional o desinformación masiva' },
    ]
  },
  {
    id: 'calidad_biologico', label: 'Sospecha de desviación de calidad del biológico',
    options: [
      { value: 0, label: 'Sin sospecha de desviación de calidad' },
      { value: 5, label: 'Sospecha basada en apariencia sin confirmación' },
      { value: 15, label: 'Sospecha confirmada que afecta dosis limitadas' },
      { value: 100, label: 'Alerta confirmada (INVIMA/fabricante) de un lote completo' },
    ]
  }
];

const QUESTIONS_EXPOSURE: RiskFactorDefinition[] = [
  {
    id: 'grupos_especiales', label: 'Grupos especiales (neonatos, gestantes, ≥60 años)',
    options: [
      { value: 0, label: 'Ninguna población especial' },
      { value: 5, label: 'Un caso en un grupo especial afectado' },
      { value: 15, label: 'Dos o más casos en grupos especiales' },
      { value: 100, label: 'Tasa inusualmente elevada en poblaciones especiales' },
    ]
  },
  {
    id: 'grupos_riesgo', label: 'Grupos de mayor riesgo/precaución',
    options: [
      { value: 0, label: 'Sin condiciones de precaución' },
      { value: 15, label: 'Error programático por omisión de contraindicación (no fatal)' },
      { value: 100, label: 'Error programático por omisión de contraindicación (fatal)' },
    ]
  }
];

export default function MatrizRiesgo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('mode') === 'view';
  
  const { userEmail, currentRole } = useAuthStore();
  const avanzarCaso = useCasesStore(state => state.avanzarCaso);
  
  const componentRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { control, watch, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: INITIAL_STATE
  });

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      obtenerExpediente(id).then(exp => {
        if (exp.success && exp.data && exp.data.matriz) {
          // FirebaseService ya extrae y parsea datos_formulario_json en exp.data.matriz
          let loadedData: any = { ...exp.data.matriz };
          if (!loadedData.fechaReunionEvaluacion && exp.data.matriz.fecha_reunion) {
            loadedData.fechaReunionEvaluacion = exp.data.matriz.fecha_reunion;
          }
          
          // --- LOGICA DE RETROCOMPATIBILIDAD (Mapeo de Matriz Vieja a Matriz Nueva) ---
          // Si detectamos que es un formulario con la estructura vieja (ej. tiene desenlaceFatal y no gravedad)
          if (loadedData.desenlaceFatal !== undefined && loadedData.gravedad === undefined) {
             const old = loadedData;
             const mapped: any = { fechaReunionEvaluacion: old.fechaReunionEvaluacion || INITIAL_STATE.fechaReunionEvaluacion };
             
             // Convertimos a Number() todo para evitar que un string "3" no haga match con === 3
             const getNum = (val: any) => Number(val) || 0;

             // 1. Gravedad
             if (getNum(old.desenlaceFatal) === 3 || getNum(old.aborto) === 3 || getNum(old.muerteFetal) === 3) mapped.gravedad = 100;
             else if (getNum(old.anomaliaCongenita) === 3 || getNum(old.incapacidad) === 3) mapped.gravedad = 15;
             else if (getNum(old.hospitalizacion) === 3) mapped.gravedad = 5;
             else mapped.gravedad = 0;
             
             // 2. Conglomerado
             if (getNum(old.conglomerado) === 3) mapped.conglomerado = 100;
             else if (getNum(old.conglomerado) === 2) mapped.conglomerado = 15;
             else if (getNum(old.conglomerado) === 1) mapped.conglomerado = 5;
             else mapped.conglomerado = 0;
             
             // 3. Vacuna
             if (getNum(old.vacunaNueva) === 3) mapped.vacuna = 100;
             else if (getNum(old.vacunaNueva) === 2) mapped.vacuna = 15;
             else if (getNum(old.vacunaNueva) === 1) mapped.vacuna = 5;
             else mapped.vacuna = 0;
             
             // 4. Error Programático
             if (getNum(old.errorProgramatico) === 3) mapped.error = 100;
             else if (getNum(old.errorProgramatico) === 2) mapped.error = 15;
             else if (getNum(old.errorProgramatico) === 1) mapped.error = 5;
             else mapped.error = 0;
             
             // 5. Impacto
             if (getNum(old.atencionMedios) === 3 || getNum(old.rumorComunidad) === 3) mapped.impacto = 100;
             else if (getNum(old.atencionMedios) === 2) mapped.impacto = 15;
             else if (getNum(old.atencionMedios) === 1 || getNum(old.rumorComunidad) === 2) mapped.impacto = 5;
             else mapped.impacto = 0;
             
             // 6. Grupos Especiales
             if (getNum(old.grupoVulnerable) === 3) mapped.grupos_especiales = 100;
             else if (getNum(old.grupoVulnerable) === 2) mapped.grupos_especiales = 15;
             else if (getNum(old.grupoVulnerable) === 1) mapped.grupos_especiales = 5;
             else mapped.grupos_especiales = 0;

             // Migrar justificaciones si existen
             if (old.just_conglomerado) mapped.just_conglomerado = old.just_conglomerado;
             if (old.just_errorProgramatico) mapped.just_error = old.just_errorProgramatico;
             if (old.just_grupoVulnerable) mapped.just_grupos_especiales = old.just_grupoVulnerable;
             if (old.just_atencionMedios) mapped.just_impacto = old.just_atencionMedios;
             if (old.just_vacunaNueva) mapped.just_vacuna = old.just_vacunaNueva;
             
             // Las variables exclusivas de la nueva matriz (senal, calidad_biologico, capacidad_respuesta)
             // quedarán como undefined aquí y luego se setearán a -1 (Seleccione...) con INITIAL_STATE.
             loadedData = mapped;
          }

          const datosCasteados = { ...INITIAL_STATE, ...loadedData };
          Object.keys(datosCasteados).forEach(k => {
            if (k !== 'fechaReunionEvaluacion' && !k.startsWith('just_')) {
              const val = Number(datosCasteados[k]);
              datosCasteados[k] = isNaN(val) ? -1 : val;
            }
          });
          reset(datosCasteados);
        }
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [id, reset]);

  const valores = watch();

  const totalScore = useMemo(() => {
    const keys = [
      'capacidad_respuesta', 'gravedad', 'conglomerado', 'senal', 'vacuna',
      'error', 'impacto', 'calidad_biologico', 'grupos_especiales', 'grupos_riesgo'
    ];
    let sum = 0;
    for (let k of keys) {
      const val = Number(valores[k as keyof typeof valores]);
      if (!isNaN(val) && val > -1) {
        sum += val;
      }
    }
    return sum;
  }, [valores]);

  const riskConfig = useMemo(() => {
    let key: RiskLevelKey = 'noRisk';
    if (totalScore >= 500) key = 'critical';
    else if (totalScore >= 250) key = 'high';
    else if (totalScore >= 100) key = 'moderate';
    else if (totalScore >= 10) key = 'low';
    return RISK_LEVELS[key];
  }, [totalScore]);

  const onSubmit = async (data: any) => {
    if (!data.fechaReunionEvaluacion) {
      alert("Debe indicar la Fecha de Reunión de Evaluación antes de guardar.");
      return;
    }

    if (id) {
      setIsSubmitting(true);
      
      const payloadMatriz = {
        tabla: 'MATRIZ_RIESGO',
        datos: {
          id_matriz: `MATRIZ-${Date.now()}`,
          id_caso: id,
          fecha_reunion: data.fechaReunionEvaluacion,
          puntaje_compuesto: totalScore,
          nivel_riesgo_final: riskConfig.etiquetaHistorica,
          datos_formulario_json: JSON.stringify(data)
        }
      };

      if (import.meta.env.VITE_USE_API === 'true') {
        try {
          await guardarEnSheets('MATRIZ_RIESGO', payloadMatriz.datos);
          const msg = `Reunión de evaluación realizada el ${data.fechaReunionEvaluacion}. Nivel de riesgo: ${riskConfig.etiquetaHistorica} (${riskConfig.level}).`;
          await registrarLog(id, userEmail || 'desconocido', msg);

          await crearNotificacion({
            id_caso: id,
            rol_destino: 'SECRETARIADO',
            texto: `Se ha completado la Matriz de Riesgo para el caso ${id}. Nivel asignado: ${riskConfig.etiquetaHistorica}. El caso avanza a Asignación de ERR.`
          });

        } catch (error) {
          console.error("Error al guardar la matriz en Sheets", error);
          alert("Hubo un error de conexión con la base de datos central. No se guardó el riesgo.");
          setIsSubmitting(false);
          return;
        }
      }

      const msg = `Reunión de evaluación realizada el ${data.fechaReunionEvaluacion}. Nivel de riesgo: ${riskConfig.etiquetaHistorica} (Puntaje Total: ${totalScore}). El caso ha sido oficializado y asignado a ERR.`;
      
      avanzarCaso(id, 'ASIGNADO_A_ERR', 'Fase 3: Asignación ERR', msg, riskConfig.etiquetaHistorica);
      
      alert("Matriz guardada y caso oficializado correctamente");
      navigate(`/caso/${id}`);
    } else {
      alert("Error: No se encontró el ID del expediente.");
      navigate(-1);
    }
  };

  const generarSitRepPDF = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'SitRep_ESAVI',
  });

  const handleReset = () => {
    reset(INITIAL_STATE);
  };

  if (isLoading) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column' }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ mt: 2 }}>Cargando Matriz de Riesgo...</Typography>
      </Backdrop>
    );
  }

  if (!isViewMode && currentRole !== 'ESAVI_INSTITUCIONAL' && (currentRole as any) !== 'SUPERADMIN') {
    return (
      <Box sx={{ p: 4, maxWidth: 600, margin: 'auto', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Acceso Restringido:</strong> Solo el rol de ESAVI Institucional (Equipo Coordinador) puede evaluar y registrar la Matriz de Riesgo.
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>Volver al Expediente</Button>
      </Box>
    );
  }

  const renderSection = (title: string, icon: React.ReactNode, questions: RiskFactorDefinition[], color: string) => (
    <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, borderTop: `4px solid ${color}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ color: color, mr: 2, display: 'flex' }}>{icon}</Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: color }}>{title}</Typography>
      </Box>
      <Grid container spacing={4}>
        {questions.map((q) => (
          <Grid size={{ xs: 12, md: 6 }} key={q.id}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'bold' }}>
              {q.label}
            </Typography>
            <Controller
              name={q.id as any}
              control={control}
              render={({ field }) => (
                <TextField 
                  {...field} 
                  select 
                  fullWidth 
                  size="small" 
                  variant="outlined" 
                  disabled={isViewMode}
                  sx={{ bgcolor: field.value > -1 ? '#f0fdf4' : '#fafafa', mb: 1 }}
                >
                  <MenuItem value={-1}>Seleccione...</MenuItem>
                  {q.options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value} pts)
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name={`just_${q.id}` as any}
              control={control}
              render={({ field }) => (
                <TextField 
                  {...field} 
                  fullWidth 
                  size="small" 
                  placeholder="Justificación breve..." 
                  variant="standard" 
                  disabled={isViewMode}
                />
              )}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pb: 10 }} ref={componentRef}>
      
      {/* BARRA SUPERIOR FLOTANTE */}
      <Paper elevation={4} sx={{ p: 2, mb: 3, position: 'sticky', top: 64, zIndex: 100, borderBottom: '4px solid', borderColor: 'secondary.main', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', xl: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', xl: 'center' }, gap: 2, mb: 2 }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', textAlign: { xs: 'center', xl: 'left' } }}>
            Matriz de Riesgo ESAVI Avanzada <Typography component="span" variant="subtitle1" color="text.secondary">(Llenado por: ESAVI Institucional)</Typography>
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' } }}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={isSubmitting} fullWidth>{isViewMode ? 'Volver' : 'Cancelar'}</Button>
              {!isViewMode && (
                <>
                  <Button onClick={handleReset} variant="outlined" color="error" startIcon={<AutorenewIcon />} disabled={isSubmitting} fullWidth>
                    Reiniciar
                  </Button>
                  <Button type="submit" variant="contained" color="secondary" startIcon={<CalculateIcon />} size="large" disabled={isSubmitting} fullWidth>
                    {isSubmitting ? 'Guardando...' : 'Guardar Evaluación'}
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Información de la Evaluación (Obligatorio)</Typography>
            <Controller
              name="fechaReunionEvaluacion"
              control={control}
              rules={{ required: "Debe ingresar la fecha de la reunión" }}
              render={({ field }) => (
                <TextField 
                  {...field} 
                  type="date" 
                  label="Fecha de Reunión de Evaluación" 
                  slotProps={{ htmlInput: { readOnly: true }, inputLabel: { shrink: true } }} 
                  error={!!errors.fechaReunionEvaluacion}
                  helperText={errors.fechaReunionEvaluacion ? String(errors.fechaReunionEvaluacion.message) : ""}
                  sx={{ width: { xs: '100%', md: '300px' }, bgcolor: 'white' }}
                  required
                />
              )}
            />
          </Paper>

          {renderSection("1. Amenaza", <WarningAmberIcon fontSize="large" />, QUESTIONS_THREAT, "#0284c7")}
          {renderSection("2. Vulnerabilidad", <ShieldIcon fontSize="large" />, QUESTIONS_VULNERABILITY, "#059669")}
          {renderSection("3. Exposición / Población", <GroupIcon fontSize="large" />, QUESTIONS_EXPOSURE, "#6d28d9")}
          {renderSection("4. Capacidad de Respuesta", <HealthAndSafetyIcon fontSize="large" />, QUESTIONS_CAPACITY, "#4338ca")}

        </Grid>

        {/* COLUMNA DERECHA: RESULTADO */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ position: 'sticky', top: 180 }}>
            <Paper elevation={4} sx={{ overflow: 'hidden', borderRadius: 3 }}>
              <Box sx={{ p: 2, bgcolor: riskConfig.colorMui === 'error' ? '#d32f2f' : riskConfig.colorMui === 'warning' ? '#ed6c02' : '#2e7d32', color: 'white', textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Valoración del Riesgo</Typography>
              </Box>
              
              <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <CircularGauge variant="determinate" value={100} size={160} thickness={4} sx={{ color: '#e0e0e0' }} />
                  <CircularGauge 
                    variant="determinate" 
                    value={Math.min((totalScore / 800) * 100, 100)} 
                    size={160} 
                    thickness={4} 
                    color={riskConfig.colorMui}
                    sx={{ position: 'absolute', left: 0 }} 
                  />
                  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant="caption" color="text.secondary">Puntaje</Typography>
                    <Typography variant="h4" component="div" color="text.primary" sx={{ fontWeight: 'bold' }}>
                      {totalScore}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ bgcolor: `${riskConfig.colorMui}.light`, color: `${riskConfig.colorMui}.contrastText`, px: 3, py: 1, borderRadius: 8, mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {riskConfig.level}
                  </Typography>
                </Box>

                <Box sx={{ width: '100%', textAlign: 'left' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                    <HealthAndSafetyIcon sx={{ mr: 1, fontSize: 20 }} /> Nivel de Respuesta
                  </Typography>
                  <Typography variant="body2" sx={{ pl: 3, mb: 2, color: 'text.primary' }}>
                    {riskConfig.response}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                    <AutorenewIcon sx={{ mr: 1, fontSize: 20 }} /> Flujo del Sistema
                  </Typography>
                  <Typography variant="body2" sx={{ pl: 3, color: 'text.primary' }}>
                    Etiquetado internamente como <strong>{riskConfig.etiquetaHistorica}</strong> con respuesta <strong>{riskConfig.nivelRespuestaHistorico}</strong> para compatibilidad.
                  </Typography>
                </Box>
              </Box>

              {/* BOTÓN CONDICIONAL SITREP */}
              {totalScore >= 250 && (
                <Box sx={{ p: 2, bgcolor: '#fff5f5', borderTop: '1px solid #ffebee' }}>
                  <Button 
                    variant="contained" 
                    color="error" 
                    startIcon={<PictureAsPdfIcon />} 
                    onClick={generarSitRepPDF}
                    fullWidth
                    sx={{ py: 1.5, fontWeight: 'bold' }}
                  >
                    Descargar SitRep (PDF)
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}