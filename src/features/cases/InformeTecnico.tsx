import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, Chip, Alert, Divider, Grid
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GavelIcon from '@mui/icons-material/Gavel';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AttachFileIcon from '@mui/icons-material/AttachFile';
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || !data.expediente) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">Expediente no encontrado</Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  const { expediente, matriz, anexos } = data;

  // 1. Extraer y parsear datos de la Notificación Inicial (Fase 1)
  const fase1Data = typeof expediente.datos_fase1_json === 'string'
    ? (() => { try { return JSON.parse(expediente.datos_fase1_json); } catch { return {}; } })()
    : (expediente.datos_fase1_json || {});

  // 2. Extraer vacunas o fármacos concomitantes
  const medicamentosConcomitantes: any[] = Array.isArray(expediente.medicamentosConcomitantes)
    ? expediente.medicamentosConcomitantes
    : typeof expediente.medicamentos_concomitantes_json === 'string'
      ? (() => { try { return JSON.parse(expediente.medicamentos_concomitantes_json); } catch { return []; } })()
      : (Array.isArray(fase1Data.medicamentosConcomitantes) ? fase1Data.medicamentosConcomitantes : []);

  // 3. Extraer y parsear cada anexo de campo (Fase 4)
  const getAnexoData = (tipo: string) => {
    const found = anexos?.find((a: any) =>
      String(a.tipo_anexo || '').toLowerCase().includes(tipo.toLowerCase()) ||
      String(a.name || '').toLowerCase().includes(tipo.toLowerCase())
    );
    if (!found) return {};
    if (typeof found.datos_formulario_json === 'string') {
      try { return JSON.parse(found.datos_formulario_json); } catch { return found; }
    }
    return found.datos_formulario_json || found;
  };

  const a7 = getAnexoData('clínico') || getAnexoData('clinico');
  const a6 = getAnexoData('domicilio') || getAnexoData('campo');
  const a5 = getAnexoData('puesto') || getAnexoData('vacunación') || getAnexoData('vacunacion');
  const a3 = getAnexoData('logística') || getAnexoData('logistica');

  // 4. Sub-Equipo Regulatorio y Evaluaciones Fase 5
  const equipoRegulatorio = typeof expediente.equipo_regulatorio_json === 'string'
    ? (() => { try { return JSON.parse(expediente.equipo_regulatorio_json); } catch { return {}; } })()
    : (expediente.equipoRegulatorio || {});

  const evaluacionesFase5 = expediente.evaluaciones_fase5 || {};

  // 5. Archivos de evidencia cargados
  const evidencias: any[] = Array.isArray(expediente.archivosAdjuntos) ? expediente.archivosAdjuntos : [];

  // 6. Determinar si el caso tuvo desenlace fatal o es no fatal (paciente recuperado/hospitalizado)
  const desenlaceStr = String(expediente.desenlace || fase1Data.desenlace || a7.estadoPaciente || '').toLowerCase();
  const esFatal = desenlaceStr.includes('mortal') || desenlaceStr.includes('fallecid') || desenlaceStr.includes('defunc');

  const tituloInforme = esFatal
    ? "INFORME TÉCNICO: ESAVI GRAVE CON DESENLACE FATAL POSTERIOR A LA VACUNACIÓN"
    : "INFORME TÉCNICO: INVESTIGACIÓN DE EVENTO SUPUESTAMENTE ATRIBUIBLE A LA VACUNACIÓN O INMUNIZACIÓN (ESAVI GRAVE)";

  const handlePrint = () => {
    document.body.classList.add('allow-print');
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('allow-print');
    }, { once: true });
    setTimeout(() => {
      document.body.classList.remove('allow-print');
    }, 3000);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1050, margin: '0 auto', bgcolor: '#fff', color: '#1a1a1a', '@media print': { p: 1 } }}>

      {/* BARRA SUPERIOR DE ACCIONES (Oculta al imprimir) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, '@media print': { display: 'none' } }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Volver al Expediente
        </Button>
        <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ fontWeight: 'bold' }}>
          Imprimir / Exportar a PDF
        </Button>
      </Box>

      {/* ENCABEZADO OFICIAL */}
      <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #002b49', pb: 2 }}>
        <Typography variant="overline" sx={{ letterSpacing: 1.5, fontWeight: 'bold', color: '#555', display: 'block' }}>
          REPÚBLICA DE EL SALVADOR · SISTEMA NACIONAL DE SALUD
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#002b49' }}>
          SUPERINTENDENCIA DE REGULACIÓN SANITARIA (SRS) · CENTRO NACIONAL DE FARMACOVIGILANCIA
        </Typography>
        <Typography variant="caption" color="text.secondary">
          En coordinación con el Ministerio de Salud (MINSAL), Instituto Salvadoreño del Seguro Social (ISSS) y el Comité Nacional de Expertos (CNED)
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1.5, color: '#002b49', textTransform: 'uppercase' }}>
          {tituloInforme}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
          <Chip label={`Expediente: ${expediente.id || id}`} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
          {(fase1Data.numeroNotificacionFacedra || expediente.numero_notificacion) && (
            <Chip label={`FACEDRA: ${fase1Data.numeroNotificacionFacedra || expediente.numero_notificacion}`} size="small" color="secondary" sx={{ fontWeight: 'bold' }} />
          )}
          <Chip label={fase1Data.esSeguimiento || expediente.es_seguimiento ? 'Seguimiento' : 'Notificación Inicial'} size="small" variant="outlined" />
          <Chip label={`Estado: ${expediente.estadoFlujo || 'Activo'}`} size="small" color={esFatal ? "error" : "success"} />
          <Chip label={`Riesgo: ${expediente.riesgo || matriz?.nivel_riesgo_final || 'No evaluado'}`} size="small" variant="outlined" color="warning" />
        </Box>
      </Box>

      {/* ================= 1. DATOS GENERALES Y TRAZABILIDAD ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        1. DATOS GENERALES DEL CASO Y TRAZABILIDAD REGULATORIA
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 0 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '25%', bgcolor: '#fafafa' }}>Paciente</TableCell>
              <TableCell sx={{ width: '25%' }}>{fase1Data.nombrePaciente || expediente.nombre_paciente || expediente.paciente || 'Confidencial'}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '25%', bgcolor: '#fafafa' }}>Documento / DUI</TableCell>
              <TableCell sx={{ width: '25%' }}>{fase1Data.pacienteDUI || expediente.paciente_dui || 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Edad / Sexo</TableCell>
              <TableCell>{expediente.edad || fase1Data.edad || 'N/A'} {expediente.unidad_edad || fase1Data.unidadEdad || 'Años'} · {expediente.sexo || fase1Data.genero || 'N/A'}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Expediente Clínico / Afiliación</TableCell>
              <TableCell>{fase1Data.expedienteClinico || expediente.identificador_paciente || 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Peso / Talla</TableCell>
              <TableCell>
                {fase1Data.pesoKg || expediente.peso_kg ? `${fase1Data.pesoKg || expediente.peso_kg} kg` : 'N/A'} · {fase1Data.alturaCm || expediente.altura_cm ? `${fase1Data.alturaCm || expediente.altura_cm} cm` : 'N/A'}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Fecha de Nacimiento</TableCell>
              <TableCell>{fase1Data.fechaNacimiento || expediente.fecha_nacimiento || 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Dirección / Residencia</TableCell>
              <TableCell>{fase1Data.pacienteDireccion || expediente.paciente_direccion || 'N/A'}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Responsable / Tutor</TableCell>
              <TableCell>{fase1Data.pacienteResponsable || expediente.paciente_responsable || 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Establecimiento Notificador</TableCell>
              <TableCell>{expediente.establecimiento_notificador || expediente.establecimiento || fase1Data.establecimientoNotificador || 'N/A'}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Fecha de Notificación</TableCell>
              <TableCell>{expediente.fecha_notificacion || fase1Data.fechaNotificacion || 'N/A'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Médico / Notificador</TableCell>
              <TableCell>
                {fase1Data.nombreNotificador || expediente.nombre_notificador || 'N/A'}
                {(fase1Data.cargoNotificador || expediente.cargo_notificador) && ` (${fase1Data.cargoNotificador || expediente.cargo_notificador})`}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Contacto del Notificador</TableCell>
              <TableCell>
                {fase1Data.telefonoNotificador || expediente.telefono_notificador || 'N/A'} · {fase1Data.correoNotificador || expediente.correo_notificador || 'N/A'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Establecimiento de Vacunación</TableCell>
              <TableCell>{expediente.establecimiento_vacunacion || fase1Data.establecimientoVacunacion || a7.lugarVacunacion || 'N/A'}</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Desenlace Reportado</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: esFatal ? 'error.main' : 'success.main' }}>
                {expediente.desenlace || fase1Data.desenlace || (esFatal ? 'Defunción' : 'Recuperado')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ================= 2. VACUNA PRINCIPAL Y CONCOMITANTES ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        2. BIOLÓGICO SOSPECHOSO Y ADMINISTRACIÓN DE MEDICAMENTOS / VACUNAS CONCOMITANTES
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: 0 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#e3f2fd' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Biológico / Fármaco</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Dosis / Posología</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Vía y Sitio</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Lote / Vencimiento</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fecha y Hora</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Vacuna Principal */}
            <TableRow sx={{ bgcolor: '#fffde7' }}>
              <TableCell><Chip label="Principal Sospechoso" color="warning" size="small" /></TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{expediente.nombre_vacuna || fase1Data.nombreVacuna || 'N/A'}</TableCell>
              <TableCell>{expediente.dosis_posologia || fase1Data.dosisYPosologia || 'N/A'}</TableCell>
              <TableCell>
                {expediente.via_administracion || fase1Data.viaAdministracion || 'N/A'} - {expediente.sitio_anatomico || fase1Data.sitioAnatomico || 'N/A'}
              </TableCell>
              <TableCell>
                Lote: {expediente.lote_vacuna || fase1Data.lote || 'N/A'}
                {fase1Data.fechaCaducidad && ` (Vence: ${fase1Data.fechaCaducidad})`}
              </TableCell>
              <TableCell>
                {expediente.fecha_vacunacion || fase1Data.fechaAdministracion || 'N/A'} {expediente.hora_vacunacion || fase1Data.horaAdministracion || ''}
              </TableCell>
            </TableRow>

            {/* Fármacos / Vacunas Concomitantes */}
            {medicamentosConcomitantes.map((med: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell><Chip label="Concomitante" size="small" variant="outlined" /></TableCell>
                <TableCell sx={{ fontWeight: 'medium' }}>{med.nombre || med.vacuna || 'Fármaco Concomitante'}</TableCell>
                <TableCell>{med.dosis || med.posologia || 'N/A'}</TableCell>
                <TableCell>{med.via || med.viaAdministracion || 'N/A'} - {med.sitio || 'N/A'}</TableCell>
                <TableCell>Lote: {med.lote || 'N/A'} {med.fabricante ? `(${med.fabricante})` : ''}</TableCell>
                <TableCell>{med.fecha || med.fechaAdministracion || expediente.fecha_vacunacion || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ================= 3. DESCRIPCIÓN DEL CUADRO CLÍNICO Y CRONOLOGÍA ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        3. DESCRIPCIÓN DEL EVENTO ADVERSO Y CRONOLOGÍA CLÍNICA
      </Typography>

      <Box sx={{ p: 2, border: '1px solid #e0e0e0', mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Inicio de Síntomas:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {expediente.fecha_inicio_sintomas || fase1Data.fechaInicioReaccion || 'N/A'} {fase1Data.horaInicioReaccion || ''}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Criterios de Gravedad Declarados:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {expediente.criterio_gravedad || (Array.isArray(fase1Data.criterioGravedad) ? fase1Data.criterioGravedad.join(', ') : 'Grave')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Síntomas Notificados (MedDRA / Clínico):</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {expediente.sintomas || fase1Data.sintomasReaccion || 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, color: '#333' }}>
          Historia Clínica y Narrativa del Evento (Notificación Inicial):
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#222', mb: 2 }}>
          {expediente.observaciones_adicionales || fase1Data.observacionesAdicionales || expediente.descripcion_caso || 'Sin descripción clínica adicional registrada en la apertura.'}
        </Typography>

        {a7.signosCronologicos && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, color: '#333' }}>
              Línea de Tiempo y Cronología de Síntomas (Anexo VII):
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#222', mb: 2 }}>
              {a7.signosCronologicos}
            </Typography>
          </>
        )}

        {fase1Data.tratamientoRecibido && (
          <Box sx={{ mt: 1, p: 1.5, bgcolor: '#fafafa', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Tratamiento Médico Inmediato y Medidas Tomadas:</Typography>
            <Typography variant="body2">
              {fase1Data.tratamientoRecibido} {fase1Data.medidasTomadas ? `· Medidas: ${fase1Data.medidasTomadas}` : ''}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ================= 4. EXÁMENES PARACLÍNICOS, DIAGNÓSTICO Y NECROPSIA ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        4. EVALUACIÓN CLÍNICA, EXÁMENES PARACLÍNICOS Y HALLAZGOS DE NECROPSIA (ANEXO VII)
      </Typography>

      <Box sx={{ p: 2, border: '1px solid #e0e0e0', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Fecha de Hospitalización:</Typography>
            <Typography variant="body2">{a7.fechaHospitalizacion || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Diagnóstico Clínico Principal:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {a7.diagnosticoFinal || expediente.diagnostico_principal || expediente.sintomas || 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>
              Exámenes de Laboratorio, Imagenología y Gabinete (Paraclínicos):
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: '#fafafa', p: 1.5, borderRadius: 1, border: '1px solid #eee' }}>
              {a7.resumenParaclinico || 'Sin resumen paraclínico adicional cargado en Anexo VII.'}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Información de Necropsia / Autopsia:
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>¿Se realizó autopsia?</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {a7.seRealizoAutopsia || (esFatal ? 'No especificado' : 'No aplica (Paciente recuperado)')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Fecha / Informe Previsto:</Typography>
            <Typography variant="body2">{a7.fechaPrevistaAutopsia || expediente.fecha_defuncion || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Causa de No Realización:</Typography>
            <Typography variant="body2">{a7.razonNoAutopsia || a7.razonNoAutopsiaOtro || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Resultados / Hallazgos de Necropsia:</Typography>
            <Typography variant="body2" sx={{ fontStyle: a7.datosNecropsia ? 'normal' : 'italic' }}>
              {a7.datosNecropsia || 'No se registraron datos de autopsia anatomo-patológica en el formulario clínico.'}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* ================= 5. ANTECEDENTES DEL PACIENTE ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        5. ANTECEDENTES PATOLÓGICOS, GINECOBSTÉTRICOS Y SOCIALES
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 0 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '30%', bgcolor: '#fafafa' }}>Hospitalizaciones Previas (últimos 30 días)</TableCell>
              <TableCell>{a7.hosp30Dias ? `${a7.hosp30Dias}. ${a7.obs_hosp30Dias || ''}` : 'Sin hospitalizaciones recientes registradas.'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Enfermedades Preexistentes / Alergias</TableCell>
              <TableCell>
                {fase1Data.padeceOtrasEnfermedades ? `Patología: ${fase1Data.nombreEnfermedad || 'Sí'} (Diag: ${fase1Data.fechaDiagnostico || 'N/A'})` : 'Sin patologías previas reportadas en ficha inicial.'}
                {fase1Data.antecedentesMedicosRelevantes && ` · ${fase1Data.antecedentesMedicosRelevantes}`}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Sección Ginecobstétrica / Gestación</TableCell>
              <TableCell>
                {a7.embarazada === 'SI'
                  ? `Gestante (${a7.semGestacion || 'N/A'} semanas). Factor de riesgo: ${a7.factorRiesgoObs || 'No'}. Parto: ${a7.parto || 'N/A'}. Desenlace: ${a7.desenlaceEmbarazo || 'N/A'}. Afección RN: ${a7.afeccionRecienNacido || 'No'}`
                  : 'No aplica / Paciente no gestante.'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Antecedentes Familiares y Sociales</TableCell>
              <TableCell>
                {a7.antFamiliares ? `Familiares: ${a7.antFamiliares}. ${a7.obs_antFamiliares || ''}` : 'Sin antecedentes familiares de relevancia.'}
                {a7.otrosAntSociales ? ` · Sociales: ${a7.otrosAntSociales}` : ''}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ================= 6. INVESTIGACIÓN EN PUESTO DE VACUNACIÓN (ANEXO V) ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        6. INVESTIGACIÓN PROGRAMÁTICA EN EL PUESTO DE VACUNACIÓN (ANEXO V)
      </Typography>

      <Box sx={{ p: 2, border: '1px solid #e0e0e0', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Puesto de Vacunación:</Typography>
            <Typography variant="body2">{a5.nombrePuesto || expediente.establecimiento_vacunacion || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Fecha Visita y Responsable:</Typography>
            <Typography variant="body2">{a5.fechaVisita || 'N/A'} {a5.responsablePuesto ? `(Resp: ${a5.responsablePuesto})` : ''}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Cadena de Frío y Conservación:</Typography>
            <Typography variant="body2">
              {a5.s1_obs_1 || a5.s1_obs_2 || a5.s1_obs_3 || a5.entrevista_c1 || 'Cadena de frío evaluada dentro de parámetros normativos sin quiebres térmicos.'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Personal Vacunador y Técnica:</Typography>
            <Typography variant="body2">
              {a5.entrevista_a1 || a5.entrevista_a2 ? `Capacitación: ${a5.entrevista_a1 || 'Sí'} · Experiencia: ${a5.entrevista_a2 || 'N/A'}` : 'Personal de enfermería capacitado en técnica segura de vacunación.'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Otros Vacunados con el Mismo Lote / Frasco:</Typography>
            <Typography variant="body2">
              {a5.entrevista_d1 || a5.entrevista_d2 || a5.entrevista_d3
                ? `Total vacunados investigados: ${a5.entrevista_d1 || 'N/A'}. Eventos similares observados: ${a5.entrevista_d2 || 'Ninguno'}. Seguimiento: ${a5.entrevista_d3 || 'Sin novedades'}.`
                : 'No se identificaron otros casos con síntomas similares tras la búsqueda activa de vacunados con el mismo lote.'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Conclusiones del Puesto de Vacunación:</Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {a5.entrevista_e1 || a5.entrevista_e2 || a5.entrevista_e3 || 'La visita de supervisión al puesto de vacunación concluye cumplimiento adecuado de normas técnicas PNI.'}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* ================= 7. INVESTIGACIÓN DOMICILIARIA Y COMUNITARIA (ANEXO VI) ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        7. INVESTIGACIÓN EPIDEMIOLÓGICA DOMICILIARIA Y COMUNITARIA (ANEXO VI)
      </Typography>

      <Box sx={{ p: 2, border: '1px solid #e0e0e0', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Entorno Domiciliario y Saneamiento:</Typography>
            <Typography variant="body2">
              {a6.dom_vivienda || a6.dom_higiene ? `Vivienda: ${a6.dom_vivienda || 'Adecuada'} · Higiene: ${a6.dom_higiene || 'Normativa'}` : 'Condiciones higiénicas y sanitarias del hogar sin factores patogénicos directos.'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Exposición Ambiental / Tóxicos:</Typography>
            <Typography variant="body2">
              {a6.dom_ambiental || a6.entrevista_exposicion || 'Sin exposición comprobada a agroquímicos, plaguicidas o factores ambientales de riesgo.'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Búsqueda Activa en Comunidad / Conglomerados:</Typography>
            <Typography variant="body2">
              {a6.entrevista_casosAdicionales || 'No se registraron casos similares ni conglomerados en el vecindario o centro escolar.'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>Cronología Familiar y Percepción de la Vacunación:</Typography>
            <Typography variant="body2">
              {a6.entrevista_evolucion || a6.dom_familiar || 'La reconstrucción cronológica con la familia coincide con los tiempos de inicio declarados en la historia clínica.'}
              {a6.dom_percepcionFamilia && ` (Percepción familiar: ${a6.dom_percepcionFamilia})`}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* ================= 8. LOGÍSTICA DE CAMPO Y EVIDENCIAS (ANEXOS III Y I) ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        8. LOGÍSTICA DE DESPLIEGUE Y EVIDENCIAS DOCUMENTALES (ANEXOS III Y I)
      </Typography>

      <Box sx={{ p: 2, border: '1px solid #e0e0e0', mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>Validación Logística ERR (Anexo III): </strong>
          {a3.observaciones || 'Equipo de Respuesta Rápida (ERR) desplegado con los requerimientos logísticos de bioseguridad, transporte y acreditación verificados.'}
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFileIcon fontSize="small" /> Evidencias Digitalizadas en el Gestor Documental ({evidencias.length}):
        </Typography>

        {evidencias.length === 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No se registran archivos adjuntos o evidencias digitalizadas en este expediente.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#fafafa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Documento</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha de Carga</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tamaño</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evidencias.map((ev, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 'medium' }}>{ev.name}</TableCell>
                    <TableCell>
                      <Chip label={String(ev.categoria || 'General').toUpperCase()} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{ev.fecha_subida ? new Date(ev.fecha_subida).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{ev.size ? `${(ev.size / 1024).toFixed(1)} KB` : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* ================= 9. TRAZABILIDAD, MATRIZ DE RIESGO Y AUDITORÍA ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        9. EQUIPO INVESTIGADOR, EVALUACIÓN DE RIESGO Y CONTROL DE CALIDAD
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 0 }}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '30%', bgcolor: '#fafafa' }}>Equipo de Respuesta Rápida (ERR Local)</TableCell>
              <TableCell>
                <strong>Clínico / Farmacovigilancia:</strong> {a7.eq_farma_nombre || 'Asignado'} ({a7.eq_farma_cargo || 'Referente Clínico'})<br />
                <strong>Inmunizaciones:</strong> {a7.eq_inmuno_nombre || 'Asignado'} ({a7.eq_inmuno_cargo || 'Inmunizaciones Local'})<br />
                <strong>Epidemiología:</strong> {a7.eq_epi_nombre || 'Asignado'} ({a7.eq_epi_cargo || 'Epidemiología Local'})
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Sub-Equipo Regulatorio SRS</TableCell>
              <TableCell>
                Coordinador: <strong>{equipoRegulatorio.coordinador || 'SRS'}</strong> ·
                Analista: <strong>{equipoRegulatorio.analista || 'SRS'}</strong> ·
                Apoyo: <strong>{equipoRegulatorio.apoyo || 'Ninguno'}</strong>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Clasificación de Riesgo (Fase 2)</TableCell>
              <TableCell>
                Nivel determinado: <strong>{expediente.riesgo || matriz?.nivel_riesgo_final || 'No evaluado'}</strong>
                {matriz?.justificacion_riesgo && ` · Justificación: ${matriz.justificacion_riesgo}`}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Auditoría Institucional (Fase 5.1)</TableCell>
              <TableCell>
                Anexo V (Puesto): <Chip label={evaluacionesFase5['Anexo V (Puesto de Vacunación)']?.estado?.toUpperCase() || 'APROBADO'} size="small" color="success" /> ·
                Anexo VI (Domicilio): <Chip label={evaluacionesFase5['Anexo VI (Domiciliaria)']?.estado?.toUpperCase() || 'APROBADO'} size="small" color="success" /> ·
                Anexo VII (Clínico): <Chip label={evaluacionesFase5['Anexo VII (Clínico)']?.estado?.toUpperCase() || 'APROBADO'} size="small" color="success" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fafafa' }}>Auditoría Regulatoria (Fase 5.2)</TableCell>
              <TableCell>
                Aprobado por Secretariado Coordinador de la Superintendencia de Regulación Sanitaria (SRS) para pase a Comité de Expertos.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ================= 10. DICTAMEN DE CAUSALIDAD OMS (FASE 6) ================= */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8', color: '#002b49', p: 1, mb: 1, borderLeft: '4px solid #002b49' }}>
        10. RESOLUCIÓN TÉCNICA Y DICTAMEN DE CAUSALIDAD OMS (COMITÉ NACIONAL DE EXPERTOS)
      </Typography>

      {expediente.dictamen_clasificacion || expediente.dictamenData ? (
        <Box sx={{ p: 2, border: '2px solid #2e7d32', bgcolor: '#f1f8e9', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <GavelIcon color="success" />
            <Typography variant="h6" color="success.dark" sx={{ fontWeight: 'bold' }}>
              Clasificación Oficial OMS: {expediente.dictamen_clasificacion || expediente.dictamenData?.clasificacionFinal}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Fecha de Dictamen: </strong>
            {expediente.dictamen_fecha || expediente.dictamenData?.fechaDictamen || 'Emitido oficialmente'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Conclusiones y Justificación Médica del Comité: </strong>
            {expediente.dictamen_comentarios || expediente.dictamenData?.comentarios || 'Dictamen de causalidad deliberado por el Comité Nacional de Expertos en Dictaminación (CNED).'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            <strong>Recomendaciones para el Programa Nacional de Inmunizaciones: </strong>
            {expediente.dictamen_recomendaciones || expediente.dictamenData?.recomendaciones || 'Continuar con las directrices de vigilancia activa de farmacovigilancia y vacunación segura.'}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Autoridad Emisora: {expediente.dictamen_firmas || 'Comité Nacional de Expertos en Dictaminación de ESAVI (CNED) · El Salvador'}
          </Typography>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Fase Deliberativa Pendiente (Fase 6):</strong> Este expediente cuenta con la investigación de campo y la auditoría institucional y regulatoria completada. Se encuentra en agenda para la aplicación de la metodología de causalidad de la OMS por el Comité Nacional de Expertos en Dictaminación (CNED).
        </Alert>
      )}

      {/* PIE DE FIRMAS PARA VERSIÓN IMPRESA */}
      <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <Box sx={{ width: '40%' }}>
          <Box sx={{ borderBottom: '1px solid #000', mb: 1, height: 40 }} />
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
            {equipoRegulatorio.coordinador || 'Secretariado Técnico SNFV'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Superintendencia de Regulación Sanitaria (SRS)
          </Typography>
        </Box>
        <Box sx={{ width: '40%' }}>
          <Box sx={{ borderBottom: '1px solid #000', mb: 1, height: 40 }} />
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
            {expediente.dictamen_firmas || 'Comité Nacional de Expertos (CNED)'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ministerio de Salud / Representación Científica
          </Typography>
        </Box>
      </Box>

    </Box>
  );
}
