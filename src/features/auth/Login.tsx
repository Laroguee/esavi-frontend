import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, InputAdornment, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { login } from '../../services/authService';

type LoginFormData = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openForgotModal, setOpenForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotAlert, setForgotAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSendForgotEmail = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotAlert(null);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim().toLowerCase());
      setForgotAlert({
        type: 'success',
        msg: 'Enlace enviado exitosamente. Si su dirección institucional recibe correos externos, revise su bandeja de entrada.'
      });
      setForgotEmail('');
    } catch (err: any) {
      setForgotAlert({
        type: 'error',
        msg: err.message || 'No se pudo enviar el correo de recuperación.'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const { control, handleSubmit } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg(null); 
    setLoading(true);
    const emailClean = data.email.trim().toLowerCase();
    const passwordClean = data.password.trim();
    const result = await login(emailClean, passwordClean);
    
    if (result.success && result.user) {
      setSession(result.user as any);
      navigate('/'); 
    } else {
      setErrorMsg(result.error || "Credenciales incorrectas o usuario no autorizado por la SRS.");
    }
    
    setLoading(false);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: '#f4f6f8',
        backgroundImage: 'url(https://res.cloudinary.com/dowejnpvd/image/upload/v1769541332/fondo_srs_nhzesc.png)',
        backgroundSize: 'contain', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Card elevation={6} sx={{ maxWidth: 450, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 5 }}>
          
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <HealthAndSafetyIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
              Sistema de Notificación ESAVI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Superintendencia de Regulación Sanitaria (SRS)
            </Typography>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, fontWeight: 'bold' }}>
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Controller
              name="email"
              control={control}
              rules={{ required: "El correo es obligatorio" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth label="Correo Institucional" variant="outlined" margin="normal"
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={{ required: "La contraseña es obligatoria" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth type="password" label="Contraseña" variant="outlined" margin="normal" sx={{ mb: 4 }}
                  error={!!fieldState.error} helperText={fieldState.error?.message}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              )}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -2, mb: 3 }}>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => { setOpenForgotModal(true); setForgotAlert(null); }}
                sx={{ textTransform: 'none', fontSize: '0.85rem' }}
              >
                ¿Olvidó su contraseña?
              </Button>
            </Box>

            <Button type="submit" fullWidth variant="contained" color="secondary" size="large" sx={{ py: 1.5, fontWeight: 'bold' }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'INICIAR SESIÓN'}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 4 }}>
            Acceso restringido a personal autorizado del MINSAL, ISSS y SRS.
          </Typography>
        </CardContent>
      </Card>
    
      {/* DIÁLOGO: RECUPERACIÓN DE CONTRASEÑA */}
      <Dialog open={openForgotModal} onClose={() => !forgotLoading && setOpenForgotModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', py: 1.5 }}>
          Recuperar Contraseña
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingrese su correo institucional. Si su cuenta tiene una dirección válida para recibir mensajes externos, se le enviará un enlace oficial para definir una nueva clave.
          </Typography>
          {forgotAlert && (
            <Alert severity={forgotAlert.type} sx={{ mb: 2 }}>
              {forgotAlert.msg}
            </Alert>
          )}
          <TextField
            fullWidth
            size="small"
            label="Correo Institucional"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            disabled={forgotLoading}
            autoFocus
          />
          <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
            <strong>Nota para entornos de prueba:</strong> Si utiliza cuentas institucionales simuladas sin buzón de correo activo, contacte a su Administrador del Secretariado Técnico (SRS) para asistencia de acceso.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setOpenForgotModal(false)} disabled={forgotLoading} color="inherit">
            Cerrar
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            disabled={forgotLoading || !forgotEmail.trim()} 
            onClick={handleSendForgotEmail}
          >
            {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Enviar Enlace'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
