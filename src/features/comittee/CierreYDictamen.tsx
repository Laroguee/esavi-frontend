import { useRef, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useAuthStore } from '../../store/useAuthStore';
import { useCasesStore } from '../../store/useCasesStore';
import { obtenerExpedienteCompleto, actualizarCaso } from '../../services/googleSheetsService';

// Interface para el formulario del Comité
interface FormDataCausalidad {
  clasificacionFinal: string;
  comentariosComite: string;
  recomendaciones: string;
  fechaEvaluacion: string;
  firmasExpertos: string;
}

export default function CierreYDictamen() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { currentRole } = useAuthStore();
  const { casos, avanzarCaso } = useCasesStore();
  
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  const casoActual = casos.find(c => c.id === id);
  
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Informe_Tecnico_ESAVI_${id || '001'}`,
    pageStyle: `
      @page { size: portrait; margin: 20mm; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
      .hide-on-print { display: none !important; }
    `,
  });

  const { control, handleSubmit } = useForm<FormDataCausalidad>({
    defaultValues: { clasificacionFinal: '', comentariosComite: '', recomendaciones: '', fechaEvaluacion: '', firmasExpertos: '' }
  });

  if (!casoActual) {
    return <Alert severity="error">Caso no encontrado en el estado global. Por favor, vuelva al inicio.</Alert>;
  }

  // Mapear datos reales al formato del informe
  const casoData = {
    id: casoActual.id,
    fechaInforme: new Date().toLocaleDateString(),
    pais: 'El Salvador',
    nivelSubnacionalReporte: 'N/A', // Estos datos provienen de los anexos profundos
    nivelSubnacionalResidencia: 'N/A',
    institucionNotificadora: casoActual.establecimiento || 'No especificada',
    edad: casoActual.edad ? `${casoActual.edad} años` : 'N/A',
    sexo: casoActual.sexo || 'N/A',
    fechaNacimiento: 'N/A', 
    fechaUltimaVacunacion: casoActual.fecha ? new Date(casoActual.fecha).toLocaleDateString() : 'N/A',
    diagnostico: casoActual.sintomas || 'N/A',
    nivelCerteza: 'N/A',
    fechaInicioSintomas: 'N/A',
    fechaHospitalizacion: 'N/A',
    fechaDefuncion: 'N/A',
    fechaNotificacionNacional: casoActual.fecha ? new Date(casoActual.fecha).toLocaleDateString() : 'N/A',
    resumenEjecutivo: 'Ver detalles en Anexo VII y Gestor de Evidencias.',
    antClinicos: 'Ver detalles clínicos completos en el Gestor de Evidencias.',
    antQuirurgicos: 'N/A',
    antPerinatales: 'N/A',
    antMedicamentos: 'N/A',
    antSustancias: 'N/A',
    antFamiliares: 'N/A',
    epiViajes: 'N/A',
    epiAmbientales: 'N/A',
    epiVirus: 'N/A',
    resumenCaso: 'Ver línea de tiempo en el informe final de cierre institucional.',
    hallazgosClinicos: 'N/A',
    hallazgosNecropsia: 'N/A',
    hallazgosVacuna: 'Ver Anexo V',
    hallazgosPuesto: 'Ver Anexo VI',
    seguimientoVacunados: 'N/A',
    hallazgosEpi: 'Ver Anexo III',
    riesgoEvento: casoActual.riesgo || 'N/A',
    situacionComunicacional: 'N/A',
    vacunas: [
      { nombre: casoActual.vacuna || 'N/A', fecha: casoActual.fecha ? new Date(casoActual.fecha).toLocaleDateString() : 'N/A', fab: 'N/A', lote: 'N/A', sitio: 'N/A' },
      { nombre: '-', fecha: '-', fab: '-', lote: '-', sitio: '-' }
    ]
  };

  const onSubmitDictamen = async (data: FormDataCausalidad) => {
    setLoadingSubmit(true);
    try {
      // 1. Guardar los datos del dictamen en el expediente
      await actualizarCaso(casoActual.id, {
        dictamen_clasificacion: data.clasificacionFinal,
        dictamen_comentarios: data.comentariosComite,
        dictamen_recomendaciones: data.recomendaciones,
        dictamen_fecha: data.fechaEvaluacion,
        dictamen_firmas: data.firmasExpertos
      });

      // 2. Avanzar el caso a estado CERRADO
      await avanzarCaso(casoActual.id, 'CERRADO', 'Fase 6: Cerrado por Comité', 'El Comité Externo ha emitido el dictamen final.');
      
      alert(`Expediente ${casoActual.id} CERRADO OFICIALMENTE por el Comité de Expertos.`);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert("Error al guardar el dictamen");
    } finally {
      setLoadingSubmit(false);
    }
  };

  function DataField({ label, value, fullWidth = false }: { label: string, value: string, fullWidth?: boolean }) {
    return (
      <Grid size={{ xs: 12, md: fullWidth ? 12 : 4 }} sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: -0.5 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>{value}</Typography>
      </Grid>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', pb: 10 }}>
      
      {/* HEADER DE LA APLICACIÓN (NO se imprime) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }} className="hide-on-print">
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon fontSize="large" /> Informe Técnico y Dictamen
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="success" startIcon={<PrintIcon />} onClick={() => handlePrint()}>
            Exportar Informe a PDF
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>Volver al Expediente</Button>
        </Box>
      </Box>

      {/* =========================================================
          CONTENEDOR IMPRIMIBLE (INFORME TÉCNICO CONSOLIDADO)
      ========================================================= */}
      <div ref={componentRef}>
        <Paper variant="outlined" sx={{ p: 5, mb: 6, bgcolor: '#ffffff', borderRadius: 2 }}>
          
          {/* TÍTULO DEL DOCUMENTO */}
          <Box sx={{ textAlign: 'center', mb: 5, borderBottom: '2px solid', borderColor: 'primary.main', pb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>INFORME TÉCNICO CONSOLIDADO</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              ESAVI POSTERIOR A LA ADMINISTRACIÓN DE VACUNAS EN {casoData.pais.toUpperCase()}
            </Typography>
          </Box>

          {/* 1. DATOS BÁSICOS */}
          <Typography variant="h6" color="primary.dark" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 1, mb: 2 }}>1. DATOS BÁSICOS DEL CASO</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <DataField label="ID de Caso" value={casoData.id} />
            <DataField label="Fecha del informe" value={casoData.fechaInforme} />
            <DataField label="País de origen" value={casoData.pais} />
            <DataField label="Nivel subnacional reporte" value={casoData.nivelSubnacionalReporte} />
            <DataField label="Nivel subnacional residencia" value={casoData.nivelSubnacionalResidencia} />
            <DataField label="Institución notificadora" value={casoData.institucionNotificadora} />
            <DataField label="Edad" value={casoData.edad} />
            <DataField label="Sexo" value={casoData.sexo} />
            <DataField label="Fecha de nacimiento" value={casoData.fechaNacimiento} />
            <DataField label="Diagnóstico" value={casoData.diagnostico} />
            <DataField label="Nivel de certeza diagnóstica" value={casoData.nivelCerteza} />
            <DataField label="Fecha inicio de síntomas" value={casoData.fechaInicioSintomas} />
            <DataField label="Fecha de hospitalización" value={casoData.fechaHospitalizacion} />
            <DataField label="Fecha de defunción" value={casoData.fechaDefuncion} />
            <DataField label="Fecha de notificación nacional" value={casoData.fechaNotificacionNacional} />
          </Grid>

          {/* 2. OBJETIVO Y RESUMEN */}
          <Typography variant="h6" color="primary.dark" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 1, mb: 2 }}>2. OBJETIVO DEL INFORME</Typography>
          <Typography variant="body2" sx={{ mb: 4, fontStyle: 'italic' }}>
            Analizar en forma pormenorizada la información disponible del caso, identificando los datos faltantes y retroalimentar a los equipos locales responsables de la vigilancia de ESAVI sobre las mejores prácticas a implementar para la investigación de casos.
          </Typography>

          <Typography variant="h6" color="primary.dark" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 1, mb: 2 }}>3. RESUMEN EJECUTIVO DE SITUACIÓN</Typography>
          <Typography variant="body2" sx={{ mb: 4 }}>{casoData.resumenEjecutivo}</Typography>

          {/* 3. ANTECEDENTES */}
          <Typography variant="h6" color="primary.dark" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 1, mb: 2 }}>4. ANTECEDENTES MÉDICOS Y EPIDEMIOLÓGICOS</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <DataField fullWidth label="Antecedentes Clínicos" value={casoData.antClinicos} />
            <DataField fullWidth label="Antecedentes Quirúrgicos" value={casoData.antQuirurgicos} />
            <DataField fullWidth label="Antecedentes de consumo de medicamentos" value={casoData.antMedicamentos} />
            <DataField fullWidth label="Antecedentes Familiares" value={casoData.antFamiliares} />
            <DataField fullWidth label="Exposiciones ambientales y viajes" value={`${casoData.epiViajes} ${casoData.epiAmbientales} ${casoData.epiVirus}`} />
          </Grid>

          {/* 4. INMUNIZACIONES */}
          <Typography variant="h6" color="primary.dark" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 1, mb: 2 }}>5. ANTECEDENTES DE INMUNIZACIONES</Typography>
          <TableContainer sx={{ mb: 4, border: '1px solid #e0e0e0' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#eeeeee' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Área a evaluar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>Vacuna Principal</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>Otras Vacunas / Medicamentos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Nombre de la vacuna</TableCell>
                  <TableCell>{casoData.vacunas[0].nombre}</TableCell>
                  <TableCell>{casoData.vacunas[1].nombre}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Fecha de aplicación</TableCell>
                  <TableCell>{casoData.vacunas[0].fecha}</TableCell>
                  <TableCell>{casoData.vacunas[1].fecha}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Lote</TableCell>
                  <TableCell>{casoData.vacunas[0].lote}</TableCell>
                  <TableCell>{casoData.vacunas[1].lote}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Fabricante</TableCell>
                  <TableCell>{casoData.vacunas[0].fab}</TableCell>
                  <TableCell>{casoData.vacunas[1].fab}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Sitio anatómico</TableCell>
                  <TableCell>{casoData.vacunas[0].sitio}</TableCell>
                  <TableCell>{casoData.vacunas[1].sitio}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* 5. HALLAZGOS */}
          <Typography variant="h6" color="primary.dark" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', p: 1, mb: 2 }}>6. RESUMEN DEL CASO Y HALLAZGOS</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <DataField fullWidth label="Resumen del Caso (Línea de tiempo)" value={casoData.resumenCaso} />
            <DataField fullWidth label="Hallazgos de Investigación Clínica" value={casoData.hallazgosClinicos} />
            <DataField fullWidth label="Resultados de Necropsia" value={casoData.hallazgosNecropsia} />
            <DataField fullWidth label="Hallazgos de Vacuna y Farmacovigilancia" value={casoData.hallazgosVacuna} />
            <DataField fullWidth label="Hallazgos del Puesto de Vacunación" value={casoData.hallazgosPuesto} />
            <DataField fullWidth label="Hallazgos de Investigación Epidemiológica" value={casoData.hallazgosEpi} />
            <DataField fullWidth label="Clasificación de Riesgo del Evento" value={casoData.riesgoEvento} />
            <DataField fullWidth label="Situación Comunicacional" value={casoData.situacionComunicacional} />
          </Grid>
        </Paper>
      </div> 
      {/* ===== FIN DEL CONTENEDOR IMPRIMIBLE ===== */}

      {/* =========================================================
          ROL: COMITÉ EXTERNO (Dictamen Final)
      ========================================================= */}
      {currentRole === 'COMITE_EXTERNO' && (
        <>
          {casoActual.estadoFlujo !== 'EN_EVALUACION_COMITE' ? (
            <Alert severity="info" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              Este caso está en proceso de consolidación y se encuentra en espera de ser agendado por el Secretariado Técnico. No puede emitir dictamen aún.
            </Alert>
          ) : (
            <Paper elevation={4} component="form" onSubmit={handleSubmit(onSubmitDictamen)} sx={{ p: 5, borderTop: '6px solid', borderColor: 'secondary.main', borderRadius: 2 }}>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <GavelIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" color="secondary.main" sx={{ fontWeight: 'bold' }}>Dictamen Oficial de Causalidad</Typography>
                  <Typography variant="body2" color="text.secondary">Uso exclusivo del Comité Nacional de Expertos de Vacunación Segura.</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Clasificación final otorgada por el Comité</Typography>
                  <Controller name="clasificacionFinal" control={control} render={({ field }) => (
                    <TextField {...field} select fullWidth variant="filled" required sx={{ bgcolor: '#fffde7' }}>
                      <MenuItem value="A1">A1. Reacción relacionada con el producto de la vacuna</MenuItem>
                      <MenuItem value="A2">A2. Reacción relacionada con un defecto de calidad</MenuItem>
                      <MenuItem value="A3">A3. Reacción relacionada con un error de inmunización</MenuItem>
                      <MenuItem value="A4">A4. Reacción relacionada con ansiedad por la inmunización</MenuItem>
                      <MenuItem value="B1">B1. Relación temporal congruente pero sin evidencia de causalidad</MenuItem>
                      <MenuItem value="C">C. Causalidad Inconsistente (Condición coincidente)</MenuItem>
                      <MenuItem value="D">D. Inclasificable (Falta información)</MenuItem>
                    </TextField>
                  )}/>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Fecha de evaluación</Typography>
                  <Controller name="fechaEvaluacion" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth type="date" required slotProps={{ inputLabel: { shrink: true } }} />
                  )}/>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Justificación Clínica y Epidemiológica del Dictamen</Typography>
                  <Controller name="comentariosComite" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth multiline rows={4} placeholder="Redacte aquí la conclusión final del comité..." required />
                  )}/>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Recomendaciones y Acciones a tomar</Typography>
                  <Controller name="recomendaciones" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth multiline rows={3} placeholder="Ej: Capacitar al personal en cadena de frío..." required />
                  )}/>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Nombres y firmas de los expertos participantes</Typography>
                  <Controller name="firmasExpertos" control={control} render={({ field }) => (
                    <TextField {...field} fullWidth multiline rows={2} placeholder="Ingrese los nombres completos de los dictaminadores..." required />
                  )}/>
                </Grid>
              </Grid>

              <Box sx={{ mt: 5, p: 3, bgcolor: '#fff3e0', borderRadius: 2, textAlign: 'center', border: '1px dashed #ccc' }}>
                 <VerifiedUserIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                 <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                   Cierre de Expediente Médico-Legal
                 </Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                   Al hacer clic en el botón de cierre, el Comité certifica haber revisado la evidencia sin conflictos de interés y dictamina la causalidad oficial del evento. Este caso no podrá ser modificado posteriormente.
                 </Typography>
                 <Button type="submit" variant="contained" color="primary" size="large" sx={{ px: 5, py: 1.5 }} disabled={loadingSubmit}>
                   {loadingSubmit ? <CircularProgress size={24} color="inherit" /> : 'DICTAMINAR Y CERRAR CASO'}
                 </Button>
              </Box>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}