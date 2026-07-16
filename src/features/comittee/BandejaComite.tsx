import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import { useNavigate } from 'react-router-dom';

// MOCK DATA: Exclusivo para casos aprobados por el Secretariado
const mockCasosComite = [
  { id: 'ESAVI-MINSAL-2025-045', paciente: 'Marta Rojas', vacuna: 'DPT', fechaAprobacion: '05/07/2026', estadoCierre: 'EN_COMITE' },
  { id: 'ESAVI-ISSS-2025-088', paciente: 'Jorge Ramos', vacuna: 'COVID-19', fechaAprobacion: '06/07/2026', estadoCierre: 'EN_COMITE' }
];

export default function BandejaComite() {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 1100, margin: 'auto', pb: 8 }}>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <GavelIcon color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            Bandeja del Comité de Expertos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Expedientes consolidados, auditados y listos para dictamen de causalidad final.
          </Typography>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderTop: '4px solid', borderColor: 'primary.main' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID Expediente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Paciente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Vacuna Implicada</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fecha de Aprobación SRS</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {mockCasosComite.map((caso) => (
              <TableRow key={caso.id} hover>
                <TableCell fontWeight="bold">{caso.id}</TableCell>
                <TableCell>{caso.paciente}</TableCell>
                <TableCell>{caso.vacuna}</TableCell>
                <TableCell>{caso.fechaAprobacion}</TableCell>
                <TableCell>
                  <Chip label="Aprobado para Comité" color="success" size="small" />
                </TableCell>
                <TableCell align="center">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<GavelIcon />}
                    size="small"
                    onClick={() => navigate(`/dictamen/${caso.id}`)}
                  >
                    Evaluar y Dictaminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {mockCasosComite.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No hay casos pendientes de evaluación.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
}