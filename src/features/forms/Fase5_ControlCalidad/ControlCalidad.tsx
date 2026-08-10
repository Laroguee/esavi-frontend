import { useState } from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent, FormControlLabel, RadioGroup, Radio, TextField, Button, Alert } from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';
import { useCasesStore } from '../../../store/useCasesStore';
import { useAuthStore } from '../../../store/useAuthStore';

interface ControlCalidadProps {
  casoId: string;
}

type EvaluacionAnexo = {
  estado: 'aprobado' | 'observado' | '';
  observacion: string;
};

export default function ControlCalidad({ casoId }: ControlCalidadProps) {
  const navigate = useNavigate();
  const { currentRole } = useAuthStore();
  const { casos, devolverCaso, avanzarCaso } = useCasesStore();
  
  const caso = casos.find(c => c.id === casoId);

  const [evaluaciones, setEvaluaciones] = useState<Record<string, EvaluacionAnexo>>({
    'Anexo III (Logística)': { estado: '', observacion: '' },
    'Anexo V (Puesto de Vacunación)': { estado: '', observacion: '' },
    'Anexo VI (Domiciliaria)': { estado: '', observacion: '' },
    'Anexo VII (Clínico)': { estado: '', observacion: '' },
  });

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

  const handleDevolver = () => {
    const anexoObservado = Object.entries(evaluaciones).find(([_, evalData]) => evalData.estado === 'observado');
    
    if (!anexoObservado) {
      alert("Debe seleccionar al menos un anexo con observaciones para devolver el expediente.");
      return;
    }

    const [nombreAnexo, evalData] = anexoObservado;
    
    if (!evalData.observacion.trim()) {
      alert(`Debe ingresar la justificación de la observación para el ${nombreAnexo}.`);
      return;
    }

    const nuevoEstado = currentRole === 'ESAVI_INSTITUCIONAL' ? 'DEVUELTO_A_ERR' : 'DEVUELTO_A_INSTITUCIONAL';
    const msg = `Expediente devuelto por ${currentRole} para corrección en ${nombreAnexo}.`;

    devolverCaso(casoId, nuevoEstado, evalData.observacion, nombreAnexo, msg);
    alert(`Expediente devuelto exitosamente a estado ${nuevoEstado}.`);
    window.location.reload(); // Recargar modal/vista
  };

  const handleAprobar = () => {
    // Validar que todos los anexos estén evaluados
    const anexosFaltantes = Object.keys(evaluaciones).filter(k => evaluaciones[k].estado === '');
    if (anexosFaltantes.length > 0) {
      alert("Debe evaluar todos los anexos antes de aprobar el expediente.");
      return;
    }

    const hayObservaciones = Object.values(evaluaciones).some(e => e.estado === 'observado');
    if (hayObservaciones) {
      alert("No puede aprobar un expediente si existen anexos con observaciones.");
      return;
    }

    const nuevoEstado = currentRole === 'ESAVI_INSTITUCIONAL' ? 'EN_REVISION_SECRETARIADO' : 'APROBADO_PARA_COMITE';
    const nuevaFase = currentRole === 'ESAVI_INSTITUCIONAL' ? 'Fase 5: Control Calidad' : 'Fase 6: Dictamen';
    const msg = `Expediente aprobado por ${currentRole}. Avanza a ${nuevoEstado}.`;

    avanzarCaso(casoId, nuevoEstado, nuevaFase, msg);
    alert(`Expediente aprobado. Pasa a estado: ${nuevoEstado}.`);
    window.location.reload();
  };

  if (!caso) return <Alert severity="error">Caso no encontrado</Alert>;

  const isPaseDeMando = currentRole === 'ESAVI_INSTITUCIONAL' && caso.estadoFlujo === 'DEVUELTO_A_INSTITUCIONAL';

  const handleRemitirERR = () => {
    const msg = 'La Jefatura solicita correcciones en los anexos de campo.';
    devolverCaso(casoId, 'DEVUELTO_A_ERR', caso.observacionActual || '', caso.anexoRechazado || 'General', msg);
    alert(`Expediente devuelto exitosamente a estado DEVUELTO_A_ERR.`);
    window.location.reload();
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
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 2, fontSize: '1.1rem' }}>
              <strong>Atención:</strong> El Secretariado ha devuelto este expediente con las siguientes observaciones: <br/>
              <em>{caso.observacionActual}</em>
            </Alert>
          </Grid>
        ) : (
          Object.entries(evaluaciones).map(([anexoNombre, evalData]) => (
            <Grid item xs={12} key={anexoNombre}>
              <Card elevation={2} sx={{ borderLeft: evalData.estado === 'observado' ? '4px solid #d32f2f' : evalData.estado === 'aprobado' ? '4px solid #2e7d32' : '4px solid #1976d2' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>{anexoNombre}</Typography>
                  
                  <RadioGroup 
                    row 
                    value={evalData.estado} 
                    onChange={(e) => handleRadioChange(anexoNombre, e.target.value)}
                  >
                    <FormControlLabel value="aprobado" control={<Radio color="success" />} label="Aprobado" />
                    <FormControlLabel value="observado" control={<Radio color="error" />} label="Con Observaciones" />
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
                        onChange={(e) => handleObsChange(anexoNombre, e.target.value)}
                        required
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
        {isPaseDeMando ? (
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleRemitirERR}
            sx={{ fontWeight: 'bold', px: 4 }}
          >
            Remitir Observaciones al Equipo de Campo (ERR)
          </Button>
        ) : (
          <>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleDevolver}
              sx={{ fontWeight: 'bold', px: 4 }}
            >
              Devolver Expediente
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleAprobar}
              sx={{ fontWeight: 'bold', px: 4 }}
            >
              Aprobar Expediente
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
