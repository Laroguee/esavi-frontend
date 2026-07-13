import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Select, MenuItem, FormControl, ListSubheader } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import GavelIcon from '@mui/icons-material/Gavel';
import { useAuthStore, type Role } from '../../store/useAuthStore';


const drawerWidth = 260;

export default function MainLayout() {
  const navigate = useNavigate();
  const { currentRole, setRole } = useAuthStore();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* ================= BARRA SUPERIOR ================= */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <HealthAndSafetyIcon sx={{ mr: 2, fontSize: 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ lineHeight: 1.2 }}>
              Sistema Nacional ESAVI
            </Typography>
            <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
              El Salvador
            </Typography>
          </Box>

          {/* SELECTOR DINÁMICO DE ROLES */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'white' }}>Simular Rol:</Typography>
            <FormControl size="small" variant="outlined">
              <Select
                value={currentRole}
                onChange={(e) => setRole(e.target.value as Role)}
                sx={{ 
                  color: 'white', bgcolor: 'rgba(255,255,255,0.1)',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'secondary.main' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'secondary.main' }
                }}
              >
                <ListSubheader sx={{ bgcolor: '#eee', lineHeight: '30px' }}>NIVEL INSTITUCIONAL</ListSubheader>
                <MenuItem value="ESAVI_INSTITUCIONAL">Referente ESAVI Institucional</MenuItem>
                <MenuItem value="EPIDEMIO_INSTITUCIONAL">Epidemiólogo Institucional</MenuItem>
                <MenuItem value="INMUNO_INSTITUCIONAL">Inmunizaciones Institucional</MenuItem>
                
                <ListSubheader sx={{ bgcolor: '#eee', lineHeight: '30px' }}>NIVEL LOCAL (Campo)</ListSubheader>
                <MenuItem value="ESAVI_LOCAL">Referente ESAVI Local (Clínico)</MenuItem>
                <MenuItem value="EPIDEMIO_LOCAL">Epidemiólogo Local</MenuItem>
                <MenuItem value="INMUNO_LOCAL">Inmunizaciones Local</MenuItem>

                <ListSubheader sx={{ bgcolor: '#eee', lineHeight: '30px' }}>NIVEL CENTRAL / EXTERNO</ListSubheader>
                <MenuItem value="SECRETARIADO">Secretariado (SRS)</MenuItem>
                <MenuItem value="COMITE_EXTERNO">Comité Evaluador Externo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ================= MENÚ LATERAL ================= */}
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
        <Toolbar /> 
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/')}>
                <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
                <ListItemText primary="Bandeja de Casos" />
              </ListItemButton>
            </ListItem>

            {/* REGLA: SOLO EL ESAVI INSTITUCIONAL CREA EL CASO */}
            {currentRole === 'ESAVI_INSTITUCIONAL' && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/notificacion-inicial')}>
                  <ListItemIcon><AddCircleIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Notificar ESAVI (Fase 1)" />
                </ListItemButton>
              </ListItem>
            )}

            {/* REGLA: LOS LOCALES VEN EL BOTÓN DE CAMPO */}
            {currentRole.includes('LOCAL') && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/trabajo-campo')}>
                  <ListItemIcon><SearchIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Mi Trabajo de Campo" />
                </ListItemButton>
              </ListItem>
            )}

            {/* REGLA: EL COMITÉ VE LOS DICTÁMENES */}
            {currentRole === 'COMITE_EXTERNO' && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/comite-causalidad')}>
                  <ListItemIcon><GavelIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Dictámenes Causalidad" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Toolbar /> 
        <Typography variant="overline" color="secondary" sx={{ fontWeight: 'bold' }}>
          PERFIL ACTIVO: {currentRole.replace(/_/g, ' ')}
        </Typography>
        <Box sx={{ mt: 2 }}>
       
       <Outlet />
     </Box>
      </Box>
    </Box>
  );
}