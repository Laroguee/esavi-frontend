import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, FormControlLabel, RadioGroup, Radio, TextField, Button, Alert, Chip } from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { guardarAuditoriaFase5, listarArchivosCaso } from '../../../services/firebaseService';
import { obtenerEvidenciasCasoOffline } from '../../../services/offline/offlineDB';

interface ControlCalidadProps {
  casoId: string;
  onClose?: () => void;
}

type EvaluacionAnexo = {
  estado: 'aprobado' | 'observado' | '';
  observacion: string;
};

export default function ControlCalidad({ casoId, onClose }: ControlCalidadProps) {
  const navigate = useNavigate();
  const { currentRole, userEmail } = useAuthStore();
  const { casos, devolverCaso, avanzarCaso, guardarAuditoriaParcialStore, actualizarArchivosCasoStore } = useCasesStore();
  
  const caso = casos.find(c => c.id === casoId);
  const [evidenciasCount, setEvidenciasCount] = useState<number>(() => (caso?.archivosAdjuntos || []).length);
  const [verificandoEvidencias, setVerificandoEvidencias] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    async function checkEvidencias() {
      if (!casoId) return;
      setVerificandoEvidencias(true);
      try {
        let archivosPlanos: any[] = [];
        if (navigator.onLine) {
          const res = await listarArchivosCaso(casoId);
          if (res.success && Array.isArray(res.data)) {
            archivosPlanos = res.data.flatMap((g: any) =>
              (g.archivos || []).map((a: any) => ({ ...a, categoria: g.carpeta }))
            );
          }
        }
        try {
          const locales = await obtenerEvidenciasCasoOffline(casoId);
          const localesPendientes = locales.filter(l => l.estado !== 'SINCRONIZADO').map(l => ({
            name: l.nombreArchivo,
            categoria: l.categoria,
            size: l.tamanoBytes,
            isOffline: true
          }));
          archivosPlanos = [...localesPendientes, ...archivosPlanos];
        } catch {
          // Ignorar error de lectura offline
        }
        if (active) {
          setEvidenciasCount(archivosPlanos.length);
          actualizarArchivosCasoStore(casoId, archivosPlanos);
        }
      } finally {
        if (active) setVerificandoEvidencias(false);
      }
    }
    checkEvidencias();
    return () => { active = false; };
  }, [casoId, actualizarArchivosCasoStore]);

  const [evaluaciones, setEvaluaciones] = useState<Record<string, EvaluacionAnexo>>(() => {
    const defaults: Record<string, EvaluacionAnexo> = {
      'Anexo V (Puesto de Vacunación)': { estado: '', observacion: '' },
      'Anexo VI (Domiciliaria)': { estado: '', observacion: '' },
      'Anexo VII (Clínico)': { estado: '', observacion: '' },
    };
    const loaded = { ...defaults };
    const sanitizarEvaluacion = (ev?: EvaluacionAnexo): EvaluacionAnexo | undefined => {
      if (!ev) return undefined;
      // Si el anexo ya quedó aprobado en Fase 5.1, limpiar cualquier observación previa para que Fase 5.2 inicie limpia
      if (ev.estado === 'aprobado') {
        return { estado: ev.estado, observacion: '' };
      }
      return { ...ev };
    };
    if (caso?.evaluaciones_fase5) {
      const evV = sanitizarEvaluacion(caso.evaluaciones_fase5['Anexo V (Puesto de Vacunación)']);
      const evVI = sanitizarEvaluacion(caso.evaluaciones_fase5['Anexo VI (Domiciliaria)']);
      const evVII = sanitizarEvaluacion(caso.evaluaciones_fase5['Anexo VII (Clínico)']);
      if (evV) loaded['Anexo V (Puesto de Vacunación)'] = evV;
      if (evVI) loaded['Anexo VI (Domiciliaria)'] = evVI;
      if (evVII) loaded['Anexo VII (Clínico)'] = evVII;
    }
    return loaded;
  });

  const isJefe = ['ESAVI_INSTITUCIONAL', 'EPIDEMIO_INSTITUCIONAL', 'INMUNO_INSTITUCIONAL'].includes(currentRole as string);
  const idsInstAsignados = caso?.equipoERR?.idsInstitucionales || [];
  const tieneAsignacionInstitucional = idsInstAsignados.length > 0;
  const isJefeAsignado = isJefe && (!tieneAsignacionInstitucional || idsInstAsignados.includes(userEmail || ''));
  const isSecretariado = currentRole === 'SECRETARIADO';
  const isSecretariadoCoordinador = isSecretariado && (!caso?.equipoRegulatorio || caso.equipoRegulatorio.coordinador === userEmail);
  const isSecretariadoAnalista = isSecretariado && caso?.equipoRegulatorio?.analista === userEmail;
  const isSecretariadoApoyo = isSecretariado && caso?.equipoRegulatorio?.apoyo === userEmail;

  const handleRadioChange = (anexo: string, value: string) => {
    setEvaluaciones(prev => ({
      ...prev,
      [anexo]: {
        ...prev[anexo],
        estado: value as 'aprobado' | 'observado',
        observacion: value === 'aprobado' ? '' : prev[anexo].observacion
      }
    }));
  };

  const handleObsChange = (anexo: string, value: string) => {
    setEvaluaciones(prev => ({
      ...prev,
      [anexo]: { ...prev[anexo], observacion: value }
    }));
  };

  const isAnexoEditable = (anexoNombre: string) => {
    if (isSecretariado) return isSecretariadoCoordinador;
    if (!isJefeAsignado) return false;
    if (currentRole === 'EPIDEMIO_INSTITUCIONAL' && anexoNombre === 'Anexo VI (Domiciliaria)') return true;
    if (currentRole === 'INMUNO_INSTITUCIONAL' && anexoNombre === 'Anexo V (Puesto de Vacunación)') return true;
    if (currentRole === 'ESAVI_INSTITUCIONAL' && anexoNombre === 'Anexo VII (Clínico)') return true;
    return false;
  };

  const handleGuardarParcial = async (anexo: string) => {
    if (isSecretariado && !isSecretariadoCoordinador) {
      alert('Solo el Secretariado Coordinador puede guardar evaluaciones en la Fase 5.2.');
      return;
    }
    if (isJefe && !isJefeAsignado) {
      alert('No fue designado como auditor institucional de este caso en Fase 3.');
      return;
    }
    const evalData = evaluaciones[anexo];
    if (!evalData.estado) {
      alert('Seleccione un estado (Aprobado u Observado) antes de guardar.');
      return;
    }
    if (evalData.estado === 'observado' && !evalData.observacion.trim()) {
      alert('Debe ingresar la justificación de la observación.');
      return;
    }

    const obsLimpia = evalData.estado === 'aprobado' ? '' : evalData.observacion;
    await guardarAuditoriaParcialStore(casoId, anexo, evalData.estado, obsLimpia);
    alert(`Evaluación de ${anexo} guardada exitosamente en el sistema.`);
  };

  const handleDevolverExpediente = async () => {
    if (isSecretariado && !isSecretariadoCoordinador) {
      alert('La devolución con observaciones (Fase 5.2) corresponde exclusivamente al Secretariado Coordinador.');
      return;
    }
    if (isJefe && !isJefeAsignado) {
      alert('Solo los referentes institucionales designados en la Fase 3 pueden devolver este caso.');
      return;
    }
    const anexosObservados = Object.entries(evaluaciones).filter(([_, data]) => data.estado === 'observado');
    if (anexosObservados.length === 0) {
      alert("No hay anexos observados para devolver.");
      return;
    }

    const nuevoEstado = currentRole === 'SECRETARIADO' ? 'DEVUELTO_A_INSTITUCIONAL' : 'DEVUELTO_A_ERR';
    const nombresAnexos = anexosObservados.map(([nombre]) => nombre).join(', ');
    const observacionesConcat = anexosObservados.map(([nombre, data]) => `${nombre}: ${data.observacion}`).join(' | ');
    const msg = `Expediente devuelto por ${currentRole} para corrección en: ${nombresAnexos}.`;
    
    guardarAuditoriaFase5(casoId, currentRole || 'Desconocido', nuevoEstado, evaluaciones);
    await devolverCaso(casoId, nuevoEstado, observacionesConcat, nombresAnexos, msg);
    
    alert(`Expediente devuelto exitosamente a estado ${nuevoEstado} con múltiples observaciones.`);
    if (onClose) onClose(); else navigate(`/caso/${casoId}`);
  };

  const handleAprobarFinal = () => {
    if (isSecretariado && !isSecretariadoCoordinador) {
      alert('La aprobación y envío al comité (Fase 5.2) corresponde exclusivamente al Secretariado Coordinador.');
      return;
    }
    if (isJefe && !isJefeAsignado) {
      alert('Solo los referentes institucionales designados en la Fase 3 pueden aprobar este caso.');
      return;
    }
    if (isSecretariado && evidenciasCount === 0) {
      alert('Bloqueado: El repositorio del caso (Gestor de Evidencias) no contiene documentos adjuntos. Debe cargarse al menos un respaldo antes de aprobar el envío al Comité.');
      return;
    }
    const todosAprobados = Object.values(evaluaciones).every(e => e.estado === 'aprobado');
    if (!todosAprobados && currentRole !== 'SECRETARIADO') {
      alert("No puede enviar el expediente al Secretariado hasta que TODOS los anexos técnicos (V, VI y VII) estén aprobados por sus respectivos especialistas.");
      return;
    }

    const evaluacionesLimpias = Object.fromEntries(
      Object.entries(evaluaciones).map(([k, v]) => [
        k,
        v.estado === 'aprobado' ? { estado: v.estado, observacion: '' } : v
      ])
    );

    const nuevoEstado = isJefe ? 'EN_REVISION_SECRETARIADO' : 'APROBADO_PARA_COMITE';
    const nuevaFase = isJefe ? 'Fase 5: Control Calidad' : 'Fase 5: Aprobado para Comité';
    const msg = `Expediente aprobado por ${currentRole}. Avanza a ${nuevoEstado}.`;

    guardarAuditoriaFase5(casoId, currentRole || 'Desconocido', nuevoEstado, evaluacionesLimpias);
    avanzarCaso(casoId, nuevoEstado, nuevaFase, msg);
    alert(`Expediente aprobado. Pasa a estado: ${nuevoEstado}.`);
    if (onClose) onClose(); else navigate(`/caso/${casoId}`);
  };

  if (!caso) return <Alert severity="error">Caso no encontrado</Alert>;

  const isPaseDeMando = isJefeAsignado && caso.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL';

  const handleRemitirERR = () => {
    const msg = 'La Jefatura solicita correcciones en los anexos de campo.';
    guardarAuditoriaFase5(casoId, currentRole || 'Desconocido', 'DEVUELTO_A_ERR', evaluaciones);
    devolverCaso(casoId, 'DEVUELTO_A_ERR', caso.observacionActual || '', caso.anexoRechazado || 'General', msg);
    alert(`Expediente devuelto exitosamente a estado DEVUELTO_A_ERR.`);
    if (onClose) onClose(); else navigate(`/caso/${casoId}`);
  };

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <FactCheckIcon color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>Auditoría y Control de Calidad</Typography>
          <Typography variant="body2" color="text.secondary">Fase 5: Revisión de anexos de la investigación de campo.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {isPaseDeMando ? (
          <Grid size={{ xs: 12 }}>
            <Alert severity="warning" sx={{ mb: 2, fontSize: '1.1rem' }}>
              <strong>Atención:</strong> El Secretariado ha devuelto este expediente con las siguientes observaciones: <br/>
              <em>{caso.observacionActual}</em>
            </Alert>
          </Grid>
        ) : (
          Object.entries(evaluaciones).map(([anexoNombre, evalData]) => {
            const editable = isAnexoEditable(anexoNombre);
            return (
              <Grid size={{ xs: 12 }} key={anexoNombre}>
                <Card elevation={2} sx={{ borderLeft: evalData.estado === 'observado' ? '4px solid #d32f2f' : evalData.estado === 'aprobado' ? '4px solid #2e7d32' : '4px solid #1976d2', opacity: editable ? 1 : 0.7 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{anexoNombre}</Typography>
                        {evalData.estado === 'aprobado' && <Chip label="Aprobado" color="success" size="small" />}
                        {evalData.estado === 'observado' && <Chip label="Con Observaciones" color="error" size="small" />}
                      </Box>
                      {!editable && <Typography variant="caption" color="text.secondary">(Solo lectura para su rol)</Typography>}
                    </Box>
                    
                    <RadioGroup 
                      row 
                      value={evalData.estado} 
                      onChange={(e) => editable && handleRadioChange(anexoNombre, e.target.value)}
                    >
                      <FormControlLabel value="aprobado" control={<Radio color="success" disabled={!editable} />} label="Aprobado" />
                      <FormControlLabel value="observado" control={<Radio color="error" disabled={!editable} />} label="Con Observaciones" />
                    </RadioGroup>

                    {evalData.estado === 'observado' && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <WarningAmberIcon color="error" sx={{ mt: 1 }} />
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label={`Observaciones para ${anexoNombre}`}
                          variant="outlined"
                          color="error"
                          value={evalData.observacion}
                          onChange={(e) => editable && handleObsChange(anexoNombre, e.target.value)}
                          disabled={!editable}
                          required
                        />
                      </Box>
                    )}

                    {editable && (
                       <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                         <Button variant="outlined" size="small" color="primary" onClick={() => handleGuardarParcial(anexoNombre)}>
                           Guardar Evaluación de {anexoNombre}
                         </Button>
                       </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {(!isPaseDeMando && (isJefe || currentRole === 'SECRETARIADO')) && (
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          {isJefe && !isJefeAsignado && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Modo Consulta — Auditor Institucional No Designado en Fase 3
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                En este expediente de riesgo Alto o Crítico, la auditoría institucional (Fase 5.1) fue asignada exclusivamente a los referentes seleccionados en la Fase 3 ({idsInstAsignados.join(', ')}). Su perfil conserva permisos de visualización únicamente.
              </Typography>
            </Alert>
          )}

          {isSecretariado && !isSecretariadoCoordinador && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Modo Consulta — Su Rol: {isSecretariadoAnalista ? 'Secretariado Analista (Operativo)' : isSecretariadoApoyo ? 'Secretariado Apoyo (Acompañamiento)' : 'Secretariado Técnico'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {isSecretariadoAnalista ? (
                  <>
                    Como <strong>Secretariado Analista</strong>, su función principal en este caso es preparar y subir la documentación regulatoria en la pestaña <strong>[REGULATORIO]</strong> del Gestor de Evidencias. La firma y aprobación final de la auditoría (Fase 5.2) corresponde al Secretariado Coordinador (<strong>{caso?.equipoRegulatorio?.coordinador || 'SRS'}</strong>).
                  </>
                ) : (
                  <>
                    Como <strong>Secretariado Apoyo</strong>, su función es el seguimiento y consulta integral de los anexos y evidencias del caso con permisos de solo lectura. La resolución y aprobación de la auditoría corresponde al Secretariado Coordinador (<strong>{caso?.equipoRegulatorio?.coordinador || 'SRS'}</strong>).
                  </>
                )}
              </Typography>
            </Alert>
          )}

          

          {isJefe && isJefeAsignado && !verificandoEvidencias && evidenciasCount === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Aviso de Repositorio Documental:</strong> Este expediente aún no cuenta con documentos subidos en el <em>Gestor de Evidencias</em>. Recuerde que no podrá enviarse al Comité de Expertos en Fase 5.2/6 sin al menos un respaldo documental adjunto.
            </Alert>
          )}

          {isSecretariado && isSecretariadoCoordinador && !verificandoEvidencias && evidenciasCount === 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>Documentación Obligatoria Faltante:</strong> El <em>Gestor de Evidencias</em> de este expediente tiene <strong>0 documentos cargados</strong>. Para aprobar el pase al Comité de Expertos, primero debe cargarse al menos un archivo de respaldo en el repositorio (Clínica, PNI, Epidemiológica, General o [REGULATORIO]).
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {Object.values(evaluaciones).some(e => e.estado === 'observado') && (isJefeAsignado || isSecretariadoCoordinador) && (
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDevolverExpediente}
                sx={{ fontWeight: 'bold', px: 4 }}
              >
                Devolver con Observaciones
              </Button>
            )}
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleAprobarFinal}
              disabled={
                isJefe 
                  ? (!isJefeAsignado || !Object.values(evaluaciones).every(e => e.estado === 'aprobado'))
                  : (!isSecretariadoCoordinador || verificandoEvidencias || evidenciasCount === 0)
              }
              sx={{ fontWeight: 'bold', px: 4 }}
            >
              {isJefe ? 'Aprobar y Enviar al Secretariado' : 'Aprobar y Enviar al Comité'}
            </Button>
          </Box>
        </Box>
      )}

      {isPaseDeMando && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleRemitirERR}
            sx={{ fontWeight: 'bold', px: 4 }}
          >
            Remitir Observaciones al Equipo de Campo (ERR)
          </Button>
        </Box>
      )}
    </Box>
  );
}
