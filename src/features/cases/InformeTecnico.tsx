import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, CircularProgress, Grid, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { obtenerExpediente } from '../../services/firebaseService';

export default function InformeTecnico() {
  const { id } = useParams();
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, '@media print': { display: 'none' } }}>
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
        <Table size="small">
          <TableBody>
            <TableRow><TableCell sx={{ fontWeight: 'bold', width: '40%' }}>ID de Caso</TableCell><TableCell>{expediente.id}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha del informe</TableCell><TableCell>{new Date().toLocaleDateString()}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>País de origen del caso</TableCell><TableCell>El Salvador</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Institución notificadora</TableCell><TableCell>{expediente.establecimiento_salud || expediente.notificador_establecimiento || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Edad</TableCell><TableCell>{expediente.edad_paciente} {expediente.unidad_edad}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Sexo</TableCell><TableCell>{expediente.sexo_paciente || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha de última vacunación</TableCell><TableCell>{expediente.fecha_vacunacion || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Vacuna(s) administradas</TableCell><TableCell>{expediente.nombre_vacuna || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Diagnóstico</TableCell><TableCell>{expediente.diagnostico_principal || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Nivel de certeza diagnóstica</TableCell><TableCell>{anexoVII?.datos_formulario_json?.certeza_diagnostica || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha de inicio de síntomas</TableCell><TableCell>{expediente.fecha_inicio_sintomas || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Fecha de defunción</TableCell><TableCell>{expediente.fecha_defuncion || 'N/A'}</TableCell></TableRow>
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
        {expediente.descripcion_caso || 'Sin descripción inicial registrada.'}
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        3. ANTECEDENTES MÉDICOS DEL CASO
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Antecedentes clínicos:</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>{anexoVII?.datos_formulario_json?.antecedentes_clinicos || 'No registrado.'}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Antecedentes farmacológicos:</Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>{anexoVII?.datos_formulario_json?.medicamentos_previos || 'No registrado.'}</Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        4. ANTECEDENTES EPIDEMIOLÓGICOS
      </Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>{anexoVI?.datos_formulario_json?.antecedentes_epidemiologicos || 'Revisar ficha de investigación domiciliaria.'}</Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        5. ANTECEDENTES DE INMUNIZACIONES
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Variable</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Vacuna Administrada</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow><TableCell>Nombre de la vacuna</TableCell><TableCell>{expediente.nombre_vacuna}</TableCell></TableRow>
            <TableRow><TableCell>Fecha de vacunación</TableCell><TableCell>{expediente.fecha_vacunacion}</TableCell></TableRow>
            <TableRow><TableCell>Hora de vacunación</TableCell><TableCell>{expediente.hora_vacunacion || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell>Número de lote</TableCell><TableCell>{expediente.lote_vacuna || 'N/A'}</TableCell></TableRow>
            <TableRow><TableCell>Sitio de administración</TableCell><TableCell>{anexoV?.datos_formulario_json?.sitio_administracion || 'N/A'}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 1, mb: 2 }}>
        6. CLASIFICACIÓN DE RIESGO DEL EVENTO
      </Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>
        Nivel determinado por Matriz de Riesgo: <strong>{expediente.riesgo || 'No evaluado'}</strong>
        <br/>
        Justificación: {matriz?.justificacion_riesgo || 'N/A'}
      </Typography>

    </Box>
  );
}
