import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, CircularProgress, Alert
} from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import DomainAddIcon from '@mui/icons-material/DomainAdd';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { type MockUser } from '../../store/useAuthStore';
import { useCatalogStore, type Establecimiento } from '../../store/useCatalogStore';
import { listarUsuarios, crearUsuario, editarUsuario, crearEstablecimiento, editarEstablecimiento, listarEstablecimientos } from '../../services/adminService';

const MACRO_INSTITUCIONES = ['MINSAL', 'ISSS', 'FOSALUD', 'SRS', 'Sanidad Militar'];

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return <div hidden={value !== index} {...other}>{value === index && <Box sx={{ pt: 4 }}>{children}</Box>}</div>;
}

export default function ModuloAdministracion() {
  const [tabIndex, setTabIndex] = useState(0);
  
  const [usuarios, setUsuarios] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<Partial<MockUser>>({
    name: '', dui: '', email: '', password: '', role: 'ESAVI_LOCAL', institucionMacro: '', establecimiento: '', activo: true
  });
  const [actionLoading, setActionLoading] = useState(false);

  const { establecimientos, setEstablecimientos } = useCatalogStore();

  const [openEstabModal, setOpenEstabModal] = useState(false);
  const [isEditEstab, setIsEditEstab] = useState(false);
  const [estabData, setEstabData] = useState<Partial<Establecimiento>>({
    nombre: '', tipo: '', sibasi: '', institucionMacro: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await listarUsuarios();
    if (res.success) {
      setUsuarios(res.data);
    } else {
      setError(res.error || 'Error cargando usuarios');
    }
    setLoading(false);
  };

  const fetchEstablecimientos = async () => {
    const res = await listarEstablecimientos();
    if (res.success) {
      setEstablecimientos(res.data);
    }
  };

  const handleOpenNew = () => {
    setIsEdit(false);
    setFormData({ name: '', dui: '', email: '', password: '', role: 'ESAVI_LOCAL', institucionMacro: '', establecimiento: '', activo: true });
    setOpenModal(true);
  };

  const handleEdit = (email: string) => {
    const user = usuarios.find(u => u.email === email);
    if (user) {
      setIsEdit(true);
      // No cargamos la contraseña para edición por seguridad. Si la cambian, se envía.
      setFormData({ ...user, password: '' });
      setOpenModal(true);
    }
  };

  const handleSave = async () => {
    setActionLoading(true);
    let res;
    if (isEdit && formData.email) {
      // Para editar, solo mandamos contraseña si escribieron algo
      const updates = { ...formData };
      if (!updates.password) delete updates.password;
      res = await editarUsuario(formData.email, updates);
    } else {
      if (!formData.password) {
        alert("Debe asignar una contraseña inicial al usuario.");
        setActionLoading(false);
        return;
      }
      res = await crearUsuario(formData);
    }

    if (res.success) {
      setOpenModal(false);
      fetchUsers(); // Recargar la lista
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  const handleDeactivate = async (email: string) => {
    const user = usuarios.find(u => u.email === email);
    if (user) {
      const nuevoEstado = !user.activo;
      // Convert true/false to boolean
      const isActive = nuevoEstado === true || String(nuevoEstado).toLowerCase() === 'true';
      const res = await editarUsuario(email, { activo: isActive });
      if (res.success) {
        fetchUsers();
      } else {
        alert("Error cambiando estado");
      }
    }
  };

  // ---- MANEJADORES DE ESTABLECIMIENTOS ----
  const handleOpenNewEstab = () => {
    setIsEditEstab(false);
    setEstabData({ nombre: '', tipo: '', sibasi: '', institucionMacro: '' });
    setOpenEstabModal(true);
  };

  const handleEditEstab = (id: number) => {
    const estab = establecimientos.find(e => e.id === id);
    if (estab) {
      setIsEditEstab(true);
      setEstabData(estab);
      setOpenEstabModal(true);
    }
  };

  const handleSaveEstab = async () => {
    if (!estabData.nombre || !estabData.tipo || !estabData.institucionMacro) {
      alert("Nombre, Tipo y Macro-Institución son obligatorios.");
      return;
    }
    setActionLoading(true);
    let res;
    if (isEditEstab && estabData.id) {
      res = await editarEstablecimiento(estabData.id, estabData);
    } else {
      res = await crearEstablecimiento(estabData);
    }

    if (res.success) {
      setOpenEstabModal(false);
      fetchEstablecimientos();
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  };

  const handleToggleEstab = async (id: number) => {
    const estab = establecimientos.find(e => e.id === id);
    if (estab) {
      const nuevoEstado = !(estab.activo === true || String(estab.activo).toLowerCase() === 'true');
      const res = await editarEstablecimiento(id, { activo: nuevoEstado });
      if (res.success) fetchEstablecimientos();
      else alert("Error cambiando estado");
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', pb: 8 }}>
      
      {/* HEADER DE ADMINISTRACIÓN */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <ManageAccountsIcon color="primary" sx={{ fontSize: 45 }} />
        <Box>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            Panel de Administración del Sistema
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión centralizada de perfiles de acceso y estructura hospitalaria del SNIS conectada a la Base de Datos.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* CONTENEDOR PRINCIPAL */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={tabIndex} 
          onChange={(_, val) => setTabIndex(val)} 
          indicatorColor="secondary" 
          textColor="primary" 
          variant="fullWidth" 
          sx={{ bgcolor: '#f4f6f8', borderBottom: '1px solid #e0e0e0' }}
        >
          <Tab icon={<PersonAddIcon />} iconPosition="start" label="Gestión de Usuarios" sx={{ fontWeight: 'bold', py: 2 }} />
          <Tab icon={<DomainAddIcon />} iconPosition="start" label="Establecimientos y SIBASI" sx={{ fontWeight: 'bold', py: 2 }} />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* =====================================================================
              PESTAÑA 1: GESTIÓN DE USUARIOS
          ===================================================================== */}
          <TabPanel value={tabIndex} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>Directorio de Personal Autorizado</Typography>
              <Button variant="contained" color="secondary" startIcon={<PersonAddIcon />} onClick={handleOpenNew}>
                + Nuevo Usuario
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#eeeeee' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nombre Completo</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>DUI</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Correo Institucional</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Rol / Nivel</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Institución (Macro)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Establecimiento</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usuarios.map((user) => {
                      const isActive = user.activo === true || String(user.activo).toLowerCase() === 'true';
                      return (
                      <TableRow key={user.email} hover sx={{ opacity: isActive ? 1 : 0.5 }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>{user.name}</TableCell>
                        <TableCell>{user.dui || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={String(user.role).replace('_', ' ')} 
                            size="small" 
                            color={String(user.role).includes('INSTITUCIONAL') || user.role === 'SECRETARIADO' ? 'primary' : 'default'}
                            variant={isActive ? 'filled' : 'outlined'} 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={user.institucionMacro || 'N/A'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{user.establecimiento || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar Usuario">
                            <IconButton color="primary" size="small" onClick={() => handleEdit(user.email)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isActive ? "Desactivar Acceso" : "Usuario Desactivado, Click para Activar"}>
                            <IconButton color={isActive ? "error" : "success"} size="small" onClick={() => handleDeactivate(user.email)}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )})}
                    {usuarios.length === 0 && (
                      <TableRow><TableCell colSpan={7} align="center">No hay usuarios registrados</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* =====================================================================
              PESTAÑA 2: ESTABLECIMIENTOS Y SIBASI
          ===================================================================== */}
          <TabPanel value={tabIndex} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>Catálogo Maestro de Red Integrada (SNIS)</Typography>
              <Button variant="contained" color="secondary" startIcon={<HealthAndSafetyIcon />} onClick={handleOpenNewEstab}>
                + Nuevo Establecimiento
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#eeeeee' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Establecimiento</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nivel / Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>SIBASI / Región</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Institución Rectora</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {establecimientos.map((estab) => {
                    const estabActive = estab.activo === true || String(estab.activo).toLowerCase() === 'true';
                    return (
                    <TableRow key={estab.id} hover sx={{ opacity: estabActive ? 1 : 0.5 }}>
                      <TableCell sx={{ fontWeight: 'medium', color: 'primary.main' }}>{estab.nombre}</TableCell>
                      <TableCell>{estab.tipo}</TableCell>
                      <TableCell>{estab.sibasi || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip label={estab.institucionMacro} size="small" color={estab.institucionMacro === 'MINSAL' ? 'info' : 'warning'} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar Establecimiento">
                          <IconButton color="primary" size="small" onClick={() => handleEditEstab(estab.id)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={estabActive ? "Desactivar" : "Activar"}>
                          <IconButton color={estabActive ? "error" : "success"} size="small" onClick={() => handleToggleEstab(estab.id)}>
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )})}
                  {establecimientos.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center">Cargando o sin establecimientos...</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

        </Box>
      </Paper>

      {/* MODAL NUEVO/EDITAR USUARIO */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth size="small" label="Nombre Completo" 
                value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth size="small" label="DUI" 
                value={formData.dui || ''} onChange={(e) => setFormData({...formData, dui: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth size="small" label="Correo Institucional" disabled={isEdit}
                value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth size="small" label={isEdit ? "Nueva Contraseña (opcional)" : "Contraseña Inicial"} 
                type="password"
                value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                select fullWidth size="small" label="Rol del Sistema" 
                value={formData.role || ''} onChange={(e) => setFormData({...formData, role: e.target.value as any})}
              >
                <MenuItem value="ESAVI_LOCAL">ESAVI Local (Clínico)</MenuItem>
                <MenuItem value="INMUNO_LOCAL">Inmunizaciones Local</MenuItem>
                <MenuItem value="EPIDEMIO_LOCAL">Epidemiología Local</MenuItem>
                <MenuItem value="ESAVI_INSTITUCIONAL">ESAVI Nivel Central</MenuItem>
                <MenuItem value="INMUNO_INSTITUCIONAL">Inmunizaciones Central</MenuItem>
                <MenuItem value="EPIDEMIO_INSTITUCIONAL">Epidemiología Central</MenuItem>
                <MenuItem value="SECRETARIADO">Secretariado Técnico</MenuItem>
                <MenuItem value="COMITE_EXTERNO">Comité Externo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                select fullWidth size="small" label="Macro-Institución" 
                value={formData.institucionMacro || ''} 
                onChange={(e) => setFormData({...formData, institucionMacro: e.target.value, establecimiento: ''})}
              >
                {MACRO_INSTITUCIONES.map(inst => (
                  <MenuItem key={inst} value={inst}>{inst}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                select fullWidth size="small" label="Establecimiento" 
                value={formData.establecimiento || ''} 
                disabled={!formData.institucionMacro}
                onChange={(e) => setFormData({...formData, establecimiento: e.target.value})}
              >
                {formData.institucionMacro && establecimientos.filter(e => e.institucionMacro === formData.institucionMacro && (e.activo === true || String(e.activo).toLowerCase() === 'true')).map(est => (
                  <MenuItem key={est.id} value={est.nombre}>{est.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} disabled={actionLoading}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL NUEVO/EDITAR ESTABLECIMIENTO */}
      <Dialog open={openEstabModal} onClose={() => setOpenEstabModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditEstab ? 'Editar Establecimiento' : 'Nuevo Establecimiento'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField 
                fullWidth size="small" label="Nombre del Establecimiento" 
                value={estabData.nombre || ''} onChange={(e) => setEstabData({...estabData, nombre: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                select fullWidth size="small" label="Tipo / Nivel" 
                value={estabData.tipo || ''} onChange={(e) => setEstabData({...estabData, tipo: e.target.value})}
              >
                <MenuItem value="Hospital Nivel III">Hospital Nivel III</MenuItem>
                <MenuItem value="Hospital Nivel II">Hospital Nivel II</MenuItem>
                <MenuItem value="Hospital Especializado">Hospital Especializado</MenuItem>
                <MenuItem value="UCSF Especializada">UCSF Especializada</MenuItem>
                <MenuItem value="UCSF Básica">UCSF Básica</MenuItem>
                <MenuItem value="Clínica Comunal">Clínica Comunal</MenuItem>
                <MenuItem value="Oficina Central">Oficina Central</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth size="small" label="SIBASI / Región (Opcional)" 
                value={estabData.sibasi || ''} onChange={(e) => setEstabData({...estabData, sibasi: e.target.value})} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                select fullWidth size="small" label="Institución Rectora" 
                value={estabData.institucionMacro || ''} onChange={(e) => setEstabData({...estabData, institucionMacro: e.target.value})}
              >
                {MACRO_INSTITUCIONES.map(inst => (
                  <MenuItem key={inst} value={inst}>{inst}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEstabModal(false)} disabled={actionLoading}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEstab} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}