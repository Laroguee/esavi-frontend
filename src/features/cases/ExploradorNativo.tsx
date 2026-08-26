import { useState, useEffect } from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CircularProgress, Alert } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import { listarArchivosCaso } from '../../services/googleSheetsService';
import VisorArchivos from './VisorArchivos';

interface ExploradorProps {
  idCaso: string;
}

interface Archivo {
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

interface Carpeta {
  carpeta: string;
  archivos: Archivo[];
}

export default function ExploradorNativo({ idCaso }: ExploradorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estructura, setEstructura] = useState<Carpeta[]>([]);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    async function cargarExplorador() {
      try {
        setLoading(true);
        const res = await listarArchivosCaso(idCaso);
        if (res.success) {
          // Ordenar carpetas alfabéticamente
          const carpetasOrdenadas = res.data.sort((a: Carpeta, b: Carpeta) => a.carpeta.localeCompare(b.carpeta));
          setEstructura(carpetasOrdenadas);
        } else {
          setError(res.error || 'No se pudo cargar la estructura de archivos.');
        }
      } catch (err: any) {
        setError(err.message || 'Error de conexión.');
      } finally {
        setLoading(false);
      }
    }
    cargarExplorador();
  }, [idCaso]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (mimeType.includes('image')) return <ImageIcon color="primary" />;
    return <InsertDriveFileIcon color="action" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">Mapeando Repositorio en Google Drive...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (estructura.length === 0) {
    return <Alert severity="info">No se encontraron subcarpetas para este expediente.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, minHeight: '60vh' }}>
      {/* Panel Izquierdo: Árbol de Directorios */}
      <Box sx={{ width: { xs: '100%', md: '35%' }, borderRight: { md: '1px solid #e0e0e0' }, pr: { md: 2 } }}>
        <Typography variant="h6" gutterBottom color="primary.main" sx={{ fontWeight: 'bold' }}>
          Árbol de Directorios
        </Typography>
        
        {estructura.map((carpeta) => (
          <Accordion key={carpeta.carpeta} disableGutters variant="outlined" sx={{ mb: 1, borderRadius: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderIcon color="warning" />
                <Typography sx={{ fontWeight: 'medium' }}>{carpeta.carpeta}</Typography>
                <Typography variant="caption" color="text.secondary">({carpeta.archivos.length})</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              {carpeta.archivos.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, fontStyle: 'italic' }}>
                  Carpeta vacía
                </Typography>
              ) : (
                <List disablePadding>
                  {carpeta.archivos.map((file) => (
                    <ListItem key={file.name} disablePadding divider>
                      <ListItemButton 
                        selected={archivoSeleccionado === file.url}
                        onClick={() => setArchivoSeleccionado(file.url)}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getFileIcon(file.mimeType)}
                        </ListItemIcon>
                        <ListItemText 
                          primary={<Typography variant="body2" noWrap>{file.name}</Typography>} 
                          secondary={<Typography variant="caption">{formatBytes(file.size)}</Typography>}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Panel Derecho: Visualizador de Archivos */}
      <Box sx={{ width: { xs: '100%', md: '65%' } }}>
        {archivoSeleccionado ? (
          <VisorArchivos url={archivoSeleccionado} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed #ccc' }}>
            <Typography color="text.secondary">Seleccione un archivo del panel izquierdo para visualizarlo.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
