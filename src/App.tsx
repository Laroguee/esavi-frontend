import { AppBar, Toolbar, Typography, Button, Container, Box, Paper } from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

function App() {
  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Barra de Navegación Superior */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <HealthAndSafetyIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Sistema ESAVI - El Salvador
          </Typography>
          <Button color="inherit">Iniciar Sesión</Button>
        </Toolbar>
      </AppBar>

      {/* Contenido Principal */}
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="primary" gutterBottom>
            Bienvenido al Sistema de Vigilancia
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Esta es la arquitectura base del sistema. Muy pronto aquí veremos la bandeja de entrada del Referente ESAVI y los formularios de los anexos.
          </Typography>
          <Button variant="contained" color="secondary" size="large" sx={{ mt: 2 }}>
            Simular Nuevo Caso
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;