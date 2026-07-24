import React, { useState, useCallback } from 'react';
import { 
  Box, Paper, Typography, Tabs, Tab, Grid, Button, 
  List, ListItem, ListItemIcon, ListItemText, IconButton, 
  Divider, Chip 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';

// Tipos de las categorías obligatorias del repositorio (Anexo I)
type CategoriaEvidencia = 'clinica' | 'pni' | 'epidemiologica' | 'general';

interface CategoriaConfig {
  id: CategoriaEvidencia;
  label: string;
  description: string;
}

const CATEGORIAS: CategoriaConfig[] = [
  { id: 'clinica', label: 'Información Clínica', description: 'Historia clínica, epicrisis, resultados de laboratorio, autopsias.' },
  { id: 'pni', label: 'Información de PNI', description: 'Carnet de vacunación, registros del puesto, control de cadena de frío.' },
  { id: 'epidemiologica', label: 'Información Epidemiológica', description: 'Fichas de investigación comunitaria, mapas, entrevistas de campo.' },
  { id: 'general', label: 'Información General', description: 'DUI, pasaporte, otros documentos administrativos del paciente.' },
];

// Interfaz para extender el archivo nativo con su URL de previsualización
interface FileWithPreview {
  file: File;
  previewUrl: string;
}

interface GestorEvidenciasProps {
  caseId: string;
}

// Componente Auxiliar para Pestañas
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Formateador de bytes a KB / MB
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function GestorEvidencias({ caseId }: GestorEvidenciasProps) {
  const [tabIndex, setTabIndex] = useState(0);
  
  // Estado que agrupa los archivos por categoría
  const [archivos, setArchivos] = useState<Record<CategoriaEvidencia, FileWithPreview[]>>({
    clinica: [],
    pni: [],
    epidemiologica: [],
    general: [],
  });

  // Estado para estilos visuales de Drag & Drop
  const [dragActive, setDragActive] = useState<CategoriaEvidencia | null>(null);

  const handleDrag = useCallback((e: React.DragEvent, categoriaId: CategoriaEvidencia) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(categoriaId);
    } else if (e.type === 'dragleave') {
      setDragActive(null);
    }
  }, []);

  const processFiles = (filesList: FileList | File[], categoriaId: CategoriaEvidencia) => {
    const validFiles: FileWithPreview[] = [];
    
    Array.from(filesList).forEach((file) => {
      // Validar tipo de archivo
      if (file.type.match('image.*') || file.type === 'application/pdf') {
        validFiles.push({
          file,
          previewUrl: URL.createObjectURL(file), // Generamos URL nativa temporal
        });
      } else {
        alert(`El archivo ${file.name} no es válido. Solo se permiten imágenes y PDFs.`);
      }
    });

    setArchivos((prev) => ({
      ...prev,
      [categoriaId]: [...prev[categoriaId], ...validFiles],
    }));
  };

  const handleDrop = useCallback((e: React.DragEvent, categoriaId: CategoriaEvidencia) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files, categoriaId);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, categoriaId: CategoriaEvidencia) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files, categoriaId);
    }
  };

  const removeFile = (categoriaId: CategoriaEvidencia, indexToRemove: number) => {
    setArchivos((prev) => {
      // Revocamos la URL de memoria para evitar fugas (Memory Leaks)
      URL.revokeObjectURL(prev[categoriaId][indexToRemove].previewUrl);
      
      const newArray = prev[categoriaId].filter((_, index) => index !== indexToRemove);
      return { ...prev, [categoriaId]: newArray };
    });
  };

  const handleSaveAll = () => {
    console.log("Evidencias listas para subir a la API:", archivos);
    
    const totalArchivos = Object.values(archivos).reduce((acc, catArr) => acc + catArr.length, 0);
    
    if (totalArchivos === 0) {
      alert("No hay archivos nuevos para guardar.");
      return;
    }

    alert(`Simulando subida de ${totalArchivos} archivos al Repositorio del caso ${caseId}... ¡Guardado exitoso!`);
  };

  return (
    <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
      
      {/* CABECERA DEL REPOSITORIO */}
      <Box sx={{ bgcolor: '#f4f6f8', p: 3, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FolderSpecialIcon color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>Repositorio Digital de Evidencias</Typography>
            <Typography variant="body2" color="text.secondary">Gestor documental oficial estructurado según el Anexo I.</Typography>
          </Box>
        </Box>
        <Chip label={`Expediente: ${caseId}`} color="secondary" sx={{ fontWeight: 'bold', fontSize: '1rem' }} />
      </Box>

      {/* PESTAÑAS DE CATEGORÍAS */}
      <Tabs 
        value={tabIndex} 
        onChange={(_, val) => setTabIndex(val)} 
        indicatorColor="primary" 
        textColor="primary" 
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {CATEGORIAS.map((cat) => (
          <Tab 
            key={cat.id} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {cat.label}
                {archivos[cat.id].length > 0 && (
                  <Chip label={archivos[cat.id].length} size="small" color="secondary" sx={{ height: 20 }} />
                )}
              </Box>
            } 
            sx={{ fontWeight: 'bold' }} 
          />
        ))}
      </Tabs>

      {/* CONTENEDOR DE DROPZONES */}
      <Box sx={{ p: 4 }}>
        {CATEGORIAS.map((cat, index) => (
          <TabPanel key={cat.id} value={tabIndex} index={index}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{cat.label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{cat.description}</Typography>
            
            <Grid container spacing={4}>
              
              {/* ÁREA DE DRAG & DROP */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  onDragEnter={(e) => handleDrag(e, cat.id)}
                  onDragLeave={(e) => handleDrag(e, cat.id)}
                  onDragOver={(e) => handleDrag(e, cat.id)}
                  onDrop={(e) => handleDrop(e, cat.id)}
                  component="label"
                  sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed',
                    borderColor: dragActive === cat.id ? 'secondary.main' : 'primary.main',
                    bgcolor: dragActive === cat.id ? '#fff8e1' : '#f9fafd',
                    borderRadius: 2, p: 4, cursor: 'pointer', transition: 'all 0.2s ease',
                    minHeight: 200,
                    '&:hover': { bgcolor: '#e3f2fd', borderColor: 'primary.dark' }
                  }}
                >
                  <CloudUploadIcon color={dragActive === cat.id ? 'secondary' : 'primary'} sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h6" color="text.primary" align="center" gutterBottom>
                    Arrastre sus archivos aquí
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    o haga clic para explorar en su equipo.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Permitido: .pdf, .jpg, .png
                  </Typography>
                  <input 
                    type="file" 
                    multiple 
                    hidden 
                    accept="image/*,application/pdf" 
                    onChange={(e) => handleChange(e, cat.id)} 
                  />
                </Box>
              </Grid>

              {/* LISTA DE PREVISUALIZACIÓN */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ minHeight: 200, maxHeight: 300, overflowY: 'auto', bgcolor: '#ffffff' }}>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Archivos a subir ({archivos[cat.id].length})</Typography>
                  </Box>
                  
                  {archivos[cat.id].length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No hay archivos seleccionados en esta categoría.</Typography>
                    </Box>
                  ) : (
                    <List sx={{ pt: 0 }}>
                      {archivos[cat.id].map((fileObj, idx) => {
                        const isPdf = fileObj.file.type === 'application/pdf';
                        return (
                          <React.Fragment key={`${fileObj.file.name}-${idx}`}>
                            <ListItem
                              secondaryAction={
                                <IconButton edge="end" color="error" onClick={() => removeFile(cat.id, idx)}>
                                  <DeleteIcon />
                                </IconButton>
                              }
                            >
                              <ListItemIcon>
                                {isPdf ? <PictureAsPdfIcon color="error" fontSize="large" /> : (
                                  <Box 
                                    component="img" 
                                    src={fileObj.previewUrl} 
                                    alt="preview" 
                                    sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, border: '1px solid #ccc' }} 
                                  />
                                )}
                              </ListItemIcon>
                              <ListItemText 
                                primary={<Typography variant="body2" noWrap sx={{ fontWeight: 'medium' }}>{fileObj.file.name}</Typography>}
                                secondary={formatBytes(fileObj.file.size)}
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        );
                      })}
                    </List>
                  )}
                </Paper>
              </Grid>
            </Grid>

          </TabPanel>
        ))}
      </Box>

      {/* BOTÓN FINAL DE GUARDADO */}
      <Box sx={{ p: 3, bgcolor: '#f4f6f8', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" size="large" startIcon={<SaveIcon />} onClick={handleSaveAll} sx={{ px: 4, fontWeight: 'bold' }}>
          Guardar Evidencias en Repositorio
        </Button>
      </Box>

    </Paper>
  );
}