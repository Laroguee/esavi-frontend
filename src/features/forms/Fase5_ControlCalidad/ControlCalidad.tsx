import { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, FormControlLabel, RadioGroup, Radio, TextField, Button, Alert, Checkbox } from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { guardarAuditoriaFase5 } from '../../../services/firebaseService';

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
  const { currentRole } = useAuthStore();
  const { casos, devolverCaso, avanzarCaso, guardarAuditoriaParcialStore } = useCasesStore();
  
  const caso = casos.find(c => c.id === casoId);

  const [evaluaciones, setEvaluaciones] = useState<Record<string, EvaluacionAnexo>>(() => {
    return caso?.evaluaciones_fase5 || {
      'Anexo III (Logística)': { estado: '', observacion: '' },
      'Anexo V (Puesto de Vacunación)': { estado: '', observacion: '' },
      'Anexo VI (Domiciliaria)': { estado: '', observacion: '' },
      'Anexo VII (Clínico)': { estado: '', observacion: '' },
    };
  });

  // --- CANDADOS NORMATIVOS POE FASE 5 ---
  const [chkMinuta, setChkMinuta] = useState(false);
  const [chkLineaTiempo, setChkLineaTiempo] = useState(false);
  const [chkInformeFinal, setChkInformeFinal] = useState(false);

  const handleRadioChange = (anexo: string, value: string) => {
    setEvaluaciones(prev => ({
      ...prev,
      [anexo]: { ...prev[anexo], estado: value as 'aprobado' | 'observado' }
    }));
  };

  const handleObsChange = (anexo: string, value: string) => {
    setEvaluaciones(prev => ({
      ...prev,
      [anexo]: { ...prev[anexo], observacion: value }
    }));
  };

  const isAnexoEditable = (anexoNombre: string) => {
    if (currentRole === 'SECRETARIADO') return true;
    if (currentRole === 'EPIDEMIO_INSTITUCIONAL' && (anexoNombre === 'Anexo III (Logística)' || anexoNombre === 'Anexo VI (Domiciliaria)')) return true;
    if (currentRole === 'INMUNO_INSTITUCIONAL' && anexoNombre === 'Anexo V (Puesto de Vacunación)') return true;
    if (currentRole === 'ESAVI_INSTITUCIONAL' && anexoNombre === 'Anexo VII (Clínico)') return true;
    return false;
  };

  const handleGuardarParcial = async (anexo: string) => {
    const evalData = evaluaciones[anexo];
    if (!evalData.estado) {
      alert('Seleccione un estado (Aprobado u Observado) antes de guardar.');
      return;
    }
    if (evalData.estado === 'observado' && !evalData.observacion.trim()) {
      alert('Debe ingresar la justificación de la observación.');
      return;
    }

    await guardarAuditoriaParcialStore(casoId, anexo, evalData.estado, evalData.observacion);
    
    if (evalData.estado === 'observado') {
      const nuevoEstado = currentRole === 'SECRETARIADO' ? 'DEVUELTO_A_INSTITUCIONAL' : 'DEVUELTO_A_ERR';
      const msg = `Expediente devuelto por ${currentRole} para corrección en ${anexo}.`;
      guardarAuditoriaFase5(casoId, currentRole || 'Desconocido', nuevoEstado, evaluaciones);
      await devolverCaso(casoId, nuevoEstado, evalData.observacion, anexo, msg);
      alert(`Anexo observado. Expediente devuelto exitosamente a estado ${nuevoEstado}.`);
      if (onClose) onClose(); else navigate(`/caso/${casoId}`);
    } else {
      alert(`Evaluación de ${anexo} guardada exitosamente.`);
    }
  };

  const handleAprobarFinal = () => {
    const todosAprobados = Object.values(evaluaciones).every(e => e.estado === 'aprobado');
    if (!todosAprobados && currentRole !== 'SECRETARIADO') {
      alert("No puede enviar el expediente al Secretariado hasta que TODOS los anexos estén aprobados por sus respectivos especialistas.");
      return;
    }

    const isSecretariado = currentRole === 'SECRETARIADO';

    if (!isSecretariado) {
      if (!chkMinuta || !chkLineaTiempo || !chkInformeFinal) {
        alert("Debe confirmar todos los Requisitos de Cierre Institucional marcando las casillas.");
        return;
      }
    }

    const nuevoEstado = currentRole === 'ESAVI_INSTITUCIONAL' ? 'EN_REVISION_SECRETARIADO' : 'APROBADO_PARA_COMITE';
    const nuevaFase = currentRole === 'ESAVI_INSTITUCIONAL' ? 'Fase 5: Control Calidad' : 'Fase 5: Aprobado para Comité';
    const msg = `Expediente aprobado por ${currentRole}. Avanza a ${nuevoEstado}.`;

    guardarAuditoriaFase5(casoId, currentRole || 'Desconocido', nuevoEstado, evaluaciones);
    avanzarCaso(casoId, nuevoEstado, nuevaFase, msg);
    alert(`Expediente aprobado. Pasa a estado: ${nuevoEstado}.`);
    if (onClose) onClose(); else navigate(`/caso/${casoId}`);
  };

  if (!caso) return <Alert severity="error">Caso no encontrado</Alert>;

  const isPaseDeMando = currentRole === 'ESAVI_INSTITUCIONAL' && caso.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL';

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
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{anexoNombre}</Typography>
                      {!editable && <Typography variant="caption" color="text.secondary">(Solo lectura)</Typography>}
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

      {(!isPaseDeMando && (currentRole === 'ESAVI_INSTITUCIONAL' || currentRole === 'SECRETARIADO')) && (
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          {currentRole === 'ESAVI_INSTITUCIONAL' && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f4f6f8', borderRadius: 1, border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                Requisitos de Cierre Institucional (Paso 16 del POE)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                Solo habilitado cuando los 4 anexos estén aprobados.
              </Typography>
              <FormControlLabel control={<Checkbox checked={chkMinuta} onChange={(e) => setChkMinuta(e.target.checked)} />} label={<Typography variant="body2">Minuta de reunión de cierre elaborada</Typography>} />
              <FormControlLabel control={<Checkbox checked={chkLineaTiempo} onChange={(e) => setChkLineaTiempo(e.target.checked)} />} label={<Typography variant="body2">Línea de tiempo del caso documentada</Typography>} />
              <FormControlLabel control={<Checkbox checked={chkInformeFinal} onChange={(e) => setChkInformeFinal(e.target.checked)} />} label={<Typography variant="body2">Informe final consolidado en el Gestor de Evidencias</Typography>} />
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleAprobarFinal}
              disabled={currentRole === 'ESAVI_INSTITUCIONAL' ? (!chkMinuta || !chkLineaTiempo || !chkInformeFinal || !Object.values(evaluaciones).every(e => e.estado === 'aprobado')) : false}
              sx={{ fontWeight: 'bold', px: 4 }}
            >
              {currentRole === 'ESAVI_INSTITUCIONAL' ? 'Aprobar y Enviar al Secretariado' : 'Aprobar y Enviar al Comité'}
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
