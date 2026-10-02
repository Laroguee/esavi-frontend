import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Alert, Checkbox, FormControlLabel, Chip } from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';
import { useAuthStore, type MockUser } from '../../../store/useAuthStore';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { listarUsuarios } from '../../../services/adminService';
import { guardarEnSheets, registrarLog, crearNotificacion, obtenerExpediente } from '../../../services/firebaseService';

export default function AsignacionERR() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userEmail = useAuthStore(state => state.userEmail);
  const { establecimientos } = useCatalogStore();
  const avanzarCaso = useCasesStore(state => state.avanzarCaso);
  const asignarMiembrosERR = useCasesStore(state => state.asignarMiembrosERR);
  const casoActual = useCasesStore(state => state.casos.find(c => c.id === id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuariosBD, setUsuariosBD] = useState<MockUser[]>([]);

  // Estado local para apoyos (Casos Críticos)
  const [apoyoManualNombre, setApoyoManualNombre] = useState('');
  const [apoyoManualCargo, setApoyoManualCargo] = useState('');
  const [apoyosManuales, setApoyosManuales] = useState<{nombre: string, cargo: string}[]>([]);
  const [apoyosSistema, setApoyosSistema] = useState<{email: string, permiso: 'VER' | 'LLENAR', areaApoyo: string}[]>([]);

  const normalizeEstablecimiento = (est: string | undefined) => {
    if (!est) return '';
    const upper = est.toUpperCase().trim();
    if (upper === 'OFICINA CENTRAL MINSAL') return 'Nivel Central MINSAL';
    if (upper === 'OFICINA CENTRAL ISSS') return 'Nivel Central ISSS';
    if (upper === 'UCSF SAN JACINTO') return 'Unidad de Salud San Jacinto';
    return est;
  };

  useEffect(() => {
    listarUsuarios().then(res => {
      if(res.success) {
        const normalized = (res.data as any[]).map(u => ({
          ...u,
          establecimiento: normalizeEstablecimiento(u.establecimiento)
        }));
        setUsuariosBD(normalized);
      }
    });
  }, []);

  const [chkReporte, setChkReporte] = useState(false);
  // Detección de nivel de riesgo
  const riesgoStr = casoActual?.riesgo?.toUpperCase() || '';
  const esRiesgoAlto = riesgoStr.includes('ALTO') || riesgoStr.includes('CRÍTICO') || riesgoStr.includes('CRITICO') || riesgoStr.includes('NACIONAL');

  const { control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      inst_farmacovigilancia: '', farmacovigilancia: '',
      inst_inmunizaciones: '', inmunizaciones: '',
      inst_epidemiologia: '', epidemiologia: '',
      instrucciones: '',
      
      // Campos Críticos
      inst_esavi_inst: '', esavi_inst: '',
      inst_epidemio_inst: '', epidemio_inst: '',
      inst_inmuno_inst: '', inmuno_inst: '',
      inst_secretariado_inst: '', secretariado_inst: '',
      inst_err_local: '', err_local: '',
      inst_err_local_2: '', err_local_2: ''
    }
  });

  // Pre-llenar si ya hay asignados (Reasignación)
  useEffect(() => {
    if (casoActual?.miembrosERR && casoActual.miembrosERR.length > 0 && usuariosBD.length > 0) {
      if (esRiesgoAlto && casoActual.equipoERR) {
        // Modo crítico pre-llenado
        const eq = casoActual.equipoERR;
        const uLocal = usuariosBD.find(u => u.email === eq.idLocal);
        const uEsaviInst = usuariosBD.find(u => u.email === eq.idsInstitucionales?.[0]);
        const uEpidemioInst = usuariosBD.find(u => u.email === eq.idsInstitucionales?.[1]);
        const uInmunoInst = usuariosBD.find(u => u.email === eq.idsInstitucionales?.[2]);
        const uSecretariado = usuariosBD.find(u => u.email === eq.idsInstitucionales?.[3]);

        reset({
          inst_farmacovigilancia: '', farmacovigilancia: '',
          inst_inmunizaciones: '', inmunizaciones: '',
          inst_epidemiologia: '', epidemiologia: '',
          instrucciones: '',
          inst_err_local: uLocal?.establecimiento || '', err_local: uLocal?.email || '',
          inst_err_local_2: eq.idLocal2 ? usuariosBD.find(u => u.email === eq.idLocal2)?.establecimiento || '' : '', err_local_2: eq.idLocal2 || '',
          inst_esavi_inst: uEsaviInst?.establecimiento || '', esavi_inst: uEsaviInst?.email || '',
          inst_epidemio_inst: uEpidemioInst?.establecimiento || '', epidemio_inst: uEpidemioInst?.email || '',
          inst_inmuno_inst: uInmunoInst?.establecimiento || '', inmuno_inst: uInmunoInst?.email || '',
          inst_secretariado_inst: uSecretariado?.establecimiento || '', secretariado_inst: uSecretariado?.email || ''
        });
        setApoyosSistema(eq.apoyosSistema || []);
        setApoyosManuales(eq.apoyosManuales || []);
      } else {
        // Modo normal pre-llenado
        const farma = usuariosBD.find(u => String(u.role).includes('ESAVI') && casoActual.miembrosERR.includes(u.email));
        const inmuno = usuariosBD.find(u => String(u.role).includes('INMUNO') && casoActual.miembrosERR.includes(u.email));
        const epidemio = usuariosBD.find(u => String(u.role).includes('EPIDEMIO') && casoActual.miembrosERR.includes(u.email));

        reset({
          inst_farmacovigilancia: farma?.establecimiento || '', farmacovigilancia: farma?.email || '',
          inst_inmunizaciones: inmuno?.establecimiento || '', inmunizaciones: inmuno?.email || '',
          inst_epidemiologia: epidemio?.establecimiento || '', epidemiologia: epidemio?.email || '',
          instrucciones: '',
          inst_esavi_inst: '', esavi_inst: '', inst_epidemio_inst: '', epidemio_inst: '', inst_inmuno_inst: '', inmuno_inst: '', inst_secretariado_inst: '', secretariado_inst: '', inst_err_local: '', err_local: '', inst_err_local_2: '', err_local_2: ''
        });
        if (casoActual.equipoERR) {
          setApoyosSistema(casoActual.equipoERR.apoyosSistema || []);
          setApoyosManuales(casoActual.equipoERR.apoyosManuales || []);
        }
      }
    }
  }, [casoActual, usuariosBD, reset, esRiesgoAlto]);

  const valores = watch();

  const handleAddApoyoManual = () => {
    if (apoyoManualNombre && apoyoManualCargo) {
      setApoyosManuales([...apoyosManuales, { nombre: apoyoManualNombre, cargo: apoyoManualCargo }]);
      setApoyoManualNombre('');
      setApoyoManualCargo('');
    }
  };

  const onSubmit = async (data: any) => {
    if (id) {
      setIsSubmitting(true);
      
      let historicoInactivos: string[] = [];
      if (import.meta.env.VITE_USE_API === 'true') {
        const resExp = await obtenerExpediente(id);
        if (resExp.success && resExp.data?.asignaciones) {
          try {
             const oldData = typeof resExp.data.asignaciones.datos_formulario_json === 'string' 
                ? JSON.parse(resExp.data.asignaciones.datos_formulario_json) 
                : resExp.data.asignaciones.datos_formulario_json;
             if (oldData?.personal_inactivo) {
               historicoInactivos = Array.isArray(oldData.personal_inactivo) 
                 ? oldData.personal_inactivo 
                 : oldData.personal_inactivo.split(',').map((s: string) => s.trim());
             }
          } catch (e) {}
        }
      }

      let nuevosMiembros: string[] = [];
      let equipoERR: any = {
        apoyosSistema,
        apoyosManuales
      };

      if (esRiesgoAlto) {
        nuevosMiembros = [data.err_local, data.err_local_2, data.esavi_inst, data.epidemio_inst, data.inmuno_inst, data.secretariado_inst, ...apoyosSistema.map(a => a.email)].filter(Boolean);
        equipoERR.idLocal = data.err_local;
        equipoERR.idLocal2 = data.err_local_2;
        equipoERR.idsInstitucionales = [data.esavi_inst, data.epidemio_inst, data.inmuno_inst, data.secretariado_inst].filter(Boolean);
      } else {
        nuevosMiembros = [data.farmacovigilancia, data.inmunizaciones, data.epidemiologia, ...apoyosSistema.map(a => a.email)].filter(Boolean);
      }

      const inactivosNuevos = casoActual?.miembrosERR?.filter(m => !nuevosMiembros.includes(m)) || [];
      const todosInactivos = Array.from(new Set([...historicoInactivos, ...inactivosNuevos])).filter(Boolean);

      const dataToSave = { ...data, apoyosSistema, apoyosManuales };
      if (todosInactivos.length > 0) {
        (dataToSave as any).personal_inactivo = todosInactivos.join(', ');
      }

      const payloadAsignacion = {
        tabla: 'ASIGNACIONES_ERR',
        datos: {
          id_asignacion: `ERR-${Date.now()}`,
          id_caso: id,
          id_clinico: esRiesgoAlto ? data.esavi_inst : data.farmacovigilancia || '',
          id_inmuno: esRiesgoAlto ? data.inmuno_inst : data.inmunizaciones || '',
          id_epidemio: esRiesgoAlto ? data.epidemio_inst : data.epidemiologia || '',
          instrucciones_especiales: data.instrucciones || '',
          datos_formulario_json: JSON.stringify(dataToSave)
        }
      };

      if (import.meta.env.VITE_USE_API === 'true') {
        try {
          await guardarEnSheets('ASIGNACIONES_ERR', payloadAsignacion.datos);
          await registrarLog(id, userEmail || 'desconocido', 'Se asignó el Equipo de Respuesta Rápida (ERR).');
        } catch (error) {
          console.error("Error al guardar la asignación en Sheets", error);
          alert("Error de conexión con la base de datos.");
          setIsSubmitting(false);
          return;
        }
      }

      // Guardar en Store con la nueva firma
      asignarMiembrosERR(id, nuevosMiembros, equipoERR);

      // Notificar
      if (import.meta.env.VITE_USE_API === 'true') {
        nuevosMiembros.forEach(async (miembroEmail) => {
          if (!casoActual?.miembrosERR?.includes(miembroEmail)) {
            await crearNotificacion({
              id_caso: id,
              email_destino: miembroEmail,
              texto: `Ha sido asignado al Equipo de Respuesta Rápida para la investigación del Caso ${id}.`
            });
          }
        });
      }

      if (casoActual?.estadoFlujo === 'ASIGNADO_A_ERR' || casoActual?.estadoFlujo === 'EN_EVALUACION') {
        const msg = esRiesgoAlto 
          ? `ERR Crítico asignado. Local: ${data.err_local || 'N/A'}. Inst: Esavi(${data.esavi_inst}), Epidemio(${data.epidemio_inst}), Inmuno(${data.inmuno_inst}).`
          : `Equipo ERR asignado. Clínico(${data.farmacovigilancia}), Inmuno(${data.inmunizaciones}), Epidemio(${data.epidemiologia}).`;
        avanzarCaso(id, 'EN_INVESTIGACION', 'Fase 4: Investigación', msg);
      } else {
        const msg = `Se ha actualizado la asignación del ERR.`;
        await useCasesStore.getState().agregarLogStore(id, msg);
      }
      alert("Asignación de equipo completada exitosamente.");
      navigate('/caso/' + id);
    }
  };

  const establecimientosMap = new Map();
  establecimientos.forEach(e => establecimientosMap.set(e.nombre, e));

  // Se ha restaurado la lógica de establecimientos "fantasma" PERO después de aplicar
  // un normalizador a los usuarios. Así evitamos duplicados conocidos ("Oficina" vs "Nivel"),
  // pero seguimos permitiendo que usuarios sin establecimiento en el catálogo (ej. SRS) sigan apareciendo.
  usuariosBD.forEach(u => {
    if (u.establecimiento && !establecimientosMap.has(u.establecimiento)) {
      let macro = u.institucionMacro || 'MINSAL';
      if (!u.institucionMacro) {
          const nameUpper = u.establecimiento.toUpperCase();
          if (nameUpper.includes('ISSS')) macro = 'ISSS';
          if (nameUpper.includes('SRS')) macro = 'SRS';
      }
      establecimientosMap.set(u.establecimiento, {
        id: `usr-est-${Math.random()}`,
        nombre: u.establecimiento,
        tipo: 'Agregado de Usuarios',
        sibasi: 'Desconocido',
        institucionMacro: macro,
        activo: true
      });
    }
  });

  const establecimientosCombinados = Array.from(establecimientosMap.values());
  const establecimientosActivos = establecimientosCombinados.filter((e: any) => e.activo === true || String(e.activo).toLowerCase() === 'true');
  
  let macroDelCaso = establecimientosCombinados.find((e: any) => e.nombre === casoActual?.establecimiento)?.institucionMacro;
  if (!macroDelCaso && casoActual) {
    const searchString = (casoActual.establecimiento + " " + casoActual.id).toUpperCase();
    if (searchString.includes("ISSS")) macroDelCaso = "ISSS";
    else if (searchString.includes("MINSAL")) macroDelCaso = "MINSAL";
  }

  const establecimientosFiltrados = establecimientosActivos.filter((e: any) => 
    (!macroDelCaso || e.institucionMacro === macroDelCaso || e.institucionMacro === 'MINSAL' || macroDelCaso === 'MINSAL')
  );

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 800, margin: 'auto', pb: 8, pt: 2 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Fase 3: Asignación de ERR <Typography component="span" variant="h6" color="text.secondary">(Llenado por: Jefaturas)</Typography>
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/caso/' + id)}>
          Cancelar
        </Button>
      </Box>

      {esRiesgoAlto && (
        <Alert severity="error" sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'error.main' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            CASO CRÍTICO / NIVEL NACIONAL DETECTADO
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            De acuerdo a la matriz de riesgo, se requiere una respuesta NACIONAL inmediata involucrando al Nivel Central. 
            Debe designar a los 4 perfiles de Auditoría Institucional y a los 2 responsables Locales del trabajo de campo.
          </Typography>
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 4, borderColor: '#e0e0e0', borderTop: '4px solid', borderTopColor: esRiesgoAlto ? 'error.main' : 'primary.main' }}>
        <Typography variant="h6" color={esRiesgoAlto ? "error" : "primary"} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
          <GroupAddIcon /> {esRiesgoAlto ? 'Conformación de ERR (Modo Crítico Nacional)' : 'Selección de Personal Investigador Local'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Designe al personal que conformará el Equipo de Respuesta Rápida para el caso <strong>{id}</strong>.
        </Typography>

        <Grid container spacing={3}>
          
          {/* MODO CRÍTICO */}
          {esRiesgoAlto && (
            <>
              {/* 1. ERR Institucional */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid #ccc', pb: 1 }}>
                  1. Auditoría Institucional y Regulatoria (Obligatorio)
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* ESAVI Institucional */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inst_esavi_inst" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small" label="Institución (ESAVI)" onChange={(e) => { field.onChange(e); setValue('esavi_inst', ''); }}>
                        {establecimientosActivos.map((inst: any) => (<MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>))}
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="esavi_inst" control={control} render={({ field }) => {
                      const options = usuariosBD.filter(u => String(u.role).includes('ESAVI_INSTITUCIONAL') && (!valores.inst_esavi_inst || u.establecimiento === valores.inst_esavi_inst));
                      return (
                        <TextField {...field} select fullWidth size="small" label="Referente ESAVI Institucional" required helperText="Auditoría y aprobación técnica del Anexo VII (Evaluación Clínica).">
                          {options.map((p) => (<MenuItem key={p.email} value={p.email}>{p.name}</MenuItem>))}
                        </TextField>
                      );
                    }}/>
                  </Grid>

                  {/* EPIDEMIO Institucional */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inst_epidemio_inst" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small" label="Institución (Epidemiología)" onChange={(e) => { field.onChange(e); setValue('epidemio_inst', ''); }}>
                        {establecimientosActivos.map((inst: any) => (<MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>))}
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="epidemio_inst" control={control} render={({ field }) => {
                      const options = usuariosBD.filter(u => String(u.role).includes('EPIDEMIO_INSTITUCIONAL') && (!valores.inst_epidemio_inst || u.establecimiento === valores.inst_epidemio_inst));
                      return (
                        <TextField {...field} select fullWidth size="small" label="Referente Epidemio Institucional" required helperText="Auditoría y aprobación técnica del Anexo VI (Domicilio y Comunidad).">
                          {options.map((p) => (<MenuItem key={p.email} value={p.email}>{p.name}</MenuItem>))}
                        </TextField>
                      );
                    }}/>
                  </Grid>

                  {/* INMUNO Institucional */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inst_inmuno_inst" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small" label="Institución (Inmunizaciones)" onChange={(e) => { field.onChange(e); setValue('inmuno_inst', ''); }}>
                        {establecimientosActivos.map((inst: any) => (<MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>))}
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inmuno_inst" control={control} render={({ field }) => {
                      const options = usuariosBD.filter(u => String(u.role).includes('INMUNO_INSTITUCIONAL') && (!valores.inst_inmuno_inst || u.establecimiento === valores.inst_inmuno_inst));
                      return (
                        <TextField {...field} select fullWidth size="small" label="Referente Inmuno Institucional" required helperText="Auditoría y aprobación técnica del Anexo V (Puesto de Vacunación).">
                          {options.map((p) => (<MenuItem key={p.email} value={p.email}>{p.name}</MenuItem>))}
                        </TextField>
                      );
                    }}/>
                  </Grid>

                  {/* SECRETARIADO SRS */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inst_secretariado_inst" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small" label="Institución (Regulación)" onChange={(e) => { field.onChange(e); setValue('secretariado_inst', ''); }}>
                        {establecimientosActivos.map((inst: any) => (<MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>))}
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="secretariado_inst" control={control} render={({ field }) => {
                      const options = usuariosBD.filter(u => String(u.role) === 'SECRETARIADO' && (!valores.inst_secretariado_inst || u.establecimiento === valores.inst_secretariado_inst));
                      return (
                        <TextField {...field} select fullWidth size="small" label="Referente Secretariado SRS" required helperText="Auditoría del expediente completo (Fase 5.2) y carga de documentación en el Espacio Regulatorio.">
                          {options.map((p) => (<MenuItem key={p.email} value={p.email}>{p.name}</MenuItem>))}
                        </TextField>
                      );
                    }}/>
                  </Grid>
                </Grid>
              </Grid>

              {/* 2. ERR Local */}
              <Grid size={{ xs: 12 }} sx={{ mt: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid #ccc', pb: 1 }}>
                  2. Responsables de Trabajo de Campo Local (Obligatorio)
                </Typography>
                
                {/* LÍDER LOCAL */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inst_err_local" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small" label="Institución Local (Líder)" onChange={(e) => { field.onChange(e); setValue('err_local', ''); }}>
                        {establecimientosFiltrados.map((inst: any) => (<MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>))}
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="err_local" control={control} render={({ field }) => {
                      const options = usuariosBD.filter(u => String(u.role).includes('LOCAL') && (!valores.inst_err_local || u.establecimiento === valores.inst_err_local));
                      return (
                        <TextField {...field} select fullWidth size="small" label="Responsable Local (Líder)" required helperText="Coordinador de campo y máximo responsable de garantizar el llenado de los Anexos V, VI y VII.">
                          {options.map((p) => (<MenuItem key={p.email} value={p.email}>{p.name} ({p.role})</MenuItem>))}
                        </TextField>
                      );
                    }}/>
                  </Grid>
                </Grid>

                {/* APOYO LOCAL */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inst_err_local_2" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small" label="Institución Local (Apoyo)" onChange={(e) => { field.onChange(e); setValue('err_local_2', ''); }}>
                        {establecimientosFiltrados.map((inst: any) => (<MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>))}
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="err_local_2" control={control} render={({ field }) => {
                      const options = usuariosBD.filter(u => String(u.role).includes('LOCAL') && (!valores.inst_err_local_2 || u.establecimiento === valores.inst_err_local_2) && u.email !== valores.err_local);
                      return (
                        <TextField {...field} select fullWidth size="small" label="Responsable Local (Apoyo)" required helperText="Acompaña al líder y se le delega el levantamiento y llenado de anexos específicos en territorio.">
                          {options.map((p) => (<MenuItem key={p.email} value={p.email}>{p.name} ({p.role})</MenuItem>))}
                        </TextField>
                      );
                    }}/>
                  </Grid>
                </Grid>
              </Grid>

            </>
          )}

          {/* MODO NORMAL (Mantiene estructura actual) */}
          {!esRiesgoAlto && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Farmacovigilancia (Clínico)</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inst_farmacovigilancia" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small" label="Seleccione Institución" onChange={(e) => { field.onChange(e); setValue('farmacovigilancia', ''); }}>
                        {establecimientosFiltrados.map((inst: any) => (<MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>))}
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="farmacovigilancia" control={control} render={({ field }) => {
                      const options = usuariosBD.filter(u => String(u.role).includes('ESAVI') && u.establecimiento === valores.inst_farmacovigilancia);
                      return (
                        <TextField {...field} select fullWidth size="small" label="Seleccione Referente Clínico" required disabled={!valores.inst_farmacovigilancia}>
                          {options.map((p) => (<MenuItem key={p.email} value={p.email}>{p.name}</MenuItem>))}
                        </TextField>
                      );
                    }}/>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Inmunizaciones (Puesto de Vacunación)</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inst_inmunizaciones" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small" label="Seleccione Institución" onChange={(e) => { field.onChange(e); setValue('inmunizaciones', ''); }}>
                        {establecimientosFiltrados.map((inst: any) => (<MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>))}
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inmunizaciones" control={control} render={({ field }) => {
                      const options = usuariosBD.filter(u => String(u.role).includes('INMUNO') && u.establecimiento === valores.inst_inmunizaciones);
                      return (
                        <TextField {...field} select fullWidth size="small" label="Seleccione Referente de Inmunizaciones" required disabled={!valores.inst_inmunizaciones}>
                          {options.map((p) => (<MenuItem key={p.email} value={p.email}>{p.name}</MenuItem>))}
                        </TextField>
                      );
                    }}/>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Componente de Epidemiología (Trabajo de Campo)</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="inst_epidemiologia" control={control} render={({ field }) => (
                      <TextField {...field} select fullWidth size="small" label="Seleccione Institución" onChange={(e) => { field.onChange(e); setValue('epidemiologia', ''); }}>
                        {establecimientosFiltrados.map((inst: any) => (<MenuItem key={inst.id} value={inst.nombre}>{inst.nombre}</MenuItem>))}
                      </TextField>
                    )}/>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller name="epidemiologia" control={control} render={({ field }) => {
                      const options = usuariosBD.filter(u => String(u.role).includes('EPIDEMIO') && u.establecimiento === valores.inst_epidemiologia);
                      return (
                        <TextField {...field} select fullWidth size="small" label="Seleccione Referente Epidemiológico" required disabled={!valores.inst_epidemiologia}>
                          {options.map((p) => (<MenuItem key={p.email} value={p.email}>{p.name}</MenuItem>))}
                        </TextField>
                      );
                    }}/>
                  </Grid>
                </Grid>
              </Grid>
            </>
          )}

          {/* Personal de Apoyo al ERR (Para cualquier nivel) */}
          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', borderBottom: '1px solid #ccc', pb: 1 }}>
              Personal de Apoyo al ERR (Opcional)
            </Typography>
            
            {/* Apoyo en Sistema */}
            <Box sx={{ mb: 3, mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Apoyos con usuario en plataforma:</Typography>
              <TextField 
                select 
                fullWidth 
                size="small" 
                label="Seleccione un usuario del catálogo para agregarlo" 
                value=""
                onChange={(e) => {
                  if (e.target.value && !apoyosSistema.some(a => a.email === e.target.value)) {
                    setApoyosSistema([...apoyosSistema, { email: e.target.value, permiso: 'VER', areaApoyo: 'GENERAL' }]);
                  }
                }}
              >
                {usuariosBD.filter(u => {
                  const yaElegidos = [
                    valores.esavi_inst, valores.epidemio_inst, valores.inmuno_inst, valores.secretariado_inst,
                    valores.err_local, valores.err_local_2,
                    valores.farmacovigilancia, valores.inmunizaciones, valores.epidemiologia,
                    ...apoyosSistema.map(a => a.email)
                  ];
                  return !yaElegidos.includes(u.email);
                }).map((p) => (<MenuItem key={p.email} value={p.email}>{p.name} ({p.role})</MenuItem>))}
              </TextField>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {apoyosSistema.map(apoyo => {
                   const u = usuariosBD.find(x => x.email === apoyo.email);
                   return (
                     <Box key={apoyo.email} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #ccc', p: 1, borderRadius: 1, bgcolor: '#fff' }}>
                       <Typography variant="body2" sx={{ fontWeight: 'bold', width: '30%' }}>
                         {u ? u.name : apoyo.email} ({u ? u.role : ''})
                       </Typography>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'flex-end' }}>
                         <TextField
                           select
                           size="small"
                           label="Apoyando a"
                           value={apoyo.areaApoyo}
                           onChange={(e) => {
                             const newVal = e.target.value;
                             setApoyosSistema(apoyosSistema.map(a => a.email === apoyo.email ? { ...a, areaApoyo: newVal } : a));
                           }}
                           sx={{ minWidth: 220 }}
                         >
                           <MenuItem value="GENERAL">General (Solo Visor)</MenuItem>
                           <MenuItem value="CLINICA">Farmacovigilancia (Anexo VII)</MenuItem>
                           <MenuItem value="INMUNO">Inmunizaciones (Anexo V)</MenuItem>
                           <MenuItem value="EPIDEMIO">Epidemiología (Anexo VI)</MenuItem>
                         </TextField>
                         <TextField
                           select
                           size="small"
                           label="Permisos"
                           value={apoyo.permiso}
                           disabled={apoyo.areaApoyo === 'GENERAL'}
                           onChange={(e) => {
                             const newPermiso = e.target.value as 'VER' | 'LLENAR';
                             setApoyosSistema(apoyosSistema.map(a => a.email === apoyo.email ? { ...a, permiso: newPermiso } : a));
                           }}
                           sx={{ minWidth: 150 }}
                         >
                           <MenuItem value="VER">Solo lectura</MenuItem>
                           <MenuItem value="LLENAR">Llenar Anexo</MenuItem>
                         </TextField>
                         <Button color="error" size="small" onClick={() => setApoyosSistema(apoyosSistema.filter(x => x.email !== apoyo.email))}>
                           Quitar
                         </Button>
                       </Box>
                     </Box>
                   );
                })}
              </Box>
            </Box>

            {/* Apoyo Manual */}
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Apoyos Externos (Nominación manual sin sistema):</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField size="small" fullWidth label="Nombre Completo" value={apoyoManualNombre} onChange={e => setApoyoManualNombre(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField size="small" fullWidth label="Cargo / Institución" value={apoyoManualCargo} onChange={e => setApoyoManualCargo(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button variant="outlined" fullWidth startIcon={<AddIcon />} onClick={handleAddApoyoManual} disabled={!apoyoManualNombre || !apoyoManualCargo}>
                    Añadir
                  </Button>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {apoyosManuales.map((apoyo, idx) => (
                   <Chip key={idx} label={`${apoyo.nombre} - ${apoyo.cargo}`} color="info" variant="outlined" onDelete={() => setApoyosManuales(apoyosManuales.filter((_, i) => i !== idx))} />
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Instrucciones especiales para el equipo</Typography>
            <Controller name="instrucciones" control={control} render={({ field }) => (
              <TextField {...field} fullWidth multiline rows={3} size="small" placeholder="Ej. Priorizar visita comunitaria debido a rumores en la zona..." />
            )}/>
          </Grid>
        </Grid>
      </Paper>

      {/* Se eliminó la alerta estática y checkbox del "Reporte de Situación" a solicitud del usuario */}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button 
          variant="contained" 
          color="secondary" 
          type="submit" 
          size="large" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : 'Confirmar Asignación'}
        </Button>
      </Box>

    </Box>
  );
}