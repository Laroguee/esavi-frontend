import { Box, Paper, Typography, Grid, Chip } from '@mui/material';

interface VisorAnexoLecturaProps {
  dataString: string | Record<string, any>;
  titulo: string;
}

export default function VisorAnexoLectura({ dataString, titulo }: VisorAnexoLecturaProps) {
  let data: Record<string, any> = {};

  if (!dataString) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
        <Typography color="text.secondary">No hay información disponible para este anexo.</Typography>
      </Paper>
    );
  }

  try {
    data = typeof dataString === 'string' ? JSON.parse(dataString) : dataString;
  } catch (error) {
    console.error("Error parseando anexo:", error);
    return (
      <Paper variant="outlined" sx={{ p: 3, borderColor: 'error.main', bgcolor: 'error.light' }}>
        <Typography color="error">Error al cargar la información del anexo (Formato inválido).</Typography>
      </Paper>
    );
  }

  const formatearLlave = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderValor = (value: any) => {
    if (typeof value === 'boolean') {
      return <Chip size="small" label={value ? 'Sí' : 'No'} color={value ? 'success' : 'default'} />;
    }
    if (value === null || value === undefined || value === '') {
      return <Typography variant="body2" color="text.secondary"><em>N/A</em></Typography>;
    }
    if (Array.isArray(value)) {
      return <Typography variant="body2">{value.join(', ')}</Typography>;
    }
    if (typeof value === 'object') {
      return <Typography variant="body2">{JSON.stringify(value)}</Typography>;
    }
    return <Typography variant="body2">{String(value)}</Typography>;
  };

  return (
    <Paper variant="outlined" sx={{ p: 4, mb: 3 }}>
      <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
        {titulo}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {Object.entries(data).map(([key, value]) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
            <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, height: '100%' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>
                {formatearLlave(key)}
              </Typography>
              {renderValor(value)}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
