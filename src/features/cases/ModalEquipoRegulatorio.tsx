import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Typography, Box, Alert } from '@mui/material';
import { useCasesStore, type CasoESAVI } from '../../store/useCasesStore';
import { listarUsuarios } from '../../services/adminService';
import { useAuthStore } from '../../store/useAuthStore';

interface ModalEquipoRegulatorioProps {
  open: boolean;
  onClose: () => void;
  casoActual: CasoESAVI;
}

export default function ModalEquipoRegulatorio({ open, onClose, casoActual }: ModalEquipoRegulatorioProps) {
  const asignarEquipoRegulatorio = useCasesStore(state => state.asignarEquipoRegulatorio);
  const { userEmail } = useAuthStore();
  
  const [usuariosSRS, setUsuariosSRS] = useState<any[]>([]);
  const [coordinador, setCoordinador] = useState('');
  const [analista, setAnalista] = useState('');
  const [apoyo, setApoyo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      listarUsuarios().then(res => {
        if (res.success) {
          // Filtrar usuarios del secretariado
          const secretariados = (res.data as any[]).filter(u => String(u.role).toUpperCase() === 'SECRETARIADO');
          setUsuariosSRS(secretariados);
          
          // Si ya hay un equipo asignado, precargar
          if (casoActual.equipoRegulatorio) {
            setCoordinador(casoActual.equipoRegulatorio.coordinador);
            setAnalista(casoActual.equipoRegulatorio.analista);
            setApoyo(casoActual.equipoRegulatorio.apoyo);
          } else {
            // El coordinador por defecto es el asignado en la Fase 3, o el usuario actual si no se encuentra
            const refSecretariado = casoActual.equipoERR?.idSecretariado ||
              casoActual.equipoERR?.idsInstitucionales?.find(email => secretariados.some(s => s.email === email)) ||
              casoActual.equipoERR?.idsInstitucionales?.[3];
            setCoordinador(refSecretariado || userEmail || '');
          }
        }
      });
    }
  }, [open, casoActual, userEmail]);

  const isCoordinator = !casoActual.equipoRegulatorio || casoActual.equipoRegulatorio.coordinador === userEmail;

  const handleSave = async () => {
    if (!isCoordinator) {
      alert("Solo el Secretariado Coordinador designado puede modificar los miembros del Sub-Equipo Regulatorio.");
      return;
    }
    if (!analista || !coordinador) {
      alert("El Coordinador y el Analista son obligatorios.");
      return;
    }
    setIsSubmitting(true);
    await asignarEquipoRegulatorio(casoActual.id, { coordinador, analista, apoyo });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ bgcolor: '#2e7d32', color: 'white', fontWeight: 'bold' }}>
        Conformar Sub-Equipo Regulatorio SRS
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {!isCoordinator ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Modo Consulta:</strong> El caso ya cuenta con un Sub-Equipo Regulatorio asignado. Solo el Secretariado Coordinador designado (<strong>{casoActual.equipoRegulatorio?.coordinador}</strong>) puede modificar la conformación.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            El expediente ha sido clasificado con <strong>Riesgo Alto (Regional) / Crítico (Nacional)</strong>. Según el POE, debe estructurar un equipo interno para la gestión del Espacio Regulatorio y el pase a comité.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              1. Secretariado Coordinador (Líder / Aprobador)
            </Typography>
            <TextField 
              select 
              fullWidth 
              size="small" 
              value={coordinador} 
              disabled={!isCoordinator}
              onChange={e => setCoordinador(e.target.value)}
              helperText="Lidera el equipo y aprueba la revisión regulatoria (Fase 5.2) para el pase a comité."
            >
              {usuariosSRS.map(u => (
                <MenuItem key={u.email} value={u.email}>{u.name} ({u.email})</MenuItem>
              ))}
            </TextField>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              2. Secretariado Analista (Operativo) *Obligatorio
            </Typography>
            <TextField 
              select 
              fullWidth 
              size="small" 
              value={analista} 
              disabled={!isCoordinator}
              onChange={e => setAnalista(e.target.value)}
              helperText="Exclusivo responsable para subir y gestionar documentación en el [Espacio Regulatorio]."
            >
              {usuariosSRS.filter(u => u.email !== coordinador).map(u => (
                <MenuItem key={u.email} value={u.email}>{u.name} ({u.email})</MenuItem>
              ))}
            </TextField>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              3. Secretariado Apoyo (Consulta / Seguimiento) *Opcional
            </Typography>
            <TextField 
              select 
              fullWidth 
              size="small" 
              value={apoyo} 
              disabled={!isCoordinator}
              onChange={e => setApoyo(e.target.value)}
              helperText="Permisos estrictos de solo lectura en la plataforma para consulta y seguimiento."
            >
              <MenuItem value=""><em>(Ninguno)</em></MenuItem>
              {usuariosSRS.filter(u => u.email !== coordinador && u.email !== analista).map(u => (
                <MenuItem key={u.email} value={u.email}>{u.name} ({u.email})</MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {/* RESUMEN DE FUNCIONES SEGÚN POE */}
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f4f6f8', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'block', mb: 1, textTransform: 'uppercase' }}>
            Funciones y Responsabilidades según el POE:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              • <strong>Coordinador:</strong> Lidera la auditoría de Fase 5.2, autoriza el pase al Comité Nacional de Expertos y presenta el Informe Técnico a las autoridades.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • <strong>Analista:</strong> Sube y organiza la documentación en la pestaña <code>[REGULATORIO]</code> del repositorio de evidencias para sustentar la causalidad ante el Comité.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • <strong>Apoyo:</strong> Da seguimiento continuo al expediente, consulta anexos y evidencias del caso con permisos de solo lectura.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          {isCoordinator ? 'Cancelar' : 'Cerrar'}
        </Button>
        {isCoordinator && (
          <Button onClick={handleSave} variant="contained" color="success" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Confirmar Equipo Regulatorio'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
