import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Select, MenuItem, FormControl } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import GavelIcon from '@mui/icons-material/Gavel'; // Icono para el Comité
import SearchIcon from '@mui/icons-material/Search'; // Icono para el ERR
import { useAuthStore, type Role } from '../../store/useAuthStore';

const drawerWidth = 260;

export default function MainLayout() {
  const navigate = useNavigate();
  // Traemos el rol actual y la función para cambiarlo desde nuestra "memoria" (Zustand)
  const { currentRole, setRole } = useAuthStore();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* BARRA SUPERIOR */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <HealthAndSafetyIcon sx={{ mr: 2, fontSize: 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ lineHeight: 1.2 }}>
              Sistema Nacional ESAVI
            </Typography>
            <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
              Vigilancia de Eventos Supuestamente Atribuibles a Vacunación
            </Typography>
          </Box>

          {/* SELECTOR DE ROL SIMULADO (Ideal para tu presentación) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'white' }}>Simular Rol:</Typography>
            <FormControl size="small" variant="outlined">
              <Select
                value={currentRole}
                onChange={(e) => setRole(e.target.value as Role)}
                sx={{ 
                  color: 'white', 
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'secondary.main' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'secondary.main' }
                }}
              >
                <MenuItem value="REFERENTE_ESAVI">Referente ESAVI</MenuItem>
                <MenuItem value="EQUIPO_COORDINADOR">Equipo Coordinador</MenuItem>
                <MenuItem value="ERR_CAMPO">Equipo Respuesta Rápida (ERR)</MenuItem>
                <MenuItem value="SECRETARIADO">Secretariado (Nivel Central)</MenuItem>
                <MenuItem value="COMITE_EXTERNO">Comité Externo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Toolbar>
      </AppBar>

      {/* MENÚ LATERAL INTELIGENTE */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar /> 
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {/* TODOS ven el Dashboard */}
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/')}>
                <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Bandeja de Casos" />
              </ListItemButton>
            </ListItem>

            {/* SOLO EL REFERENTE ESAVI puede notificar un caso nuevo (Fase 1) */}
            {currentRole === 'REFERENTE_ESAVI' && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/nuevo-caso')}>
                  <ListItemIcon><AddCircleIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Notificar ESAVI (Fase 1)" />
                </ListItemButton>
              </ListItem>
            )}

            {/* SOLO EL ERR ve el módulo de investigación (Fase 4) */}
            {currentRole === 'ERR_CAMPO' && (
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon><SearchIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Trabajo de Campo (Fase 4)" />
                </ListItemButton>
              </ListItem>
            )}

            {/* SOLO EL COMITE ve el módulo de Causalidad (Fase 6) */}
            {currentRole === 'COMITE_EXTERNO' && (
              <ListItem disablePadding>
                <ListItemButton>
                  <ListItemIcon><GavelIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Actas de Causalidad (Fase 6)" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      {/* CONTENIDO DINÁMICO */}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Toolbar /> 
        {/* Un pequeño letrero para que sepas en qué rol estás */}
        <Typography variant="overline" color="secondary" sx={{ fontWeight: 'bold' }}>
          VISTA ACTUAL: {currentRole.replace('_', ' ')}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Outlet /> 
        </Box>
      </Box>
    </Box>
  );
}