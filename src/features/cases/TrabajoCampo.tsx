import { Box, Paper, Typography, Grid, Card, CardContent, Chip, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MapIcon from '@mui/icons-material/Map';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuthStore } from '../../store/useAuthStore';

// --- MOCK DATA CON GEOGRAFÍA SALVADOREÑA ---
const mockCasosCampo = [
  { id: 'ESAVI-MINSAL-2025-042', paciente: 'Ana Gómez', municipio: 'San Miguel, San Miguel', estado: 'Pendiente de Investigación', completado: false },
  { id: 'ESAVI-ISSS-2025-089', paciente: 'Luis Torres', municipio: 'Apopa, San Salvador', estado: 'En Proceso', completado: false },
  { id: 'ESAVI-MINSAL-2025-104', paciente: 'Carmen Díaz', municipio: 'Chalatenango, Chalatenango', estado: 'Documentación Finalizada', completado: true },
];

export default function TrabajoCampo() {
  const navigate = useNavigate();
  const { currentRole } = useAuthStore();

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

  // Componente interno para las tarjetas de métricas
  const MetricCard = ({ title, value, icon, color }: any) => (
    <Card elevation={2} sx={{ borderLeft: '4px solid', borderColor: color, height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ bgcolor: `${color}20`, p: 1.5, borderRadius: '50%', display: 'flex' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="bold" color={color}>{value}</Typography>
          <Typography variant="body2" color="text.secondary" fontWeight="medium">{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  );

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
          <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">ROL ACTIVO</Typography>
          <Chip label={currentRole?.replace('_', ' ')} color="primary" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }} />
        </Box>
      </Box>

      {/* DASHBOARD DE MÉTRICAS */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={4}>
          <MetricCard title="Casos Asignados a mi Región" value={14} color="#1976d2" icon={<MapIcon color="primary" fontSize="large" />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard title="Fichas Pendientes de Llenar" value={3} color="#ed6c02" icon={<AssignmentLateIcon color="warning" fontSize="large" />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard title="Formularios Completados (Mes)" value={11} color="#2e7d32" icon={<FactCheckIcon color="success" fontSize="large" />} />
        </Grid>
      </Grid>

      {/* TABLA DE CASOS ASIGNADOS */}
      <Typography variant="h6" color="primary.dark" fontWeight="bold" sx={{ mb: 2 }}>
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
            {mockCasosCampo.map((caso) => (
              <TableRow key={caso.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell fontWeight="medium">{caso.id}</TableCell>
                <TableCell>{caso.paciente}</TableCell>
                <TableCell>{caso.municipio}</TableCell>
                <TableCell>
                  <Chip 
                    label={caso.estado} 
                    size="small" 
                    color={caso.completado ? 'success' : 'warning'} 
                    variant={caso.completado ? 'filled' : 'outlined'} 
                  />
                </TableCell>
                <TableCell align="center">
                  {getActionBtn(caso.id, caso.completado)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
}