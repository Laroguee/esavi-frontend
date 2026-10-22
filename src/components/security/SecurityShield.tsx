import React from 'react';
import { Box, Paper, Typography, Button, Fade } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityIcon from '@mui/icons-material/Security';

interface SecurityShieldProps {
  active: boolean;
  onDismiss: () => void;
}

export default function SecurityShield({ active, onDismiss }: SecurityShieldProps) {
  if (!active) return null;

  return (
    <Fade in={active} timeout={250}>
      <Box
        onClick={onDismiss}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          cursor: 'pointer',
          p: 3,
        }}
      >
        <Paper
          elevation={8}
          onClick={(e) => e.stopPropagation()}
          sx={{
            p: 4,
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 36 }} />
          </Box>

          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
            Contenido Clínico Protegido
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            Por normativas de privacidad y protección de datos médicos sensibles del expediente ESAVI, la visualización se suspende automáticamente mientras la aplicación se encuentra en segundo plano.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SecurityIcon />}
            onClick={onDismiss}
            sx={{ px: 4, py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
          >
            Reanudar Visualización
          </Button>
        </Paper>
      </Box>
    </Fade>
  );
}
