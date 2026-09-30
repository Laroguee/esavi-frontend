import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, CircularProgress, Grid, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { obtenerExpediente } from '../../services/firebaseService';

export default function InformeTecnico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const res = await obtenerExpediente(id);
        if (res.success && res.data) {
          setData(res.data);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || !data.expediente) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">Expediente no encontrado</Typography>
      </Box>
    );
  }

  const { expediente, matriz, anexos } = data;

  const anexoVII = anexos?.find((a: any) => a.tipo_anexo?.includes('Clínico'));
  const anexoVI = anexos?.find((a: any) => a.tipo_anexo?.includes('Domicilio'));
  const anexoV = anexos?.find((a: any) => a.tipo_anexo?.includes('Puesto'));
  const anexoIII = anexos?.find((a: any) => a.tipo_anexo?.includes('Logística'));

  return (
    <Box sx={{ p: 4, maxWidth: 1000, margin: '0 auto', bgcolor: '#fff', color: '#000' }}>
      {/* Botón de impresión oculto en pantalla impresa */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, '@media print': { display: 'none' } }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Volver al Expediente
        </Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Imprimir Informe
        </Button>
      </Box>

      <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>
        ORGANIZACIÓN PANAMERICANA DE LA SALUD / ORGANIZACIÓN MUNDIAL DE LA SALUD
      </Typography>
      <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
        INFORME TÉCNICO: ESAVI CON DESENLACE FATAL POSTERIOR A LA ADMINISTRACIÓN DE VACUNAS DEL ESQUEMA REGULAR
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        DATOS GENERALES DEL CASO Y TRAZABILIDAD REGULATORIA
      </Typography>
      
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 0 }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableBody>
            <TableRow><TableCell sx={{ fontWeight: 'bold', width: '40%' }}>ID de Caso</TableCell><TableCell>{expediente.id}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha del informe</TableCell><TableCell>{new Date().toLocaleDateString()}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>País de origen del caso</TableCell><TableCell>El Salvador</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Nivel subnacional del reporte</TableCell><TableCell>{expediente.nivel_subnacional_reporte || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Institución notificadora</TableCell><TableCell>{expediente.establecimiento_notificador || expediente.establecimiento_salud || expediente.notificador_establecimiento || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Edad</TableCell><TableCell>{expediente.edad} {expediente.unidad_edad || 'Años'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Sexo</TableCell><TableCell>{expediente.sexo || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha de última vacunación</TableCell><TableCell>{expediente.fecha_vacunacion || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Vacuna(s) administradas</TableCell><TableCell>{expediente.nombre_vacuna || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Diagnóstico</TableCell><TableCell>{anexoVII?.datos_formulario_json?.diagnosticoFinal || expediente.diagnostico_principal || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Nivel de certeza diagnóstica</TableCell><TableCell>{anexoVII?.datos_formulario_json?.certeza_diagnostica || 'No evaluado'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha de inicio de síntomas</TableCell><TableCell>{expediente.fecha_inicio_sintomas || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha de hospitalización</TableCell><TableCell>{anexoVII?.datos_formulario_json?.fechaHospitalizacion || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha de defunción</TableCell><TableCell>{expediente.fecha_defuncion || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha de necropsia</TableCell><TableCell>{anexoVII?.datos_formulario_json?.fechaPrevistaAutopsia || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha de evaluación de causalidad</TableCell><TableCell>{expediente.historial_cambios?.find((h:any) => h.accion?.includes('APROBADO_PARA_COMITE'))?.fecha || 'Pendiente'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Clasificación final otorgada</TableCell><TableCell>{expediente.estadoFlujo || 'N/A'}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        1. OBJETIVO DEL INFORME
      </Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>
        * Analizar en forma pormenorizada la información disponible del caso, identificando los datos faltantes que se recomienda deben ser colectados a lo largo de la investigación.
        <br/>
        * Retroalimentar a los equipos locales responsables de la vigilancia de ESAVI sobre las mejores prácticas a implementar para la investigación de casos.
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        2. RESUMEN EJECUTIVO DE SITUACIÓN
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, whiteSpace: 'pre-wrap' }}>
        <strong>Descripción Inicial: </strong> {expediente.descripcion_caso || 'Sin descripción inicial registrada.'}<br/><br/>
        <strong>Síntomas Reportados: </strong> {expediente.sintomas || 'N/A'}<br/>
        <strong>Desarrollo del evento: </strong> {expediente.notas_pre_fase4 || 'N/A'}<br/>
        <strong>Notas de Cierre (Fase 5): </strong> {expediente.notas_cierre || 'No hay notas de cierre del secretariado.'}
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        3. ANTECEDENTES MÉDICOS DEL CASO
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Antecedentes clínicos:</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>{anexoVII?.datos_formulario_json?.hosp30Dias ? `Hospitalización en los últimos 30 días: ${anexoVII.datos_formulario_json.hosp30Dias}. ${anexoVII.datos_formulario_json.obs_hosp30Dias || ''}` : 'No evaluado / N/A'}</Typography>
      
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Antecedentes quirúrgicos / Perinatales:</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>{anexoVII?.datos_formulario_json?.embarazada === 'SI' ? `Embarazada (${anexoVII.datos_formulario_json.semGestacion} semanas). Desenlace: ${anexoVII.datos_formulario_json.desenlaceEmbarazo || 'N/A'}` : 'No aplica / N/A'}</Typography>
      
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Antecedentes de consumo de medicamentos (Farmacológicos):</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>{anexoVII?.datos_formulario_json?.medicamentos_previos || 'N/A'}</Typography>
      
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Antecedentes familiares / sociales:</Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>{anexoVII?.datos_formulario_json?.antFamiliares ? `Familiares: ${anexoVII.datos_formulario_json.antFamiliares}. Sociales: ${anexoVII.datos_formulario_json.otrosAntSociales || 'N/A'}` : 'N/A'}</Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        4. ANTECEDENTES EPIDEMIOLÓGICOS
      </Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>
        <strong>Hallazgos Domiciliarios: </strong> {anexoVI?.datos_formulario_json?.comentarios_generales || 'No se registraron comentarios generales en el anexo domiciliario.'}
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        5. ANTECEDENTES DE INMUNIZACIONES
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}><strong>Fuente de información:</strong> Registro Nacional de Inmunizaciones (RNI) / Carné de vacunación</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 0 }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Variable / Parámetro</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Vacuna Administrada</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow><TableCell>Nombre de la vacuna (RNI)</TableCell><TableCell>{expediente.nombre_vacuna}</TableCell></TableRow>
            <TableRow><TableCell>Fecha de vacunación</TableCell><TableCell>{expediente.fecha_vacunacion}</TableCell></TableRow>
            <TableRow><TableCell>Hora de vacunación</TableCell><TableCell>{expediente.hora_vacunacion || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell>Lugar de vacunación</TableCell><TableCell>{expediente.establecimiento_vacunacion || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell>Fabricante</TableCell><TableCell>{anexoV?.datos_formulario_json?.fabricante || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell>Número de lote</TableCell><TableCell>{expediente.lote_vacuna || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell>Ruta y Sitio Anatómico</TableCell><TableCell>{anexoV?.datos_formulario_json?.via_administracion || expediente.via_administracion || 'N/A'} - {anexoV?.datos_formulario_json?.sitio_administracion || 'N/A'}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        6. RESUMEN DEL CASO (CRONOLOGÍA CLÍNICA)
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, whiteSpace: 'pre-wrap' }}>
        {anexoVII?.datos_formulario_json?.signosCronologicos || 'Cronología clínica no detallada en el Anexo VII.'}
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        7. INFORMACIÓN DE LA INVESTIGACIÓN DEL CASO
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>7.1. Resumen de hallazgos de investigación clínica:</Typography>
      <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
        {anexoVII?.datos_formulario_json?.resumenParaclinico || 'Sin resumen clínico/paraclínico registrado.'}<br/>
        <strong>Resultados Necropsia:</strong> {anexoVII?.datos_formulario_json?.datosNecropsia || 'N/A'}
      </Typography>

      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>7.2. Resumen de hallazgos relacionados con la vacuna y de farmacovigilancia:</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <strong>Logística y Cadena de Frío: </strong> {anexoIII?.datos_formulario_json?.observaciones_cadena_frio || 'N/A'}
      </Typography>

      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>7.3. Resumen de hallazgos relacionados con el puesto de vacunación:</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {anexoV?.datos_formulario_json?.observaciones_preparacion || 'No hay observaciones sobre la preparación/administración.'}
      </Typography>

      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>7.4. Resumen de hallazgos de la investigación epidemiológica:</Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>
        {anexoVI?.datos_formulario_json?.conclusion_epidemiologica || 'N/A'}
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        8. CLASIFICACIÓN DE RIESGO DEL EVENTO
      </Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>
        Nivel determinado por Matriz de Riesgo: <strong>{expediente.riesgo || 'No evaluado'}</strong>
        <br/>
        Justificación: {matriz?.justificacion_riesgo || 'N/A'}
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        9. SITUACIÓN COMUNICACIONAL DEL EVENTO
      </Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>
        No se ha documentado información mediática relevante o repercusión en medios de comunicación para este caso hasta el momento de cierre de las investigaciones.
      </Typography>

    </Box>
  );
}
