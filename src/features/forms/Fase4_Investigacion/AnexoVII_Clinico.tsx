import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, FormControlLabel, Switch, Collapse, Divider, Checkbox, FormGroup, Tabs, Tab } from '@mui/material';
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
  return <div hidden={value !== index} {...other}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

export default function AnexoVII_Clinico() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [esMujerFertil, setEsMujerFertil] = useState(false);

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      fechaInicioLlenado: '', fuentes_historiaClinica: false, fuentes_entrevistaVacunado: false, fuentes_entrevistaSalud: false, fuentes_registrosVac: false, fuentes_autopsia: false, fuentes_autopsiaVerbal: false, fuentes_comunitaria: false, fuentes_otro: '',
      idUnico: 'ESAVI-MINSAL-2025-001', lugarVacunacion: '', lugarVacunacionOtro: '', direccionVacunacion: '', fechaHospitalizacion: '', fechaInicioInvestigacion: '', estadoPaciente: '', fechaMuerte: '', horaMuerte: '', seRealizoAutopsia: '', fechaPrevistaAutopsia: '', razonNoAutopsia: '', datosNecropsia: '',
      hosp30Dias: '', obs_hosp30Dias: '', antFamiliares: '', obs_antFamiliares: '',
      embarazada: '', semGestacion: '', metGestacion: '', factorRiesgoObs: '', exp_factorRiesgoObs: '', parto: '', nacimiento: '', pesoNacer: '', desenlaceEmbarazo: '', afeccionRN: '', amamantando: '',
      recibioAtencionMedica: '', fuenteInfo_examen: false, fuenteInfo_documentos: false, fuenteInfo_autopsiaVerbal: false, fuenteInfo_otro: '', institucionDiferente: '', instInicial: '', medicoInicial: '', contactoInicial: '', instDefinitiva: '', medicoDefinitivo: '', contactoDefinitivo: '', sospechaMaltrato: '', exp_sospechaMaltrato: '', violenciaIntrafamiliar: '', exp_violenciaIntrafamiliar: '', otrosAntSociales: '', familiarContacto: '', signosCronologicos: '', resumenParaclinico: '', diagnosticoFinal: ''
    }
  });

  const estadoActual = watch('estadoPaciente');
  const hizoAutopsia = watch('seRealizoAutopsia');
  const instDiferente = watch('institucionDiferente');

  const onSubmit = (data: any) => {
    console.log("Anexo Guardado:", data);
    alert("Anexo VII Guardado Exitosamente.");
    navigate(-1);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 1000, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo VII: Evaluación Clínica
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} indicatorColor="secondary" textColor="primary" variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
          <Tab icon={<AssignmentIcon />} label="A. Info Básica" sx={{ fontWeight: 'bold' }} />
          <Tab icon={<PregnantWomanIcon />} label="B. Antes de Inmunización" sx={{ fontWeight: 'bold' }} />
          <Tab icon={<LocalHospitalIcon />} label="C. Evaluación Clínica" sx={{ fontWeight: 'bold' }} />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* =========================================================
              PESTAÑA A
          ========================================================= */}
          <TabPanel value={tabIndex} index={0}>
            
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Fecha de inicio de llenado de la ficha</Typography>
            <Controller name="fechaInicioLlenado" control={control} render={({ field }) => (
              <TextField {...field} type="date" sx={{ width: '30%', mb: 4 }} InputLabelProps={{ shrink: true }} />
            )}/>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Fuentes de información consultadas (Marque todas las que correspondan):</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 4, bgcolor: '#f9f9f9' }}>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={4}><Controller name="fuentes_historiaClinica" control={control} render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label="Historia clínica" />} /></Grid>
                <Grid item xs={12} sm={4}><Controller name="fuentes_entrevistaVacunado" control={control} render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label="Entrevista al vacunado" />} /></Grid>
                <Grid item xs={12} sm={4}><Controller name="fuentes_entrevistaSalud" control={control} render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label="Entrevista personal de salud" />} /></Grid>
                <Grid item xs={12} sm={4}><Controller name="fuentes_registrosVac" control={control} render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label="Registros de vacunación" />} /></Grid>
                <Grid item xs={12} sm={4}><Controller name="fuentes_autopsia" control={control} render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label="Informe de Autopsia" />} /></Grid>
                <Grid item xs={12} sm={4}><Controller name="fuentes_autopsiaVerbal" control={control} render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label="Informe autopsia verbal" />} /></Grid>
                <Grid item xs={12} sm={4}><Controller name="fuentes_comunitaria" control={control} render={({ field }) => <FormControlLabel control={<Checkbox {...field} />} label="Investigación comunitaria" />} /></Grid>
                <Grid item xs={12} sm={8}><Controller name="fuentes_otro" control={control} render={({ field }) => <TextField {...field} fullWidth label="Otro ¿Cuál?" size="small" InputLabelProps={{ shrink: true }} />} /></Grid>
              </Grid>
            </Paper>

            <Divider sx={{ my: 4 }} />

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Número de identificación del ESAVI</Typography>
                <Controller name="idUnico" control={control} render={({ field }) => <TextField {...field} fullWidth disabled variant="filled" />} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Lugar de Vacunación</Typography>
                <Controller name="lugarVacunacion" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth>
                    <MenuItem value="Intramural">Intramural – Puesto fijo</MenuItem>
                    <MenuItem value="Extramuros Movil">Extramuros – puesto Móvil</MenuItem>
                    <MenuItem value="Otro">Otro ¿Cuál?</MenuItem>
                  </TextField>
                )}/>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Dirección completa del lugar de vacunación</Typography>
                <Controller name="direccionVacunacion" control={control} render={({ field }) => <TextField {...field} fullWidth />} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Fecha de hospitalización</Typography>
                <Controller name="fechaHospitalizacion" control={control} render={({ field }) => <TextField {...field} fullWidth type="date" InputLabelProps={{ shrink: true }} />} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Fecha de inicio de la investigación</Typography>
                <Controller name="fechaInicioInvestigacion" control={control} render={({ field }) => <TextField {...field} fullWidth type="date" InputLabelProps={{ shrink: true }} />} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Estado de la persona en el momento de la investigación</Typography>
                <Controller name="estadoPaciente" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth>
                    <MenuItem value="Recuperado">Recuperado/resuelto</MenuItem>
                    <MenuItem value="En recuperacion">En recuperación/resolviendo</MenuItem>
                    <MenuItem value="Fallecido">Fallecido</MenuItem>
                    <MenuItem value="Desconocido">Desconocido</MenuItem>
                  </TextField>
                )}/>
              </Grid>
            </Grid>

            {/* SECCIÓN CONDICIONAL: FALLECIDO */}
            <Collapse in={estadoActual === 'Fallecido'}>
              <Paper variant="outlined" sx={{ p: 4, mt: 4, bgcolor: '#fff5f5', borderColor: '#ef5350' }}>
                <Typography variant="h6" color="error" fontWeight="bold" mb={3}>Detalles de Defunción</Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Fecha de muerte</Typography>
                    <Controller name="fechaMuerte" control={control} render={({ field }) => <TextField {...field} fullWidth type="date" InputLabelProps={{ shrink: true }} />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Hora (24h)</Typography>
                    <Controller name="horaMuerte" control={control} render={({ field }) => <TextField {...field} fullWidth type="time" InputLabelProps={{ shrink: true }} />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>¿Se realizó autopsia?</Typography>
                    <Controller name="seRealizoAutopsia" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem></TextField>
                    )}/>
                  </Grid>
                  
                  {hizoAutopsia === 'NO' && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Razón por la que no se practicó</Typography>
                      <Controller name="razonNoAutopsia" control={control} render={({ field }) => (
                        <TextField {...field} select fullWidth><MenuItem value="Negativa familiar">Negativa de la familia</MenuItem><MenuItem value="Otra">Otra razón</MenuItem></TextField>
                      )}/>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Registre los datos de la necropsia</Typography>
                    <Controller name="datosNecropsia" control={control} render={({ field }) => <TextField {...field} fullWidth multiline rows={3} />} />
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>
            
            <Box sx={{ mt: 4, textAlign: 'right' }}>
              <Button variant="contained" onClick={() => setTabIndex(1)}>Siguiente Pestaña &rarr;</Button>
            </Box>
          </TabPanel>

          {/* =========================================================
              PESTAÑA B
          ========================================================= */}
          <TabPanel value={tabIndex} index={1}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Hosp. en 30 días previos</Typography>
                <Controller name="hosp30Dias" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth><MenuItem value="SI">SÍ</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>
                )}/>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Observaciones</Typography>
                <Controller name="obs_hosp30Dias" control={control} render={({ field }) => <TextField {...field} fullWidth />} />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Otra enf. familiar o alergia</Typography>
                <Controller name="antFamiliares" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth><MenuItem value="SI">SÍ</MenuItem><MenuItem value="NO">NO</MenuItem><MenuItem value="NO SABE">NO SABE</MenuItem></TextField>
                )}/>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Observaciones</Typography>
                <Controller name="obs_antFamiliares" control={control} render={({ field }) => <TextField {...field} fullWidth />} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Paper variant="outlined" sx={{ p: 4, bgcolor: '#f3e5f5', borderColor: '#ce93d8' }}>
              <FormControlLabel 
                control={<Switch checked={esMujerFertil} onChange={(e) => setEsMujerFertil(e.target.checked)} color="secondary" />} 
                label={<Typography variant="h6" fontWeight="bold" color="secondary.main">PREGUNTAS PARA MUJERES (12 a 50 años / sospecha embarazo)</Typography>} 
              />
              <Collapse in={esMujerFertil}>
                <Grid container spacing={4} sx={{ mt: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>¿Embarazada al vacunar?</Typography>
                    <Controller name="embarazada" control={control} render={({ field }) => <TextField {...field} select fullWidth><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem></TextField>}/>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Semanas de gestación (1-42)</Typography>
                    <Controller name="semGestacion" control={control} render={({ field }) => <TextField {...field} fullWidth type="number" />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Método de cálculo</Typography>
                    <Controller name="metGestacion" control={control} render={({ field }) => <TextField {...field} select fullWidth><MenuItem value="Examen">Examen físico</MenuItem><MenuItem value="FUR">FUR</MenuItem><MenuItem value="USG">Ultrasonido</MenuItem></TextField>}/>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>¿Factor riesgo obstétrico?</Typography>
                    <Controller name="factorRiesgoObs" control={control} render={({ field }) => <TextField {...field} select fullWidth><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem></TextField>}/>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Explique cuál fue</Typography>
                    <Controller name="exp_factorRiesgoObs" control={control} render={({ field }) => <TextField {...field} fullWidth />} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>El parto fue</Typography>
                    <Controller name="parto" control={control} render={({ field }) => <TextField {...field} select fullWidth><MenuItem value="Normal">Normal</MenuItem><MenuItem value="Cesarea">Cesárea</MenuItem></TextField>}/>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>El nacimiento fue</Typography>
                    <Controller name="nacimiento" control={control} render={({ field }) => <TextField {...field} select fullWidth><MenuItem value="Prematuro">Prematuro</MenuItem><MenuItem value="Termino">A Término</MenuItem></TextField>}/>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Desenlace del embarazo</Typography>
                    <Controller name="desenlaceEmbarazo" control={control} render={({ field }) => <TextField {...field} select fullWidth><MenuItem value="Sano">Nacido vivo sano</MenuItem><MenuItem value="Aborto">Aborto</MenuItem></TextField>}/>
                  </Grid>
                </Grid>
              </Collapse>
            </Paper>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setTabIndex(0)}>&larr; Volver a Sección A</Button>
              <Button variant="contained" onClick={() => setTabIndex(2)}>Siguiente Pestaña &rarr;</Button>
            </Box>
          </TabPanel>

          {/* =========================================================
              PESTAÑA C
          ========================================================= */}
          <TabPanel value={tabIndex} index={2}>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>¿Ha recibido atención médica para el ESAVI?</Typography>
                <Controller name="recibioAtencionMedica" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem></TextField>
                )}/>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>¿La institución inicial es DIFERENTE a la definitiva?</Typography>
                <Controller name="institucionDiferente" control={control} render={({ field }) => (
                  <TextField {...field} select fullWidth><MenuItem value="SI">SI</MenuItem><MenuItem value="NO">NO</MenuItem></TextField>
                )}/>
              </Grid>

              {instDiferente === 'SI' && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Nombre de la institución inicial</Typography>
                        <Controller name="instInicial" control={control} render={({ field }) => <TextField {...field} fullWidth />} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Nombre de la institución definitiva</Typography>
                        <Controller name="instDefinitiva" control={control} render={({ field }) => <TextField {...field} fullWidth />} />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" color="primary" gutterBottom>Signos, Síntomas y Diagnóstico</Typography>
              </Grid>

              {/* CAMPOS MULTILÍNEA: 100% DE ANCHO PARA QUE EL MÉDICO PUEDA REDACTAR */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Signos y síntomas en orden cronológico desde la vacunación:</Typography>
                <Controller name="signosCronologicos" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth multiline rows={4} placeholder="Escriba aquí todo el detalle cronológico..." />
                )}/>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Haga un resumen completo de los datos clínicos y paraclínicos:</Typography>
                <Controller name="resumenParaclinico" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth multiline rows={4} placeholder="Exámenes clínicos, laboratorios y gabinete..." />
                )}/>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Diagnóstico final o presuntivo:</Typography>
                <Controller name="diagnosticoFinal" control={control} render={({ field }) => (
                  <TextField {...field} fullWidth variant="filled" sx={{ bgcolor: '#e3f2fd' }} />
                )}/>
              </Grid>
            </Grid>

            {/* ZONA DE SUBIDA */}
            <Box sx={{ mt: 6, border: '2px dashed #9c27b0', p: 4, textAlign: 'center', borderRadius: 2, bgcolor: '#fafafa' }}>
              <CloudUploadIcon color="secondary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6" gutterBottom>Adjuntar Evidencias Médicas</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>Puede adjuntar Historia Clínica, Exámenes o Autopsia en formato PDF o Foto.</Typography>
              <Button variant="contained" component="label" color="secondary" size="large">
                Seleccionar Archivos
                <input type="file" hidden multiple accept="image/*,.pdf" capture="environment" />
              </Button>
            </Box>

            <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setTabIndex(1)}>&larr; Volver a Sección B</Button>
              <Button type="submit" variant="contained" color="secondary" startIcon={<SaveIcon />} size="large">
                GUARDAR Y ENVIAR ANEXO
              </Button>
            </Box>
          </TabPanel>

        </Box>
      </Paper>
    </Box>
  );
}