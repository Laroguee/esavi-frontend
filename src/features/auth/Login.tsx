import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, InputAdornment } from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

type LoginFormData = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const loginFn = useAuthStore((state) => state.login);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = (data: LoginFormData) => {
    setErrorMsg(null); 
    const isSuccess = loginFn(data.email, data.password);
    
    if (isSuccess) {
      navigate('/'); 
    } else {
      setErrorMsg("Credenciales incorrectas o usuario no autorizado por la SRS.");
    }
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

            <Button type="submit" fullWidth variant="contained" color="secondary" size="large" sx={{ py: 1.5, fontWeight: 'bold' }}>
              INICIAR SESIÓN
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 4 }}>
            Acceso restringido a personal autorizado del MINSAL, ISSS y SRS.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}