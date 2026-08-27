import { useForm, Controller } from 'react-hook-form';
import { Box, Paper, Typography, TextField, Button, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useCasesStore } from '../../../store/useCasesStore';
import { guardarEnSheets } from '../../../services/googleSheetsService';
import { useReactToPrint } from 'react-to-print';
import { useRef, useState } from 'react';

const checklistOficial = [
  { id: 'chk_1', text: 'Identifique la zona geográfica y conozca las condiciones ambientales, de acceso o comunicación y los riesgos de seguridad.' },
  { id: 'chk_2', text: 'Establezca un cronograma de actividades.' },
  { id: 'chk_3', text: 'Asegurarse de que el equipo está adecuadamente identificado.' },
  { id: 'chk_4', text: 'Establezca los mecanismos de comunicación durante o después.' },
  { id: 'chk_5', text: 'Coordine medios de transporte para el equipo.' },
  { id: 'chk_6', text: 'Disponga los equipos electrónicos móviles o en papel que se van a requerir.' },
  { id: 'chk_7', text: 'En caso de requerir análisis adicionales (ej. toma de muestras), disponga el material necesario.' }
];

export default function AnexoIII_Logistica() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setLogisticaCompletada } = useAuthStore();
  const marcarAnexoCompletado = useCasesStore(state => state.marcarAnexoCompletado);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // === GENERACIÓN DE PDF ===
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Anexo_III_Logistica_${id}`,
  });

  const { control, handleSubmit } = useForm({
    defaultValues: {
      chk_1: false, chk_2: false, chk_3: false, chk_4: false,
      chk_5: false, chk_6: false, chk_7: false,
      observaciones: ''
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (id && import.meta.env.VITE_USE_API === 'true') {
        const payload = {
          id_caso: id,
          ...data
        };
        await guardarEnSheets('ANEXO_III', payload);

        await marcarAnexoCompletado(id, 'III');
        setLogisticaCompletada(true);
        
        const store = useCasesStore.getState();
        const casoActual = store.casos.find((c: any) => c.id === id);
        if (casoActual?.estadoFlujo === 'DEVUELTO_A_ERR') {
          store.avanzarCaso(id, 'EN_INVESTIGACION', 'Fase 4: Investigación', 'Corrección aplicada al anexo. Listo para re-evaluación institucional.');
        }
      } else if (id) {
        // Fallback para modo sin API
        marcarAnexoCompletado(id, 'III');
        setLogisticaCompletada(true);
      }
      
      alert("Checklist Logístico (Anexo III) guardado exitosamente.");
      navigate('/caso/' + id);
    } catch (error) {
      console.error("Error al guardar Anexo III:", error);
      alert("Hubo un error de conexión al guardar el Anexo III.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 800, margin: 'auto', pb: 8, pt: 2 }}>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          Anexo III: Checklist Logístico
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => handlePrint()}>
            Descargar PDF
          </Button>
          <Button variant="outlined" onClick={() => navigate('/caso/' + id)}>
            Cancelar
          </Button>
        </Box>
      </Box>

      <Box ref={componentRef} sx={{ p: 2, bgcolor: '#fff', borderRadius: 2 }}>
        <Paper variant="outlined" sx={{ p: 4, mb: 4, borderColor: '#e0e0e0', borderTop: '4px solid', borderTopColor: 'primary.main' }}>
        <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
          <ChecklistRtlIcon /> Preparación para el Trabajo de Campo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Previo al despliegue del Equipo de Respuesta Rápida (ERR), confirme que se han cumplido los siguientes preparativos de logística y seguridad.
        </Typography>

        <FormGroup sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
          {checklistOficial.map((item) => (
            <Controller
              key={item.id}
              name={item.id as any}
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} color="primary" />}
                  label={<Typography variant="body2">{item.text}</Typography>}
                  sx={{ alignItems: 'flex-start', m: 0, p: 1, bgcolor: field.value ? '#e8f5e9' : 'transparent', borderRadius: 1, transition: '0.2s' }}
                />
              )}
            />
          ))}
        </FormGroup>

        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Observaciones de seguridad y transporte</Typography>
        <Controller name="observaciones" control={control} render={({ field }) => (
          <TextField 
            {...field} 
            fullWidth 
            multiline 
            rows={3} 
            size="small" 
            placeholder="Ej. Vehículo asignado placa Nacional-123. Zonas con señal celular intermitente..." 
          />
        )}/>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="contained" color="secondary" type="submit" size="large" startIcon={<SaveIcon />} disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Logística de Campo'}
        </Button>
      </Box>

    </Box>
  );
}