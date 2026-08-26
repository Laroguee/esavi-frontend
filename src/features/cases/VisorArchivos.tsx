import { Box, Typography } from '@mui/material';

interface VisorArchivosProps {
  url: string;
}

export default function VisorArchivos({ url }: VisorArchivosProps) {
  if (!url) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.100', borderRadius: 2 }}>
        <Typography color="text.secondary">No hay archivo disponible para visualizar.</Typography>
      </Box>
    );
  }

  // Convertir URL normal a URL embeddable (iframe)
  let previewUrl = url;
  
  // 1. Si es una carpeta de Drive (folder.getUrl() de Apps Script)
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch) {
    previewUrl = `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
  } 
  // 2. Si es un archivo individual (file.getUrl())
  else if (url.includes('/view')) {
    previewUrl = url.replace(/\/view.*$/, '/preview');
  }

  return (
    <Box sx={{ width: '100%', height: '70vh', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <iframe 
        src={previewUrl} 
        width="100%" 
        height="100%" 
        style={{ border: 'none' }}
        allow="autoplay"
        title="Visor de Archivo"
      />
    </Box>
  );
}
