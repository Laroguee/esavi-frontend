import { Box, Paper, Typography, Grid, Card, CardContent, Chip, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MapIcon from '@mui/icons-material/Map';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuthStore } from '../../store/useAuthStore';

import { useCasesStore } from '../../store/useCasesStore';

export default function TrabajoCampo() {
  const navigate = useNavigate();
  const { currentRole } = useAuthStore();
  const { casos } = useCasesStore();

  // Validación de acceso estricto a roles locales
  const isLocalOperativo = ['ESAVI_LOCAL', 'INMUNO_LOCAL', 'EPIDEMIO_LOCAL'].includes(currentRole as string);

  if (!isLocalOperativo) {
    return (
      <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
        <Alert severity="warning" variant="filled" sx={{ fontWeight: 'bold' }}>
          ACCESO DENEGADO: Esta sección de "Mi Trabajo de Campo" es exclusiva para el personal de salud en funciones operativas locales. Las jefaturas deben utilizar la Bandeja Central.
        </Alert>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Regresar a la Bandeja Central
        </Button>
      </Box>
    );
  }

  // --- LÓGICA DE RENDEREIZADO DE ACCIONES SEGÚN EL ROL ---
  const getActionBtn = (casoId: string, completado: boolean) => {
    if (completado) {
      return <Chip label="Completado" color="success" size="small" />;
    }

    if (currentRole === 'INMUNO_LOCAL') {
      return (
        <Button size="small" variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} onClick={() => navigate(`/caso/${casoId}`)}>
          Gestionar Anexo V (Puesto)
        </Button>
      );
    }
    
    if (currentRole === 'EPIDEMIO_LOCAL') {
      return (
        <Button size="small" variant="contained" color="primary" endIcon={<ArrowForwardIcon />} onClick={() => navigate(`/caso/${casoId}`)}>
          Investigar Caso (ERR)
        </Button>
      );
    }

    if (currentRole === 'ESAVI_LOCAL') {
      return (
        <Button size="small" variant="outlined" color="primary" endIcon={<ArrowForwardIcon />} onClick={() => navigate(`/caso/${casoId}`)}>
          Revisión Clínica (Anexo VII)
        </Button>
      );
    }
  };

  function MetricCard({ title, value, icon, color }: any) {
    return (
      <Card elevation={2} sx={{ borderLeft: '4px solid', borderColor: color, height: '100%' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: '50%', display: 'flex' }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>{value}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>{title}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', pb: 8 }}>
      
      {/* HEADER DE CAMPO */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            Mi Trabajo de Campo
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Panel de control operativo territorial.
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>ROL ACTIVO</Typography>
          <Chip label={currentRole?.replace('_', ' ')} color="primary" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }} />
        </Box>
      </Box>

      {/* DASHBOARD DE MÉTRICAS */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard title="Casos Asignados a mi Región" value={14} color="#1976d2" icon={<MapIcon color="primary" fontSize="large" />} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard title="Fichas Pendientes de Llenar" value={3} color="#ed6c02" icon={<AssignmentLateIcon color="warning" fontSize="large" />} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard title="Formularios Completados (Mes)" value={11} color="#2e7d32" icon={<FactCheckIcon color="success" fontSize="large" />} />
        </Grid>
      </Grid>

      {/* TABLA DE CASOS ASIGNADOS */}
      <Typography variant="h6" color="primary.dark" sx={{ fontWeight: 'bold', mb: 2 }}>
        Expedientes Asignados para Investigación de Campo
      </Typography>
      
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID Caso</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Paciente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Territorio / Municipio</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Estado del Flujo</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Acción Requerida</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              const casosParaMostrar = casos.filter(caso => 
                caso.estadoFlujo === 'EN_INVESTIGACION' || 
                caso.estadoFlujo === 'ASIGNADO_A_ERR' || 
                caso.estadoFlujo === 'DEVUELTO_A_ERR'
              );

              return casosParaMostrar.length > 0 ? (
                casosParaMostrar.map((caso) => {
                  const isCompletado = false; // Estos estados son todos pendientes para el rol local
                  const labelEstado = caso.estadoFlujo === 'DEVUELTO_A_ERR' ? 'Devuelto por Observaciones' : caso.estadoFlujo === 'ASIGNADO_A_ERR' ? 'Recién Asignado' : 'En Proceso';
                  
                  return (
                    <TableRow key={caso.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 'medium' }}>{caso.id}</TableCell>
                      <TableCell>{caso.paciente}</TableCell>
                      <TableCell>{caso.establecimiento}</TableCell>
                      <TableCell>
                        <Chip 
                          label={labelEstado} 
                          size="small" 
                          color={caso.estadoFlujo === 'DEVUELTO_A_ERR' ? 'error' : 'warning'} 
                          variant={isCompletado ? 'filled' : 'outlined'} 
                        />
                      </TableCell>
                      <TableCell align="center">
                        {getActionBtn(caso.id, isCompletado)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No hay casos asignados a tu región en este momento.</Typography>
                  </TableCell>
                </TableRow>
              );
            })()}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
}