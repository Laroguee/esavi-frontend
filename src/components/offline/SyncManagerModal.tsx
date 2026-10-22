import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, List, ListItem, ListItemIcon, ListItemText,
  Chip, Divider, CircularProgress, Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DescriptionIcon from '@mui/icons-material/Description';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { obtenerDetallePendientes, type AnexoLocal, type EvidenciaLocal } from '../../services/offline/offlineDB';

interface SyncManagerModalProps {
  open: boolean;
  onClose: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  onSyncNow: () => void;
}

export default function SyncManagerModal({
  open,
  onClose,
  isOnline,
  isSyncing,
  onSyncNow
}: SyncManagerModalProps) {
  const [detalles, setDetalles] = useState<{ anexos: AnexoLocal[]; evidencias: EvidenciaLocal[] }>({
    anexos: [],
    evidencias: []
  });
  const [loading, setLoading] = useState(false);

  const cargarPendientes = async () => {
    setLoading(true);
    try {
      const data = await obtenerDetallePendientes();
      setDetalles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      cargarPendientes();
    }
  }, [open, isSyncing]);

  const totalPendientes = detalles.anexos.length + detalles.evidencias.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Gestor de Sincronización Local
          </Typography>
        </Box>
        <Chip
          label={isOnline ? 'En Línea' : 'Sin Conexión'}
          color={isOnline ? 'success' : 'warning'}
          size="small"
          icon={isOnline ? <CheckCircleIcon /> : <WifiOffIcon />}
        />
      </DialogTitle>

      <DialogContent dividers>
        {!isOnline && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            El dispositivo está desconectado. Los cambios se conservan protegidos en su navegador y se sincronizarán al recuperar la señal.
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={36} />
          </Box>
        ) : totalPendientes === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Todo está sincronizado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No tienes formularios ni evidencias pendientes de subir a la nube.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 'bold' }}>
              Elementos pendientes de subir ({totalPendientes}):
            </Typography>

            <List dense disablePadding>
              {/* Anexos en cola */}
              {detalles.anexos.map((anexo) => (
                <ListItem key={anexo.id} sx={{ bgcolor: '#f8fafc', borderRadius: 1.5, mb: 1, border: '1px solid #e2e8f0' }}>
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    <DescriptionIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {anexo.tipo_anexo.replace(/_/g, ' ')}
                      </Typography>
                    }
                    secondary={`Caso: ${anexo.id_caso} • Modificado: ${new Date(anexo.updatedAt).toLocaleTimeString()}`}
                  />
                  <Chip label="Formulario" size="small" variant="outlined" color="primary" />
                </ListItem>
              ))}

              {/* Evidencias binarias en cola */}
              {detalles.evidencias.map((ev) => (
                <ListItem key={ev.id} sx={{ bgcolor: '#f8fafc', borderRadius: 1.5, mb: 1, border: '1px solid #e2e8f0' }}>
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    <InsertDriveFileIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {ev.nombreArchivo}
                      </Typography>
                    }
                    secondary={`Caso: ${ev.id_caso} • ${(ev.tamanoBytes / 1024).toFixed(1)} KB • Cat: ${ev.categoria}`}
                  />
                  <Chip label="Evidencia" size="small" variant="outlined" color="secondary" />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onSyncNow}
          disabled={!isOnline || isSyncing || totalPendientes === 0}
          startIcon={isSyncing ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
        >
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
