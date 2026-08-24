import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, TextField, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useReactToPrint } from 'react-to-print';
import { useNavigate, useParams } from 'react-router-dom';
import { useRef } from 'react';
import { useCasesStore } from '../../../store/useCasesStore';

export default function MatrizRiesgo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const avanzarCaso = useCasesStore(state => state.avanzarCaso);
  const componentRef = useRef<HTMLDivElement>(null);

  // Inicializamos todos los puntajes en 0 y las justificaciones vacías
  const { control, watch, handleSubmit } = useForm({
    defaultValues: {
      desenlaceFatal: 0, just_desenlaceFatal: '',
      hospitalizacion: 0, just_hospitalizacion: '',
      aborto: 0, just_aborto: '',
      muerteFetal: 0, just_muerteFetal: '',
      anomaliaCongenita: 0, just_anomaliaCongenita: '',
      incapacidad: 0, just_incapacidad: '',
      eventoNuevo: 0, just_eventoNuevo: '',
      eventoPrevenible: 0, just_eventoPrevenible: '',
      reversibilidad: 0, just_reversibilidad: '',
      mortalidadAsociada: 0, just_mortalidadAsociada: '',
      conglomerado: 0, just_conglomerado: '',
      
      grupoVulnerable: 0, just_grupoVulnerable: '',
      
      vacunaNueva: 0, just_vacunaNueva: '',
      errorProgramatico: 0, just_errorProgramatico: '',
      
      rumorComunidad: 0, just_rumorComunidad: '',
      atencionMedios: 0, just_atencionMedios: '',
    }
  });

  const valores = watch();

  // Cálculos de Subtotales en vivo
  const subtotalEvento = 
    Number(valores.desenlaceFatal) + Number(valores.hospitalizacion) + Number(valores.aborto) + 
    Number(valores.muerteFetal) + Number(valores.anomaliaCongenita) + Number(valores.incapacidad) + 
    Number(valores.eventoNuevo) + Number(valores.eventoPrevenible) + Number(valores.reversibilidad) + 
    Number(valores.mortalidadAsociada) + Number(valores.conglomerado);
  
  const subtotalPersona = Number(valores.grupoVulnerable);
  
  const subtotalVacuna = Number(valores.vacunaNueva) + Number(valores.errorProgramatico);

  const subtotalContexto = Number(valores.rumorComunidad) + Number(valores.atencionMedios);

  // 1. Motor de Normalización (Puntaje Compuesto)
  const maxEvento = 11 * 3; // 33
  const maxPersona = 1 * 3; // 3
  const maxVacuna = 2 * 3; // 6
  const maxContexto = 2 * 3; // 6

  const pctEvento = (subtotalEvento / maxEvento) * 40;
  const pctPersona = (subtotalPersona / maxPersona) * 15;
  const pctVacuna = (subtotalVacuna / maxVacuna) * 25;
  const pctContexto = (subtotalContexto / maxContexto) * 20;

  const puntajeCompuesto = Math.round(pctEvento + pctPersona + pctVacuna + pctContexto);

  // 2. Lógica Bidimensional (Probabilidad y Consecuencia)
  const calcularProbabilidad = (puntaje: number) => {
    if (puntaje >= 86) return 5;
    if (puntaje >= 71) return 4;
    if (puntaje >= 51) return 3;
    if (puntaje >= 31) return 2;
    return 1;
  };

  const calcularConsecuencia = (puntaje: number) => {
    if (puntaje >= 76) return 5;
    if (puntaje >= 56) return 4;
    if (puntaje >= 31) return 3;
    if (puntaje >= 16) return 2;
    return 1;
  };

  const probabilidad = calcularProbabilidad(puntajeCompuesto);
  const consecuencia = calcularConsecuencia(puntajeCompuesto);

  // 3. Matriz Final (Índice de Riesgo)
  const indiceRiesgo = probabilidad * consecuencia; // 1 a 25

  const obtenerNivelRiesgo = (indice: number) => {
    if (indice >= 19) {
      return { 
        etiqueta: 'RIESGO CRÍTICO', 
        nivelRespuesta: 'NACIONAL',
        color: 'error' as const, 
        mensaje: 'Respuesta NACIONAL inmediata. Involucre al Nivel Central y elabore Reporte de Situación.' 
      };
    } else if (indice >= 13) {
      return { 
        etiqueta: 'RIESGO ALTO', 
        nivelRespuesta: 'REGIONAL',
        color: 'warning' as const, 
        mensaje: 'Respuesta REGIONAL. Defina plan de captura y notifique a la Jefatura Regional.' 
      };
    } else if (indice >= 6) { 
      return { 
        etiqueta: 'RIESGO MODERADO', 
        nivelRespuesta: 'DEPARTAMENTAL',
        color: 'warning' as const, 
        mensaje: 'Respuesta DEPARTAMENTAL. La investigación y coordinación del caso se delega a la Jefatura Departamental correspondiente.' 
      };
    } else {
      return { 
        etiqueta: 'RIESGO BAJO', 
        nivelRespuesta: 'LOCAL',
        color: 'success' as const, 
        mensaje: 'Respuesta LOCAL. Defina plan de investigación a nivel local e informe resultados.' 
      };
    }
  };

  const riesgoActual = obtenerNivelRiesgo(indiceRiesgo);

  const onSubmit = (data: any) => {
    if (id) {
      const msg = `Se determinó nivel de riesgo ${riesgoActual.etiqueta} (Ptje Compuesto: ${puntajeCompuesto}, Prob: ${probabilidad}, Cons: ${consecuencia}, Índice Final: ${indiceRiesgo}). Caso asignado a ERR.`;
      avanzarCaso(id, 'ASIGNADO_A_ERR', 'Fase 3: Asignación ERR', msg, riesgoActual.etiqueta);
      navigate(`/caso/${id}`);
    } else {
      alert("Error: No se encontró el ID del expediente.");
      navigate(-1);
    }
  };

  // =========================================================================
  // MISIÓN: FUNCIÓN GENERADORA DE REPORTE SITREP USANDO REACT-TO-PRINT
  // =========================================================================
  const generarSitRepPDF = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'SitRep_ESAVI',
  });

  // Función de ayuda para renderizar las filas de la tabla
  const renderRow = (id: string, label: string, options: {val: number, label: string}[]) => (
    <TableRow key={id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell component="th" scope="row" sx={{ width: '25%', fontWeight: 'bold' }}>
        {label}
      </TableCell>
      <TableCell sx={{ width: '45%' }}>
        <Controller
          name={id as any} control={control}
          render={({ field }) => (
            <TextField {...field} select fullWidth size="small" variant="outlined" sx={{ bgcolor: field.value > 0 ? '#fff3e0' : 'transparent' }}>
              {options.map((opt) => (
                <MenuItem key={opt.val} value={opt.val}>
                  {opt.val} - {opt.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </TableCell>
      <TableCell sx={{ width: '30%' }}>
        <Controller
          name={`just_${id}` as any} control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth size="small" placeholder="Justificación breve..." variant="standard" />
          )}
        />
      </TableCell>
    </TableRow>
  );

  // Opciones estándar de Sí/No (0 y 3)
  const optBinarias = [
    { val: 0, label: 'No' },
    { val: 3, label: 'Sí' }
  ];

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pb: 10 }} ref={componentRef}>
      
      {/* BARRA SUPERIOR FLOTANTE */}
      <Paper elevation={4} sx={{ p: 2, mb: 3, position: 'sticky', top: 64, zIndex: 100, borderBottom: '4px solid', borderColor: 'secondary.main' }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
            Matriz de Riesgo ESAVI
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Ptje. Compuesto</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{puntajeCompuesto}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Probabilidad</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{probabilidad}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Consecuencia</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{consecuencia}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Índice Final</Typography>
                <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold', lineHeight: 1 }}>{indiceRiesgo}</Typography>
              </Box>
              <Chip 
                label={riesgoActual.etiqueta} 
                color={riesgoActual.color} 
                sx={{ fontWeight: 'bold', fontSize: '1rem', height: '40px', ml: 1 }} 
              />
            </Box>
            
            <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar y Volver</Button>
            <Button type="submit" variant="contained" color="secondary" startIcon={<CalculateIcon />} size="large">
              Guardar Evaluación
            </Button>
          </Box>
        </Box>

        {/* ALERT DINÁMICO DE RESPUESTA */}
        <Alert 
          severity={riesgoActual.color === 'error' ? 'error' : riesgoActual.color === 'warning' ? 'warning' : 'success'} 
          sx={{ 
            fontWeight: 'bold', 
            bgcolor: riesgoActual.nivelRespuesta === 'DEPARTAMENTAL' ? '#fffde7' : undefined 
          }}
        >
          Nivel de Respuesta: {riesgoActual.nivelRespuesta} ({riesgoActual.etiqueta}). {riesgoActual.mensaje}
        </Alert>

        {/* BOTÓN CONDICIONAL SITREP (SOLO ALTO O CRÍTICO >= 13 de índice) */}
        {indiceRiesgo >= 13 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="error" 
              startIcon={<PictureAsPdfIcon />} 
              onClick={generarSitRepPDF}
            >
              Descargar SitRep (PDF)
            </Button>
          </Box>
        )}

      </Paper>

      {/* DIMENSIÓN 1: EVENTO (40%) */}
      <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#4db6ac' }}>
              <TableCell colSpan={3}>
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>Dimensión: EVENTO (40%) | Subtotal: {subtotalEvento}</Typography>
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Subcriterio</strong></TableCell>
              <TableCell><strong>Guía de Selección</strong></TableCell>
              <TableCell><strong>Justificación</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderRow('desenlaceFatal', 'Desenlace fatal', [{ val: 0, label: 'No' }, { val: 3, label: 'Sí, muerte asociada temporalmente al ESAVI' }])}
            {renderRow('hospitalizacion', 'Hospitalización', [{ val: 0, label: 'No' }, { val: 3, label: 'Sí, requirió hospitalización o prolongación' }])}
            {renderRow('aborto', 'Aborto', optBinarias)}
            {renderRow('muerteFetal', 'Muerte fetal', optBinarias)}
            {renderRow('anomaliaCongenita', 'Anomalía congénita', optBinarias)}
            {renderRow('incapacidad', 'Incapacidad significativa', optBinarias)}
            {renderRow('eventoNuevo', 'Evento nuevo o inesperado', [
              { val: 0, label: 'Evento conocido con frecuencia habitual' },
              { val: 1, label: 'Evento conocido con frecuencia mayor a la esperada' },
              { val: 2, label: 'Evento nuevo reportado en literatura/autoridades' },
              { val: 3, label: 'Evento nuevo/inesperado para la vacuna NO reportado' }
            ])}
            {renderRow('eventoPrevenible', 'Evento prevenible', [
              { val: 0, label: 'No prevenible' },
              { val: 1, label: 'Prevenible mediante estrategias de alto costo' },
              { val: 2, label: 'Prevenible evitando exposición en factores de riesgo' },
              { val: 3, label: 'Prevenible mediante la aplicación correcta de POE' }
            ])}
            {renderRow('reversibilidad', 'Reversibilidad del evento', [
              { val: 0, label: 'Totalmente reversible sin tratamiento' },
              { val: 1, label: 'Reversible solo con tratamiento adecuado y oportuno' },
              { val: 2, label: 'Parcialmente reversible con tratamiento' },
              { val: 3, label: 'Poco o nada reversible con tratamiento' }
            ])}
            {renderRow('mortalidadAsociada', 'Mortalidad asociada elevada', [
              { val: 0, label: 'Mortalidad nula sin tratamiento' },
              { val: 1, label: 'Mortalidad nula-baja con tratamiento' },
              { val: 2, label: 'Mortalidad moderada con tratamiento' },
              { val: 3, label: 'Mortalidad elevada aún con tratamiento' }
            ])}
            {renderRow('conglomerado', 'Conglomerado de casos', [
              { val: 0, label: 'Caso aislado' },
              { val: 1, label: 'Dos o más casos del mismo evento posterior a vacuna' },
              { val: 2, label: 'Dos o más casos vinculados temporal y/o espacialmente' },
              { val: 3, label: 'Conglomerado vinculado temporal, espacial, lote/fabricante' }
            ])}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIMENSIÓN 2: PERSONA (15%) */}
      <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#9575cd' }}>
              <TableCell colSpan={3}>
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>Dimensión: PERSONA (15%) | Subtotal: {subtotalPersona}</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderRow('grupoVulnerable', 'Grupo vulnerable', [
              { val: 0, label: 'No vulnerable' },
              { val: 1, label: 'Vulnerabilidad leve' },
              { val: 2, label: 'Moderada' },
              { val: 3, label: 'Alta (niños, gestantes, inmunocompromiso)' }
            ])}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIMENSIÓN 3: VACUNA/PROGRAMA */}
      <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#dce775' }}>
              <TableCell colSpan={3}>
                <Typography variant="subtitle1" sx={{ color: 'black', fontWeight: 'bold' }}>Dimensión: VACUNA / PROGRAMA | Subtotal: {subtotalVacuna}</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderRow('vacunaNueva', 'Vacuna nueva (<5 años)', [
              { val: 0, label: 'No' },
              { val: 1, label: '4 a 5 años' },
              { val: 2, label: '2 a 3 años' },
              { val: 3, label: 'Sí, vacuna de reciente introducción' }
            ])}
            {renderRow('errorProgramatico', 'Sospecha de error programático', [
              { val: 0, label: 'No hay evidencia de fallas' },
              { val: 1, label: 'Evento aislado con posible error humano' },
              { val: 2, label: 'Evento sospechoso de EPRO reportado en establecimiento' },
              { val: 3, label: 'Fuerte sospecha de error programático repetitivo' }
            ])}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DIMENSIÓN 4: CONTEXTO (20%) */}
      <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#ffb74d' }}>
              <TableCell colSpan={3}>
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>Dimensión: CONTEXTO (20%) | Subtotal: {subtotalContexto}</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderRow('rumorComunidad', 'Rumor en la comunidad', [
              { val: 0, label: 'Ninguno' },
              { val: 1, label: 'Leve rumor local' },
              { val: 2, label: 'Rumor generalizado en la comunidad' },
              { val: 3, label: 'Fuerte rechazo comunitario o manifestaciones' }
            ])}
            {renderRow('atencionMedios', 'Atención mediática', [
              { val: 0, label: 'Ninguna' },
              { val: 1, label: 'Mención local en redes' },
              { val: 2, label: 'Noticia en medios locales' },
              { val: 3, label: 'Cobertura mediática nacional/internacional' }
            ])}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
}