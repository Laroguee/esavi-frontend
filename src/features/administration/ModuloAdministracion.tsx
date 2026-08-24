import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid
} from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import DomainAddIcon from '@mui/icons-material/DomainAdd';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { useAuthStore, MockUser } from '../../store/useAuthStore';

const MACRO_INSTITUCIONES = ['MINSAL', 'ISSS', 'FOSALUD', 'SRS', 'Sanidad Militar'];
const DIC_ESTABLECIMIENTOS: Record<string, string[]> = {
  'MINSAL': ['Hospital Nacional Rosales', 'Hospital Nacional Zacamil', 'Unidad de Salud Barrios', 'Región Metropolitana', 'Nivel Central'],
  'ISSS': ['Hospital Médico Quirúrgico', 'Policlínico Zacamil'],
  'FOSALUD': ['Unidad Médica Fosalud Centro'],
  'SRS': ['Nivel Central SRS'],
  'Sanidad Militar': ['Hospital Militar']
};

const mockEstablecimientos = [
  { id: 101, nombre: 'Hospital Nacional Rosales', tipo: 'Hospital Nivel III', sibasi: 'Centro (San Salvador)', institucion: 'MINSAL' },
  { id: 102, nombre: 'Unidad de Salud Barrios', tipo: 'UCSF Especializada', sibasi: 'Centro (San Salvador)', institucion: 'MINSAL' },
  { id: 103, nombre: 'Hospital Médico Quirúrgico', tipo: 'Hospital Especializado', sibasi: 'Centro (San Salvador)', institucion: 'ISSS' },
];

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return <div hidden={value !== index} {...other}>{value === index && <Box sx={{ pt: 4 }}>{children}</Box>}</div>;
}

export default function ModuloAdministracion() {
  const [tabIndex, setTabIndex] = useState(0);
  
  const usuarios = useAuthStore(state => state.usuarios);
  const agregarUsuario = useAuthStore(state => state.agregarUsuario);
  const editarUsuario = useAuthStore(state => state.editarUsuario);

  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<Partial<MockUser>>({
    name: '', dui: '', email: '', role: 'ESAVI_LOCAL', institucionMacro: '', establecimiento: '', activo: true
  });

  const handleOpenNew = () => {
    setIsEdit(false);
    setFormData({ name: '', dui: '', email: '', role: 'ESAVI_LOCAL', institucionMacro: '', establecimiento: '', activo: true });
    setOpenModal(true);
  };

  const handleEdit = (email: string) => {
    const user = usuarios.find(u => u.email === email);
    if (user) {
      setIsEdit(true);
      setFormData(user);
      setOpenModal(true);
    }
  };

  const handleSave = () => {
    if (isEdit && formData.email) {
      editarUsuario(formData.email, formData);
    } else {
      agregarUsuario({
        id: Date.now(),
        ...(formData as MockUser)
      });
    }
    setOpenModal(false);
  };

  const handleDeactivate = (email: string) => {
    const user = usuarios.find(u => u.email === email);
    if (user) {
      editarUsuario(email, { activo: !user.activo });
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
            Gestión centralizada de perfiles de acceso y estructura hospitalaria del SNIS.
          </Typography>
        </Box>
      </Box>

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
                  {usuarios.map((user) => (
                    <TableRow key={user.email} hover sx={{ opacity: user.activo ? 1 : 0.5 }}>
                      <TableCell sx={{ fontWeight: 'medium' }}>{user.name}</TableCell>
                      <TableCell>{user.dui || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role.replace('_', ' ')} 
                          size="small" 
                          color={user.role.includes('INSTITUCIONAL') || user.role === 'SECRETARIADO' ? 'primary' : 'default'}
                          variant={user.activo ? 'filled' : 'outlined'} 
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
                        <Tooltip title={user.activo ? "Desactivar Acceso" : "Usuario Desactivado"}>
                          <IconButton color={user.activo ? "error" : "default"} size="small" onClick={() => handleDeactivate(user.email)}>
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* =====================================================================
              PESTAÑA 2: ESTABLECIMIENTOS Y SIBASI
          ===================================================================== */}
          <TabPanel value={tabIndex} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>Catálogo Maestro de Red Integrada (SNIS)</Typography>
              <Button variant="contained" color="secondary" startIcon={<HealthAndSafetyIcon />}>
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
                  {mockEstablecimientos.map((estab) => (
                    <TableRow key={estab.id} hover>
                      <TableCell sx={{ fontWeight: 'medium', color: 'primary.main' }}>{estab.nombre}</TableCell>
                      <TableCell>{estab.tipo}</TableCell>
                      <TableCell>{estab.sibasi}</TableCell>
                      <TableCell>
                        <Chip label={estab.institucion} size="small" color={estab.institucion === 'MINSAL' ? 'info' : 'warning'} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar Establecimiento">
                          <IconButton color="primary" size="small" onClick={() => alert('Editar estab')}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth size="small" label="Nombre Completo" 
                value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth size="small" label="DUI" 
                value={formData.dui || ''} onChange={(e) => setFormData({...formData, dui: e.target.value})} 
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                fullWidth size="small" label="Correo Institucional" disabled={isEdit}
                value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                select fullWidth size="small" label="Establecimiento" 
                value={formData.establecimiento || ''} 
                disabled={!formData.institucionMacro}
                onChange={(e) => setFormData({...formData, establecimiento: e.target.value})}
              >
                {formData.institucionMacro && DIC_ESTABLECIMIENTOS[formData.institucionMacro]?.map(est => (
                  <MenuItem key={est} value={est}>{est}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}