import { useEffect } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// --- MOCKS DE DATOS ---
const mockPendientes = [
  { idLocal: 'NOTIF-089', paciente: 'Ana Gómez', establecimiento: 'U.S. San Miguel', fecha: dayjs().subtract(1, 'hour').toISOString() },
  { idLocal: 'NOTIF-090', paciente: 'Luis Torres', establecimiento: 'Hospital Rosales', fecha: dayjs().subtract(4, 'hour').toISOString() }
];

const mockCasos = [
  { id: 'ESAVI-MINSAL-2025-001', paciente: 'Juan Pérez', vacuna: 'COVID-19', fase: 'Fase 2: Riesgo', fecha: dayjs().subtract(2, 'hour').toISOString() },
  { id: 'ESAVI-ISSS-2025-002', paciente: 'María López', vacuna: 'Influenza', fase: 'Fase 4: Investigación', fecha: dayjs().subtract(23, 'hour').toISOString() },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentRole } = useAuthStore();

  // =========================================================================
  // CONTROL DE ACCESO (RBAC - Redirección Automática)
  // =========================================================================
  useEffect(() => {
    if (!currentRole) return;
    
    // Si es Comité Externo, va a su bandeja limpia
    if (currentRole === 'COMITE_EXTERNO') {
      navigate('/bandeja-comite', { replace: true });
    }
    // Si es personal Local/Operativo, va a su panel de campo
    else if (['ESAVI_LOCAL', 'INMUNO_LOCAL', 'EPIDEMIO_LOCAL'].includes(currentRole)) {
      navigate('/trabajo-campo', { replace: true });
    }
    // (Roles Centrales e Institucionales se quedan en este Dashboard)
  }, [currentRole, navigate]);

  const getSLAStatus = (fechaIso: string) => {
    const horas = dayjs().diff(dayjs(fechaIso), 'hour');
    if (horas > 24) return { label: `Vencido (${horas}h)`, color: 'error', rowColor: '#ffebee' };
    if (horas > 20) return { label: `Por vencer (${horas}h)`, color: 'warning', rowColor: '#fff8e1' };
    return { label: `A tiempo (${horas}h)`, color: 'success', rowColor: 'inherit' };
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto' }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Bandeja Central de Casos
        </Typography>
        
        {/* BOTÓN CONDICIONAL: Solo el ESAVI Institucional puede notificar desde aquí */}
        {currentRole === 'ESAVI_INSTITUCIONAL' && (
          <Button variant="contained" color="secondary" size="large" onClick={() => navigate('/notificacion-inicial')}>
            + Registrar Notificación ESAVI
          </Button>
        )}
      </Box>

      {/* TABLA 1: PENDIENTES */}
      <Typography variant="h6" color="warning.dark" sx={{ mb: 2, fontWeight: 'bold' }}>⏳ Notificaciones Pendientes de Oficializar</Typography>
      <TableContainer component={Paper} elevation={2} sx={{ mb: 5, borderLeft: '5px solid', borderColor: 'warning.main' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#fff8e1' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID Local</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Paciente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Establecimiento</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockPendientes.map((notif) => (
              <TableRow key={notif.idLocal} hover onClick={() => navigate('/nuevo-caso')} sx={{ cursor: 'pointer' }}>
                <TableCell>{notif.idLocal}</TableCell>
                <TableCell>{notif.paciente}</TableCell>
                <TableCell>{notif.establecimiento}</TableCell>
                <TableCell><Chip label="Oficializar" color="warning" size="small" variant="outlined" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* TABLA 2: OFICIALES */}
      <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>📂 Casos Oficializados Activos</Typography>
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID Caso</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Paciente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fase Actual</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tiempo SLA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockCasos.map((caso) => {
              const sla = getSLAStatus(caso.fecha);
              return (
                <TableRow key={caso.id} hover onClick={() => navigate(`/caso/${caso.id}`)} sx={{ backgroundColor: sla.rowColor, cursor: 'pointer' }}>
                  <TableCell>{caso.id}</TableCell>
                  <TableCell>{caso.paciente}</TableCell>
                  <TableCell><Chip label={caso.fase} size="small" /></TableCell>
                  <TableCell><Chip icon={<AccessTimeIcon />} label={sla.label} color={sla.color as any} size="small" /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
}