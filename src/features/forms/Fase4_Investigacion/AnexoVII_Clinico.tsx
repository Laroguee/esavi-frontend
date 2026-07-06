import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Box, Paper, Typography, Grid, TextField, Button, MenuItem, FormControlLabel, Switch, 
  Collapse, Divider, Checkbox, FormGroup, FormLabel, Tabs, Tab, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PregnantWomanIcon from '@mui/icons-material/PregnantWoman';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate } from 'react-router-dom';

// Pestañas
interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return <div hidden={value !== index} {...other}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

export default function AnexoVII_Clinico() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [esMujerFertil, setEsMujerFertil] = useState(false);

  const { control, handleSubmit, watch } = useForm({
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

  const estadoActual = watch('estadoPaciente');
  const hizoAutopsia = watch('seRealizoAutopsia');
  const razonAutopsia = watch('razonNoAutopsia');
  const desenlace = watch('desenlaceEmbarazo');
  const instDiferente = watch('institucionDiferente');

  const onSubmit = (data: any) => {
    console.log("Anexo Guardado:", data);
    alert("Anexo VII Guardado Exitosamente.");
    navigate(-1);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1200, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo VII: Evaluación Clínica
        </Typography>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>Cancelar</Button>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} indicatorColor="secondary" textColor="primary" variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
          <Tab icon={<AssignmentIcon />} label="A. Info Básica" sx={{ fontWeight: 'bold', minHeight: 60 }} />
          <Tab icon={<PregnantWomanIcon />} label="B. Antes de Inmunización" sx={{ fontWeight: 'bold', minHeight: 60 }} />
          <Tab icon={<LocalHospitalIcon />} label="C. Evaluación Clínica" sx={{ fontWeight: 'bold', minHeight: 60 }} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* =========================================================
              PESTAÑA A: INFO BÁSICA
          ========================================================= */}
          <TabPanel value={tabIndex} index={0}>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Fecha inicio llenado de ficha</Typography>
                <Controller name="fechaInicioLlenado" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth type="date" size="small" InputLabelProps={{ shrink: true }} />
                )}/>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f9f9f9' }}>
                  <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.85rem' }}>Fuentes de información consultadas:</FormLabel>
                  <Grid container spacing={0}>
                    <Grid item xs={12} sm={4}><Controller name="fuentes_historiaClinica" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Historia clínica</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={4}><Controller name="fuentes_entrevistaVacunado" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Entrevista al vacunado</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={4}><Controller name="fuentes_entrevistaSalud" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Entrevista personal salud</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={4}><Controller name="fuentes_registrosVac" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Registros de vacunación</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={4}><Controller name="fuentes_autopsia" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Informe de Autopsia</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={4}><Controller name="fuentes_autopsiaVerbal" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Informe autopsia verbal</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={4}><Controller name="fuentes_comunitaria" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Inv. comunitaria</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={8}><Controller name="fuentes_otro" control={control} render={({ field }) => <TextField {...field} fullWidth placeholder="Otro ¿Cuál?" size="small" variant="standard" />} /></Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Número de identificación del ESAVI</Typography>
                <Controller name="idUnico" control={control} render={({ field }) => <TextField {...field} fullWidth disabled size="small" variant="filled" />} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Lugar de Vacunación</Typography>
                <Controller name="lugarVacunacion" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth size="small">
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
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Si eligió 'Otro'</Typography>
                <Controller name="lugarVacunacionOtro" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Dirección completa del lugar de vacunación</Typography>
                <Controller name="direccionVacunacion" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>Datos del equipo de investigación</Typography>
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
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Farmacovigilancia</TableCell>
                    <TableCell><Controller name="eq_farma_nombre" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                    <TableCell><Controller name="eq_farma_cargo" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                    <TableCell><Controller name="eq_farma_correo" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                    <TableCell><Controller name="eq_farma_tel" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Inmunizaciones</TableCell>
                    <TableCell><Controller name="eq_inmuno_nombre" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                    <TableCell><Controller name="eq_inmuno_cargo" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                    <TableCell><Controller name="eq_inmuno_correo" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                    <TableCell><Controller name="eq_inmuno_tel" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Epidemiología</TableCell>
                    <TableCell><Controller name="eq_epi_nombre" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                    <TableCell><Controller name="eq_epi_cargo" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                    <TableCell><Controller name="eq_epi_correo" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                    <TableCell><Controller name="eq_epi_tel" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" variant="standard" />}/></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Fecha de hospitalización</Typography>
                <Controller name="fechaHospitalizacion" control={control} render={({ field }) => <TextField {...field} fullWidth type="date" size="small" InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Fecha inicio investigación</Typography>
                <Controller name="fechaInicioInvestigacion" control={control} render={({ field }) => <TextField {...field} fullWidth type="date" size="small" InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Estado de la persona al investigar</Typography>
                <Controller name="estadoPaciente" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth size="small">
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
                <Typography variant="subtitle2" color="error" fontWeight="bold" mb={1}>Detalles de Defunción</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Fecha de muerte</Typography>
                    <Controller name="fechaMuerte" control={control} render={({ field }) => <TextField {...field} fullWidth type="date" size="small" InputLabelProps={{ shrink: true }} />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Hora de muerte (24 hrs)</Typography>
                    <Controller name="horaMuerte" control={control} render={({ field }) => <TextField {...field} fullWidth type="time" size="small" InputLabelProps={{ shrink: true }} />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>¿Se realizó autopsia?</Typography>
                    <Controller name="seRealizoAutopsia" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem></TextField>
                    )}/>
                  </Grid>
                  
                  {hizoAutopsia === 'NO' && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Razón por la que no se practicó</Typography>
                      <Controller name="razonNoAutopsia" control={control} render={({ field }) => (
                        <TextField {...field} select fullWidth size="small">
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
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Especifique la otra razón</Typography>
                      <Controller name="razonNoAutopsiaOtro" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
                    </Grid>
                  )}

                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Fecha prevista autopsia (pasada/prevista)</Typography>
                    <Controller name="fechaPrevistaAutopsia" control={control} render={({ field }) => <TextField {...field} fullWidth type="date" size="small" InputLabelProps={{ shrink: true }} />} />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Registre los datos de la necropsia</Typography>
                    <Controller name="datosNecropsia" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" multiline rows={2} />} />
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
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Hosp. en 30 días previos</Typography>
                <Controller name="hosp30Dias" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>
                )}/>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Observaciones</Typography>
                <Controller name="obs_hosp30Dias" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Otra enf. familiar o alergia</Typography>
                <Controller name="antFamiliares" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>
                )}/>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>Observaciones</Typography>
                <Controller name="obs_antFamiliares" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fdfbfd', borderColor: '#ce93d8' }}>
              <FormControlLabel 
                control={<Switch size="small" checked={esMujerFertil} onChange={(e) => setEsMujerFertil(e.target.checked)} color="secondary" />} 
                label={<Typography variant="subtitle2" fontWeight="bold" color="secondary.main">PREGUNTAS PARA MUJERES (12 a 50 años / sospecha embarazo)</Typography>} 
              />
              <Collapse in={esMujerFertil}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>¿Embarazada al vacunar?</Typography>
                    <Controller name="embarazada" control={control} render={({ field }) => <TextField {...field} select fullWidth size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>}/>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Semanas de gestación (1-42)</Typography>
                    <Controller name="semGestacion" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" type="number" />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Método de cálculo</Typography>
                    <Controller name="metGestacion" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small">
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

                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>¿Factor riesgo obstétrico?</Typography>
                    <Controller name="factorRiesgoObs" control={control} render={({ field }) => <TextField {...field} select fullWidth size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>}/>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Explique cuál fue</Typography>
                    <Controller name="exp_factorRiesgoObs" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>El parto fue</Typography>
                    <Controller name="parto" control={control} render={({ field }) => <TextField {...field} select fullWidth size="small"><MenuItem value="Normal">Normal</MenuItem><MenuItem value="Cesarea">Cesárea</MenuItem><MenuItem value="Instrumentado">Instrumentado</MenuItem><MenuItem value="Complicaciones">Con complicaciones</MenuItem><MenuItem value="No aplica">No aplica</MenuItem></TextField>}/>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>El nacimiento fue</Typography>
                    <Controller name="nacimiento" control={control} render={({ field }) => <TextField {...field} select fullWidth size="small"><MenuItem value="Prematuro">Prematuro</MenuItem><MenuItem value="Termino">A Término</MenuItem><MenuItem value="Postermino">Postérmino</MenuItem><MenuItem value="No aplica">No Aplica</MenuItem></TextField>}/>
                  </Grid>
                  <Grid item xs={12} md={3}>
                   <Typography variant="body2" fontWeight="bold" gutterBottom>{"Peso al Nacer (<=6000g)"}</Typography> 
                    <Controller name="pesoNacer" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" type="number" />} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>¿Amamantando al vacunar?</Typography>
                    <Controller name="amamantando" control={control} render={({ field }) => <TextField {...field} select fullWidth size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>}/>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" fontWeight="bold" gutterBottom>Desenlace del embarazo</Typography>
                    <Controller name="desenlaceEmbarazo" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small">
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
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Describa la afección médica del recién nacido</Typography>
                      <Controller name="afeccionRecienNacido" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
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
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>¿Atención médica para ESAVI?</Typography>
                <Controller name="recibioAtencionMedica" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>
                )}/>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f9f9f9' }}>
                  <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.85rem' }}>Fuente de información (Atención):</FormLabel>
                  <Grid container spacing={0}>
                    <Grid item xs={12} sm={4}><Controller name="fuenteC_examen" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Examen por investigador</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={4}><Controller name="fuenteC_docs" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Documentos</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={4}><Controller name="fuenteC_autopsia" control={control} render={({ field }) => <FormControlLabel control={<Checkbox size="small" {...field} />} label={<Typography variant="body2">Autopsia Verbal</Typography>} />} /></Grid>
                    <Grid item xs={12} sm={8}><Controller name="fuenteC_otro" control={control} render={({ field }) => <TextField {...field} fullWidth placeholder="Otro ¿Cuál?" size="small" variant="standard" sx={{ mt: 0.5 }} />} /></Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>¿La institución inicial es DIFERENTE a la definitiva?</Typography>
                <Controller name="institucionDiferente" control={control} render={({ field }) => (
                  <TextField {...field} select sx={{ width: '200px' }} size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem></TextField>
                )}/>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={instDiferente === 'SI' ? 4 : 6}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>Institución Inicial</Typography>
                      <Typography variant="body2" fontWeight="bold">Nombre Institución</Typography>
                      <Controller name="instInicial" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" sx={{ mb: 1 }}/>} />
                      <Typography variant="body2" fontWeight="bold">Médico</Typography>
                      <Controller name="medicoInicial" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" sx={{ mb: 1 }}/>} />
                      <Typography variant="body2" fontWeight="bold">Contacto (Tel/Email)</Typography>
                      <Controller name="contactoInicial" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
                    </Grid>
                    
                    {instDiferente === 'SI' && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>Institución Definitiva</Typography>
                        <Typography variant="body2" fontWeight="bold">Nombre Institución</Typography>
                        <Controller name="instDefinitiva" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" sx={{ mb: 1 }}/>} />
                        <Typography variant="body2" fontWeight="bold">Médico</Typography>
                        <Controller name="medicoDefinitivo" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" sx={{ mb: 1 }}/>} />
                        <Typography variant="body2" fontWeight="bold">Contacto (Tel/Email)</Typography>
                        <Controller name="contactoDefinitivo" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
                      </Grid>
                    )}

                    <Grid item xs={12} md={instDiferente === 'SI' ? 4 : 6}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>Referencia Familiar</Typography>
                      <Typography variant="body2" fontWeight="bold">Familiar/Persona con detalles clínicos</Typography>
                      <Controller name="contactoConoceDetalles" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" multiline rows={4} placeholder="Nombre e información de contacto..." />} />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* SECCIÓN COMPACTA: ANTECEDENTES SOCIALES Y VIOLENCIA */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, borderColor: '#e0e0e0' }}>
                  <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 2 }}>Antecedentes Sociales y Violencia</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Menor 5 años: ¿Sospecha de maltrato?</Typography>
                      <Controller name="sospechaMaltrato" control={control} render={({ field }) => <TextField {...field} select fullWidth size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>}/>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Explique (si aplica)</Typography>
                      <Controller name="exp_sospechaMaltrato" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Adolesc/Adulto: ¿Violencia intrafamiliar?</Typography>
                      <Controller name="violenciaIntrafamiliar" control={control} render={({ field }) => <TextField {...field} select fullWidth size="small"><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>}/>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Explique (si aplica)</Typography>
                      <Controller name="exp_violenciaIntrafamiliar" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" />} />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Otros antecedentes sociales relevantes del caso</Typography>
                      <Controller name="otrosAntSociales" control={control} render={({ field }) => <TextField {...field} fullWidth size="small" multiline rows={2} />} />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* SECCIÓN COMPACTA: SIGNOS Y DIAGNÓSTICO */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: '#e0e0e0' }}>
                  <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 2 }}>Signos, Síntomas y Diagnóstico</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Signos y síntomas en orden cronológico desde la vacunación:</Typography>
                      <Controller name="signosCronologicos" control={control} render={({ field }) => (
                        <TextField {...field} fullWidth size="small" multiline rows={3} placeholder="Detalle cronológico..." />
                      )}/>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Resumen completo clínico y paraclínico (exámenes y gabinete):</Typography>
                      <Controller name="resumenParaclinico" control={control} render={({ field }) => (
                        <TextField {...field} fullWidth size="small" multiline rows={3} placeholder="Resaltando lo más relevante..." />
                      )}/>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>Diagnóstico final o presuntivo:</Typography>
                      <Controller name="diagnosticoFinal" control={control} render={({ field }) => (
                        <TextField {...field} fullWidth size="small" variant="outlined" sx={{ bgcolor: '#fffde7' }} />
                      )}/>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* ZONA DE SUBIDA */}
            <Box sx={{ mt: 4, border: '1px dashed #9c27b0', p: 2, textAlign: 'center', borderRadius: 1, bgcolor: '#fafafa' }}>
              <CloudUploadIcon color="secondary" sx={{ fontSize: 32, mb: 0.5 }} />
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Adjuntar Evidencias Médicas</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>Historia Clínica, Exámenes o Autopsia (PDF/Foto).</Typography>
              <Button variant="outlined" component="label" color="secondary" size="small">
                Seleccionar Archivos
                <input type="file" hidden multiple accept="image/*,.pdf" capture="environment" />
              </Button>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" size="small" onClick={() => setTabIndex(1)}>&larr; Volver a Sección B</Button>
              <Button type="submit" variant="contained" color="secondary" startIcon={<SaveIcon />} size="small">
                GUARDAR Y ENVIAR ANEXO
              </Button>
            </Box>
          </TabPanel>

        </Box>
      </Paper>
    </Box>
  );
}