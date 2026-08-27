import { useState, useEffect } from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Select, MenuItem, FormControl, ListSubheader, 
  Badge, IconButton, Menu, Divider, Button
} from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import GavelIcon from '@mui/icons-material/Gavel';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CircleIcon from '@mui/icons-material/Circle';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useAuthStore, type Role } from '../../store/useAuthStore';
import { useCasesStore } from '../../store/useCasesStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import { listarEstablecimientos } from '../../services/adminService';

const drawerWidth = 260;

export default function MainLayout() {
  const navigate = useNavigate();
  // Se extrae la función logout del store global
  const { currentRole, userName, logout, setRole } = useAuthStore();

  // --- CONEXIÓN AL STORE CENTRAL DE CASOS ---
  const { notificaciones, marcarNotificacionLeidaStore, cargarDatosBackend } = useCasesStore();

  // --- CONEXIÓN AL STORE DE CATÁLOGOS ---
  const { setEstablecimientos } = useCatalogStore();

  useEffect(() => {
    // Cargar catálogos al iniciar sesión
    listarEstablecimientos().then(res => {
      if(res.success && res.data) {
        setEstablecimientos(res.data);
      }
    });

    // Cargar casos y notificaciones de Google Sheets
    cargarDatosBackend();
  }, [setEstablecimientos, cargarDatosBackend, currentRole]);

  // --- ESTADOS PARA EL MENÚ DE NOTIFICACIONES ---
  const [anchorElNotif, setAnchorElNotif] = useState<null | HTMLElement>(null);
  const openNotifMenu = Boolean(anchorElNotif);

  const handleOpenNotif = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotif(event.currentTarget);
  };

  const handleCloseNotif = () => {
    setAnchorElNotif(null);
  };

  // Función para manejar el Cierre de Sesión
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calcula cuántas notificaciones no están leídas desde el Store
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leido).length;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* ================= BARRA SUPERIOR ================= */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <HealthAndSafetyIcon sx={{ mr: 2, fontSize: 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ lineHeight: 1.2 }}>
              Sistema de Notificación ESAVI
            </Typography>
            <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
              El Salvador
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            

            {/* IDENTIFICACIÓN DE USUARIO (Reemplazo del simulador) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                Hola, {userName || 'Usuario'}
              </Typography>
            </Box>

            {/* CAMPANITA DE NOTIFICACIONES */}
            <IconButton color="inherit" onClick={handleOpenNotif} id="btn-notificaciones">
              <Badge badgeContent={notificacionesNoLeidas} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* BOTÓN DE CERRAR SESIÓN */}
            <IconButton color="inherit" onClick={handleLogout} title="Cerrar Sesión">
              <LogoutIcon />
            </IconButton>

            {/* MENÚ DESPLEGABLE DE NOTIFICACIONES */}
            <Menu
              anchorEl={anchorElNotif}
              open={openNotifMenu}
              onClose={handleCloseNotif}
              slotProps={{
                paper: {
                  elevation: 3,
                  sx: { width: 350, maxHeight: 400, mt: 1.5, overflowY: 'auto' }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5, bgcolor: '#f4f6f8', borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>Notificaciones Recientes</Typography>
              </Box>
              
              {notificaciones.map((notif) => (
                <Box key={notif.id}>
                  <MenuItem 
                    onClick={() => {
                      marcarNotificacionLeidaStore(notif.id);
                    }} 
                    sx={{ 
                      display: 'flex', alignItems: 'flex-start', py: 1.5, px: 2, gap: 1.5,
                      bgcolor: notif.leido ? 'transparent' : '#e3f2fd',
                      whiteSpace: 'normal' // Permite que el texto baje de línea si es largo
                    }}
                  >
                    <Box sx={{ mt: 0.5 }}>
                      <CircleIcon sx={{ fontSize: 10, color: notif.leido ? 'transparent' : 'primary.main' }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: notif.leido ? 'normal' : 'bold', color: 'text.primary', mb: 0.5 }}>
                        {notif.texto}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notif.fecha}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <Divider sx={{ my: 0 }} />
                </Box>
              ))}

              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Button size="small" color="primary" onClick={handleCloseNotif}>Ver Todas</Button>
              </Box>
            </Menu>

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

            {/* REGLA: MÓDULO DE ADMINISTRACIÓN (Exclusivo Nivel Central / SRS) */}
            {['ESAVI_INSTITUCIONAL', 'SECRETARIADO'].includes(currentRole as string) && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/administracion')}>
                  <ListItemIcon><ManageAccountsIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Panel de Administración" />
                </ListItemButton>
              </ListItem>
            )}

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
            {currentRole?.includes('LOCAL') && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => navigate('/')}>
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
          PERFIL ACTIVO: {currentRole?.replace(/_/g, ' ')}
        </Typography>
        <Box sx={{ mt: 2 }}><Outlet /></Box>
      </Box>
    </Box>
  );
}