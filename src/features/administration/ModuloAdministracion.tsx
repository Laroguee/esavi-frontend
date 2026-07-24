import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip 
} from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import DomainAddIcon from '@mui/icons-material/DomainAdd';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

// =========================================================================
// MOCK DATA (Simulando la Base de Datos del Administrador)
// =========================================================================
const mockUsuarios = [
  { id: 1, nombre: 'Dr. Roberto Cruz', dui: '04587412-3', correo: 'rcruz@minsal.gob.sv', rol: 'ESAVI_LOCAL', institucion: 'MINSAL', activo: true },
  { id: 2, nombre: 'Licda. Carmen Vega', dui: '06852147-9', correo: 'cvega@srs.gob.sv', rol: 'SECRETARIADO', institucion: 'SRS', activo: true },
  { id: 3, nombre: 'Dr. Armando Solis', dui: '02145874-1', correo: 'asolis@isss.gob.sv', rol: 'EPIDEMIO_INSTITUCIONAL', institucion: 'ISSS', activo: false },
  { id: 4, nombre: 'Enf. Patricia Silva', dui: '05874123-6', correo: 'psilva@minsal.gob.sv', rol: 'INMUNO_LOCAL', institucion: 'MINSAL', activo: true },
];

const mockEstablecimientos = [
  { id: 101, nombre: 'Hospital Nacional Rosales', tipo: 'Hospital Nivel III', sibasi: 'Centro (San Salvador)', institucion: 'MINSAL' },
  { id: 102, nombre: 'Unidad de Salud Barrios', tipo: 'UCSF Especializada', sibasi: 'Centro (San Salvador)', institucion: 'MINSAL' },
  { id: 103, nombre: 'Hospital Médico Quirúrgico', tipo: 'Hospital Especializado', sibasi: 'Centro (San Salvador)', institucion: 'ISSS' },
];

// Componente Auxiliar para Pestañas
interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return <div hidden={value !== index} {...other}>{value === index && <Box sx={{ pt: 4 }}>{children}</Box>}</div>;
}

export default function ModuloAdministracion() {
  const [tabIndex, setTabIndex] = useState(0);

  // Funciones de simulación de acciones CRUD
  const handleEdit = (id: number, type: string) => {
    alert(`Abriendo modal para EDITAR el ${type} con ID: ${id}`);
  };

  const handleDeactivate = (id: number, type: string) => {
    alert(`Simulando DESACTIVACIÓN del ${type} con ID: ${id}`);
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
              <Button variant="contained" color="secondary" startIcon={<PersonAddIcon />}>
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Institución</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockUsuarios.map((user) => (
                    <TableRow key={user.id} hover sx={{ opacity: user.activo ? 1 : 0.5 }}>
                      <TableCell sx={{ fontWeight: 'medium' }}>{user.nombre}</TableCell>
                      <TableCell>{user.dui}</TableCell>
                      <TableCell>{user.correo}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.rol.replace('_', ' ')} 
                          size="small" 
                          color={user.rol.includes('INSTITUCIONAL') || user.rol === 'SECRETARIADO' ? 'primary' : 'default'}
                          variant={user.activo ? 'filled' : 'outlined'} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={user.institucion} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar Usuario">
                          <IconButton color="primary" size="small" onClick={() => handleEdit(user.id, 'Usuario')}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.activo ? "Desactivar Acceso" : "Usuario Desactivado"}>
                          <IconButton color={user.activo ? "error" : "default"} size="small" onClick={() => handleDeactivate(user.id, 'Usuario')}>
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
                          <IconButton color="primary" size="small" onClick={() => handleEdit(estab.id, 'Establecimiento')}>
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
    </Box>
  );
}