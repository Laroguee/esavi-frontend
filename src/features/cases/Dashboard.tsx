import { useEffect, useState } from 'react';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Grid, TextField, MenuItem, InputAdornment } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useCasesStore } from '../../store/useCasesStore';

// --- MOCKS DE DATOS PENDIENTES (Intactos) ---
const mockPendientes = [
  { idLocal: 'NOTIF-089', paciente: 'Ana Gómez', establecimiento: 'U.S. San Miguel', fecha: dayjs().subtract(1, 'hour').toISOString() },
  { idLocal: 'NOTIF-090', paciente: 'Luis Torres', establecimiento: 'Hospital Rosales', fecha: dayjs().subtract(4, 'hour').toISOString() }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentRole } = useAuthStore();

  // --- TRAEMOS LOS CASOS DEL STORE ---
  const casosGlobales = useCasesStore((state) => state.casos);

  // =========================================================================
  // ESTADOS PARA FILTROS DE BÚSQUEDA
  // =========================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroRiesgo, setFiltroRiesgo] = useState('Todos');

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
  }, [currentRole, navigate]);

  const getSLAStatus = (fechaIso: string) => {
    const horas = dayjs().diff(dayjs(fechaIso), 'hour');
    if (horas > 24) return { label: `Vencido (${horas}h)`, color: 'error', rowColor: '#ffebee' };
    if (horas > 20) return { label: `Por vencer (${horas}h)`, color: 'warning', rowColor: '#fff8e1' };
    return { label: `A tiempo (${horas}h)`, color: 'success', rowColor: 'inherit' };
  };

  // =========================================================================
  // LÓGICA DE FILTRADO (FRONTEND)
  // =========================================================================
  const casosFiltrados = casosGlobales.filter((caso) => {
    const matchesSearch = 
      caso.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      caso.paciente.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filtroEstado === 'Todos' || caso.fase === filtroEstado;
    const matchesRiesgo = filtroRiesgo === 'Todos' || caso.riesgo === filtroRiesgo;

    return matchesSearch && matchesEstado && matchesRiesgo;
  });

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

      {/* =========================================================================
          BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS
      ========================================================================= */}
      <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>📂 Casos Oficializados Activos</Typography>
      
      <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: '#f4f6f8' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por ID de Caso o Nombre del Paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { bgcolor: 'white' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Fase del Caso"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="Todos">Todos los Estados</MenuItem>
              <MenuItem value="Fase 2: Riesgo">Fase 2: Evaluación Riesgo</MenuItem>
              <MenuItem value="Fase 3: Asignación ERR">Fase 3: Asignación</MenuItem>
              <MenuItem value="Fase 4: Investigación">Fase 4: Investigación</MenuItem>
              <MenuItem value="Fase 5: Control Calidad">Fase 5: Control Calidad</MenuItem>
              <MenuItem value="Fase 6: Dictamen">Fase 6: Comité Causalidad</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Nivel de Riesgo"
              value={filtroRiesgo}
              onChange={(e) => setFiltroRiesgo(e.target.value)}
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="Todos">Todos los Riesgos</MenuItem>
              <MenuItem value="Bajo">Riesgo Bajo (Local)</MenuItem>
              <MenuItem value="Medio">Riesgo Medio (Dept.)</MenuItem>
              <MenuItem value="Alto">Riesgo Alto (Regional)</MenuItem>
              <MenuItem value="Crítico">Riesgo Crítico (Nacional)</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* TABLA 2: OFICIALES (Aplica el filtro: casosFiltrados) */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID Caso</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Paciente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fase Actual</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Estado de Flujo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Nivel de Riesgo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tiempo SLA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {casosFiltrados.length > 0 ? (
              casosFiltrados.map((caso) => {
                const sla = getSLAStatus(caso.fecha);
                return (
                  // COLOR DE FILA DINÁMICO SEGÚN ESTADO DE FLUJO
                  <TableRow key={caso.id} hover onClick={() => navigate(`/caso/${caso.id}`)} sx={{ backgroundColor: caso.estadoFlujo !== 'NORMAL' ? '#ffebee' : sla.rowColor, cursor: 'pointer' }}>
                    <TableCell>{caso.id}</TableCell>
                    <TableCell>{caso.paciente}</TableCell>
                    <TableCell><Chip label={caso.fase} size="small" /></TableCell>
                    
                    <TableCell>
                      {caso.estadoFlujo !== 'NORMAL' ? (
                        <Chip icon={<WarningAmberIcon />} label="Con Observaciones" color="error" size="small" variant="filled" />
                      ) : (
                        <Chip label="Normal" color="default" size="small" variant="outlined" />
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color={
                        caso.riesgo === 'Crítico' ? 'error.main' :
                        caso.riesgo === 'Alto' ? 'warning.main' :
                        caso.riesgo === 'Medio' ? 'info.main' : 'success.main'
                      }>
                        {caso.riesgo}
                      </Typography>
                    </TableCell>
                    <TableCell><Chip icon={<AccessTimeIcon />} label={sla.label} color={sla.color as any} size="small" /></TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No se encontraron expedientes que coincidan con los criterios de búsqueda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
}