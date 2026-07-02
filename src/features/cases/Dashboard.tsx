import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const mockCasos = [
  { id: 'ESAVI-2025-001', paciente: 'Juan Pérez', vacuna: 'COVID-19', fase: 'Fase 1: Análisis', fecha: dayjs().subtract(2, 'hour').toISOString() },
  { id: 'ESAVI-2025-002', paciente: 'María López', vacuna: 'Influenza', fase: 'Fase 1: Análisis', fecha: dayjs().subtract(23, 'hour').toISOString() },
  { id: 'ESAVI-2025-003', paciente: 'Carlos Ruiz', vacuna: 'DPT', fase: 'Fase 2: Riesgo', fecha: dayjs().subtract(30, 'hour').toISOString() }
];

export default function Dashboard() {
  const navigate = useNavigate(); // Herramienta para movernos entre pantallas

  // Función que calcula si se pasó el tiempo SLA y pinta la fila
  const getSLAStatus = (fechaIso: string) => {
    const horas = dayjs().diff(dayjs(fechaIso), 'hour');
    if (horas > 24) return { label: `Vencido (${horas}h)`, color: 'error', rowColor: '#ffebee' };
    if (horas > 20) return { label: `Por vencer (${horas}h)`, color: 'warning', rowColor: '#fff8e1' };
    return { label: `A tiempo (${horas}h)`, color: 'success', rowColor: 'inherit' };
  };

  return (
    <>
      <Typography variant="h5" color="primary" sx={{ mb: 3, fontWeight: 'bold' }}>
        Bandeja de Entrada - Casos Activos
      </Typography>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID Caso</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Paciente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Vacuna</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fase Actual</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tiempo SLA</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {mockCasos.map((caso) => {
              const sla = getSLAStatus(caso.fecha);
              return (
                <TableRow 
                  key={caso.id} 
                  hover // <-- Hace que la fila se ilumine al pasar el mouse
                  onClick={() => navigate(`/caso/${caso.id}`)} // <-- ¡ESTA ES LA MAGIA! Nos lleva al expediente del caso al hacer clic
                  sx={{ backgroundColor: sla.rowColor, cursor: 'pointer' }} // <-- Cursor tipo manita
                >
                  <TableCell>{caso.id}</TableCell>
                  <TableCell>{caso.paciente}</TableCell>
                  <TableCell>{caso.vacuna}</TableCell>
                  <TableCell><Chip label={caso.fase} size="small" /></TableCell>
                  <TableCell>
                    <Chip icon={<AccessTimeIcon />} label={sla.label} color={sla.color as any} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}