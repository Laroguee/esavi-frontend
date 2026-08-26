import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Tabs, Tab, CircularProgress, Alert, Button, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { obtenerExpediente } from '../../services/googleSheetsService';
import ExploradorNativo from './ExploradorNativo';
import VisorAnexoLectura from './VisorAnexoLectura';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`expediente-tabpanel-${index}`}
      aria-labelledby={`expediente-tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
}

export default function ExpedienteDigital() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expedienteData, setExpedienteData] = useState<any>(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await obtenerExpediente(id);
        if (res.success) {
          setExpedienteData(res.data);
        } else {
          setError(res.error || 'Error desconocido al cargar el expediente.');
        }
      } catch (err: any) {
        setError(err.message || 'Error de conexión.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">Descargando Expediente Clínico...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="error" variant="filled" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} variant="outlined">
          Volver
        </Button>
      </Box>
    );
  }

  const { expediente, matriz, asignaciones, anexos } = expedienteData || {};

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} color="inherit">
          Volver
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', flex: 1 }}>
          Expediente Digital: {id}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Tabs 
            value={tabIndex} 
            onChange={(_, newValue) => setTabIndex(newValue)} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab label="Repositorio Documental (Drive)" />
            <Tab label="Matriz de Riesgo" />
            <Tab label="Asignación ERR" />
            <Tab label="Anexos de Campo" />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {/* Tab 1: Drive Files */}
          <TabPanel value={tabIndex} index={0}>
            {expediente?.url_carpeta_drive ? (
               <>
                 <Typography variant="body1" sx={{ mb: 2 }}>
                   Visualizando estructura nativa del repositorio en Drive.
                 </Typography>
                 <ExploradorNativo idCaso={id!} />
               </>
            ) : (
               <Alert severity="info">No hay repositorio documental enlazado a este expediente.</Alert>
            )}
          </TabPanel>

          {/* Tab 2: Matriz de Riesgo */}
          <TabPanel value={tabIndex} index={1}>
             <VisorAnexoLectura dataString={matriz} titulo="Matriz de Evaluación de Riesgos (Fase 2)" />
          </TabPanel>

          {/* Tab 3: Asignaciones */}
          <TabPanel value={tabIndex} index={2}>
             <VisorAnexoLectura dataString={asignaciones} titulo="Designación del Equipo de Respuesta Rápida (Fase 3)" />
          </TabPanel>

          {/* Tab 4: Anexos Extra */}
          <TabPanel value={tabIndex} index={3}>
             {anexos && anexos.length > 0 ? (
               anexos.map((anexo: any, idx: number) => (
                 <Box key={idx} sx={{ mb: 4 }}>
                   <VisorAnexoLectura dataString={anexo.data_json || anexo} titulo={`Anexo: ${anexo.tipo_anexo || 'Campo'}`} />
                   {idx < anexos.length - 1 && <Divider sx={{ my: 4 }} />}
                 </Box>
               ))
             ) : (
               <Alert severity="info">Aún no se han consolidado anexos de campo para este expediente.</Alert>
             )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
