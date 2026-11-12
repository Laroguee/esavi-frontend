import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Box, Alert, CircularProgress,
  InputAdornment, IconButton
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

interface CambioClaveModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CambioClaveModal({ open, onClose }: CambioClaveModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleClose = () => {
    if (!loading) {
      setPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
      onClose();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass || !cleanConfirm) {
      setErrorMsg("Debe completar todos los campos.");
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMsg("Las contraseñas no coinciden. Verifíquelas.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setErrorMsg("No hay una sesión activa de Firebase. Inicie sesión nuevamente.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(currentUser, cleanPass);
      setSuccessMsg("¡Contraseña actualizada exitosamente! Utilice esta nueva contraseña en su próximo inicio de sesión.");
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err: any) {
      console.error("Error al actualizar contraseña:", err);
      if (err.code === 'auth/requires-recent-login') {
        setErrorMsg("Por seguridad de la plataforma, cambiar la contraseña requiere un inicio de sesión reciente. Por favor cierre sesión, vuelva a entrar e inténtelo nuevamente.");
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg("La contraseña es muy débil. Incluya letras y números.");
      } else {
        setErrorMsg(err.message || "No se pudo actualizar la contraseña.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#1976d2', color: 'white', py: 1.5 }}>
        <VpnKeyIcon />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Cambiar mi Contraseña</Typography>
      </DialogTitle>

      <Box component="form" onSubmit={handleSave} noValidate>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingrese su nueva contraseña de acceso institucional. Debe tener un mínimo de 6 caracteres.
          </Typography>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMsg}
            </Alert>
          )}

          <TextField
            fullWidth
            size="small"
            label="Nueva Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || !!successMsg}
            margin="normal"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          <TextField
            fullWidth
            size="small"
            label="Confirmar Nueva Contraseña"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || !!successMsg}
            margin="normal"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={handleClose} disabled={loading} color="inherit">
            {successMsg ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!successMsg && (
            <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ fontWeight: 'bold', minWidth: 120 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Actualizar'}
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
}

