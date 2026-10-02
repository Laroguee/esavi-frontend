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
            const refSecretariado = casoActual.equipoERR?.idsInstitucionales?.[3];
            setCoordinador(refSecretariado || userEmail || '');
          }
        }
      });
    }
  }, [open, casoActual, userEmail]);

  const handleSave = async () => {
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
        <Alert severity="info" sx={{ mb: 3 }}>
          El expediente ha sido clasificado como <strong>Crítico (Nacional)</strong>. Según el POE, debe estructurar un equipo interno para la gestión del Espacio Regulatorio.
        </Alert>

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
              onChange={e => setCoordinador(e.target.value)}
              helperText="Aprueba la revisión regulatoria (Fase 5.2) y da el Visto Bueno."
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
              onChange={e => setAnalista(e.target.value)}
              helperText="El único con permisos para subir y borrar documentos en el Espacio Regulatorio."
            >
              {usuariosSRS.filter(u => u.email !== coordinador).map(u => (
                <MenuItem key={u.email} value={u.email}>{u.name} ({u.email})</MenuItem>
              ))}
            </TextField>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              3. Secretariado Apoyo (Investigador Externo) *Opcional
            </Typography>
            <TextField 
              select 
              fullWidth 
              size="small" 
              value={apoyo} 
              onChange={e => setApoyo(e.target.value)}
              helperText="Permisos de solo lectura en la plataforma. Recolecta información fuera del sistema."
            >
              <MenuItem value=""><em>(Ninguno)</em></MenuItem>
              {usuariosSRS.filter(u => u.email !== coordinador && u.email !== analista).map(u => (
                <MenuItem key={u.email} value={u.email}>{u.name} ({u.email})</MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Button onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="success" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Confirmar Equipo Regulatorio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
